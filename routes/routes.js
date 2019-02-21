const express = require('express');
const router = express.Router();
const fs = require('fs');
const stream = require('stream');
const xlsx = require('node-xlsx').default;
const mailer = require('../mailer');

const fileName = 'db.json';

router.get('/', (req, res) => {
  res.json({
    route: '/'
  });
});

router.post('/save', (req, res) => {
  fs.exists(fileName, (exists) => {
    let allData = {
      data: []
    };
    if (exists) {
      fs.readFile(fileName, (err, data) => {
        if (data) {
          allData = JSON.parse(data);
        }
        allData.data.push(req.body);
        fs.writeFile(fileName, JSON.stringify(allData), (error) => {});
      });
    } else {
      allData.data.push(req.body);
      fs.writeFile(fileName, JSON.stringify(allData), (error) => {});
    }
    mailer.sendConfirmationMail(req.body.email, req.body.name);
  });
  res.json({
    msg: 'done'
  });
});

router.get('/download', (req, res) => {
  fs.exists(fileName, (exists) => {
    if (exists) {
      fs.readFile(fileName, (err, data) => {
        let allData;
        if (data) {
          allData = JSON.parse(data)['data'];
        } else {
          allData = [];
        }
        const excelRows = allData.map((dbRow) => {
          return Object.values(dbRow);
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

module.exports = router;