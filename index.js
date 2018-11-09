require("console-stamp")(console, {
  colors: {
    stamp: "yellow",
    label: "cyan",
    label: true,
    metadata: "green"
  }
});

const request = require("request-promise");
const fs = require("fs");
const readline = require("readline");
const xml2js = require("xml2js");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Shopify Link Scraper - Written by Eric!");

init();

function init() {
  rl.question("Please choose a site: ", answer => {
    let url = `https://${answer.toLowerCase()}.com/sitemap_products_1.xml`;
    let site = answer;
    rl.question("Please enter keywords: ", answer => {
      const keywords = answer.split(" ");
      startScraper(url, keywords, site);
    });
  });
}

function startScraper(url, keywords, site) {
  let opts = {
    uri: url,
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
    },
    gzip: true,
    resolveWithFullResponse: true
  };

  request(opts)
    .then(res => {
      const parsed = xml2js.parseString(res.body, (err, result) => {
        if (err || result == undefined) {
          console.log(err);
        }

        let products = result["urlset"]["url"];
        return scrapeLink(products, keywords, site);
      });
    })
    .catch(err => {
      if (err) {
        console.log(err);
        process.exit(1);
      }
    });
}

function scrapeLink(products, keywords, site) {
  let productUrl = [];
  let foundProduct = false;

  for (const product in products) {
    const datas = products[product]["image:image"];
    const link = products[product]["loc"][0];
    for (const data in datas) {
      const title = datas[data]["image:title"][0].toLowerCase();
      keywords.forEach(keyword => {
        if (title.indexOf(keyword.toLowerCase()) > -1) {
          foundProduct = true;
          productUrl.push(link);
        }
      });
    }
  }

  if (foundProduct) {
    console.log("Found Matching Product!");
    productUrl.forEach(product => {
      let jsonUrl = product + ".json";
      let opts = {
        uri: jsonUrl,
        method: "GET",
        resolveWithFullResponse: true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
        },
        gzip: true
      };

      request(opts)
        .then(res => {
          const parsed = JSON.parse(res.body);
          const title = parsed["product"]["title"];
          const variants = parsed["product"]["variants"];
          variants.forEach(variant => {
            let size = variant["title"];
            const variantId = variant["id"];
            let atc = "https://" + site + ".com/cart/" + variantId + ":1";

            console.log(
              "NAME: " + title + " | " + "SIZE: " + size + " | " + "ATC: " + atc
            );
          });
        })
        .catch(err => {
          if (err) {
            console.log(err);
            process.exit(1);
          }
        });
    });
  }
}
