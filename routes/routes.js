const express = require('express');
const router = express.Router();
const fs = require('fs');
const stream = require('stream');
const xlsx = require('node-xlsx').default;
const mailer = require('../mailer');
const TokenGenerator = require('uuid-token-generator');
const emailValidator = require('email-validator');

const fileName = 'db.json';

router.get('/', (req, res) => {
  res.json({
    route: '/'
  });
});

router.post('/save', (req, res) => {
  const email = req.body.email;
  if (email && emailValidator.validate(email)) {
    fs.exists(fileName, (exists) => {
      const token = new TokenGenerator(256, TokenGenerator.BASE62).generate();
      let allData = {};
      if (exists) {
        fs.readFile(fileName, (err, data) => {
          if (data) {
            allData = JSON.parse(data);
          }
          saveData(allData, req.body, token);
        });
      } else {
        saveData(allData, req.body, token);
      }
      const url = req.secure ? 'https://' : 'http://' + req.headers.host + '/validate/' + token;
      mailer.sendConfirmationMail(req.body.email, req.body.name, url);
      res.json({
        msg: 'done'
      });
    });
  } else {
    res.status(422);
    res.json({
      msg: 'invalid email'
    });
  }
});

router.get('/validate/:token?', (req, res) => {
  const token = req.params.token;
  if (token) {
    fs.exists(fileName, (exists) => {
      if (exists) {
        fs.readFile(fileName, (err, data) => {
          let allData;
          if (data) {
            allData = JSON.parse(data);
          }
          if (allData[token]) {
            allData[token]['validated'] = 1;
            fs.writeFile(fileName, JSON.stringify(allData), (error) => {});
            res.json({
              msg: 'validated'
            });
          } else {
            res.status(402);
            res.json({
              msg: 'invalid token'
            });
          }
        });
      } else {
        res.status(402);
        res.json({
          msg: 'invalid token'
        });
      }
    });
  } else {
    res.status(402);
    res.json({
      msg: 'no token specified'
    });
  }
});

router.get('/download', (req, res) => {
  fs.exists(fileName, (exists) => {
    if (exists) {
      fs.readFile(fileName, (err, data) => {
        let allData = {};
        if (data) {
          allData = JSON.parse(data);
        }
        const excelRows = Object.keys(allData).map((key) => {
          return Object.values(allData[key]);
        });
        const buffer = xlsx.build([{
          name: 'Saved Data',
          data: excelRows
        }]);
        var fileContents = Buffer.from(buffer, "base64");
        const readStream = new stream.PassThrough();
        readStream.end(fileContents);

        res.set('Content-disposition', 'attachment; filename=SavedData' + Date.now() + '.xlsx');
        res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        readStream.pipe(res);
      });
    } else {
      res.send('nothing to show');
    }
  });
});

router.get('/reset-db', (req, res) => {
  fs.writeFile(fileName, JSON.stringify({}), (error) => {});
  res.json({
    msg: 'done'
  });
});

function saveData(dataFromFile, clientData, token) {
  dataFromFile[token] = clientData;
  dataFromFile[token]['validated'] = 0;
  fs.writeFile(fileName, JSON.stringify(dataFromFile), (error) => {});
}

function sendEmail({ name, email, url }) {
  
}

module.exports = router;