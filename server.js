const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const routes = require('./routes/routes');

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

app.use('/', routes);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is up on port ${(process.env.PORT || 3000)}`);
});