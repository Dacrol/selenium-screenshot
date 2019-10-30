const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const express = require('express');
// @ts-ignore
const allowedIPs = require('./allowedIPs.json');
const port = 8090;
const timeout = 300000;

const { until, By, logging } = webdriver;

const app = express();
app.use(express.json());

let driver;

setTimeout(() => {
  driver = buildDriver();
  console.info('Driver ready');
}, 5000);

app.post('/generate', async (req, res) => {
  const requestor =
    req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(requestor);
  console.log(req.body);
  if (
    !allowedIPs.some(ip => {
      return ip === requestor;
    })
  ) {
    res.status(450).send("You're not supposed to be here.");
    return;
  }
  const data = await takeScreenshot(req.body.url, req.body);
  const img = new Buffer(data, 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length
  });
  res.end(img);
});

app.listen(port, () => {
  console.log('Screenshot server open on port ' + port);
});

async function takeScreenshot(
  url,
  { width = undefined, height = undefined, delay = 0 } = {}
) {
  const driver = await buildDriver();
  if (width > 0 && height > 0) {
    await driver
      .manage()
      .window()
      .setRect({
        x: +width,
        y: +height + 126,
        height: +height + 126,
        width: +width
      });
  }
  await driver.get(url);
  await sleep(delay);
  const body = await driver.findElement(By.tagName('body'));
  const data = await body.takeScreenshot();
  driver.close();
  return data;

  //const base64Data = data.replace(/^data:image\/png;base64,/, "");
  fs.writeFile('out.png', base64Data, 'base64');
}

app.post('/blindtask', async (req, res) => {
  const requestor =
    req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(requestor);
  console.log(req.body);
  if (
    !allowedIPs.some(ip => {
      return ip === requestor;
    })
  ) {
    res.status(450).send("You're not supposed to be here.");
    return;
  }
  const result = await blindtask(req.body);
  res.send(result);
});

async function blindtask({ url = '', delay = 0 } = {}) {
  const driver = await buildDriver()
  await driver.get(url);
  await sleep(delay);
  let logs = await driver
    .manage()
    .logs()
    .get(logging.Type.PERFORMANCE);
  let response = '';
  const log = logs
    .filter(entry => {
      if (entry.message.search('Network.requestWillBeSent') === -1) {
        return false;
      }
      return true;
    })
    .map(entry => {
      if (entry.message) {
        entry.message = JSON.parse(entry.message);
      }
      return entry;
    })
    .find(entry => {
      // return true
      if (
        entry.message &&
        entry.message.message &&
        entry.message.message.params &&
        entry.message.message.params.request
      ) {
        const url = entry.message.message.params.request.url;
        // console.log(entry.message)
        if (
          url &&
          (url.indexOf('clientsavecountriesmaxminforbeam') > -1 ||
            url.indexOf('clientsavecitiesgainsforbeam') > -1)
        ) {
          response = '{"savedAt":"' + url + '"}';
          return true;
        }
        return false;
      }
    });
    driver.close();
  return response;
}

function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, +time);
  });
}

async function buildDriver() {
  const options = new chrome.Options();
  const logging_prefs = new webdriver.logging.Preferences();
  logging_prefs.setLevel(
    webdriver.logging.Type.PERFORMANCE,
    webdriver.logging.Level.ALL
  );
  options.setLoggingPrefs(logging_prefs);
  const driver = await new webdriver.Builder()
    .forBrowser('chrome')
    .usingServer('http://standalone-chrome:4444/wd/hub')
    .withCapabilities(options)
    .build();
  driver
    .manage()
    .setTimeouts({ implicit: timeout, pageLoad: timeout, script: timeout });
  return driver;
}
