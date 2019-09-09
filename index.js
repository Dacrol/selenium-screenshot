const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const express = require("express");
const port = 8090;

const app = express();

const driver = new webdriver.Builder()
  .forBrowser("chrome")
  .usingServer("http://standalone-chrome:4444/wd/hub")
  .build();

app.get(/^\/(.+)/, async (req, res) => {
  console.log(req.params)
  const data = await takeScreenshot(req.params[0]);
  const img = new Buffer(data, 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length 
  });
  res.end(img);
});

app.listen(port, () => {
  console.log('Screenshot server open on port ' + port)
})

async function takeScreenshot(url) {
  await driver.get(url);

  const data = await driver.takeScreenshot();
  return data;

  //const base64Data = data.replace(/^data:image\/png;base64,/, "");
  fs.writeFile("out.png", base64Data, "base64");
}
