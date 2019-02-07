const express = require('express');
var bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

const fileName = 'db.json';

app.use((req, res, next) => {
  var now = new Date().toString();
  var log = `${now}: ${req.method} ${req.url}`;

  console.log(log);
  fs.appendFile('server.log', log + '\n',(error) => {});
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
    fs.readFile(fileName, (err, data) => {
      let allData;
      if (data) {
        allData = JSON.parse(data);
      } else {
        allData = {data:[]};
      }
      allData.data.push(req.body);
      fs.writeFile(fileName, JSON.stringify(allData),(error) => {});
    })
  });
  res.json({
    msg: 'done'
  });
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});