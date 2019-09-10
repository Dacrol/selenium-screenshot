const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const express = require("express");
const port = 8090;

const { until, By } = webdriver;

const app = express();
app.use(express.json());

const driver = new webdriver.Builder()
  .forBrowser("chrome")
  .usingServer("http://standalone-chrome:4444/wd/hub")
  .build();

app.post('/generate', async (req, res) => {
  console.log(req.body);
  const data = await takeScreenshot(req.body.url, req.body);
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

async function takeScreenshot(url, {width = undefined, height = undefined, delay = 0} = {}) {
  if (width > 0 && height > 0) {
    await driver.manage().window().setRect({width: +width, height: +height})
  }
  await driver.get(url);
  await sleep(delay);
  const body = await driver.findElement(By.tagName('body'))
  const data = await body.takeScreenshot();
  return data;

  //const base64Data = data.replace(/^data:image\/png;base64,/, "");
  fs.writeFile("out.png", base64Data, "base64");
}

function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, +time);
  })
}