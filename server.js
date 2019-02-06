const express = require('express');
var bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

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
  console.log(req.body);
  res.json({
    msg: 'done'
  });
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});