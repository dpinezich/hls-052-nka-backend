const express = require('express');
var bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const xlsx = require('node-xlsx').default;

const app = express();

const fileName = 'db.json';

app.use((req, res, next) => {
  var now = new Date().toString();
  var log = `${now}: ${req.method} ${req.url}`;
  console.log(log);
  next();
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded

app.get('/', (req, res) => {
  res.json({
    route: '/'
  });
});

app.post('/save', (req, res) => {
  fs.exists(fileName, (exists) => {
    if (exists) {
      fs.readFile(fileName, (err, data) => {
        let allData;
        if (data) {
          allData = JSON.parse(data);
        } else {
          allData = {
            data: []
          };
        }
        allData.data.push(req.body);
        fs.writeFile(fileName, JSON.stringify(allData), (error) => {});
      });
    }
  });
  res.json({
    msg: 'done'
  });
});

app.get('/download', (req, res) => {
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

        res.set('Content-disposition', 'attachment; filename=SavedData.xlsx');
        res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        readStream.pipe(res);
      });
    } else {
      res.send('nothing to show');
    }
  });
});

app.get('/reset-db', (req, res) => {
  fs.writeFile(fileName, JSON.stringify({}), (error) => {});
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is up on port ${(process.env.PORT || 3000)}`);
});