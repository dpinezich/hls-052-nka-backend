const express = require('express');
const router = express.Router();
const xlsx = require('node-xlsx').default;
const stream = require('stream');
const fs = require('fs');
const basicAuth = require('express-basic-auth');

const fileName = process.env.FILENAME;

router.use(basicAuth({ 
  authorizer: myAuthorizer,
  unauthorizedResponse: getUnauthorizedResponse,
  challenge: true,
  realm: 'DreamLand'
}));

function myAuthorizer(username, password) {
    return username==process.env.AUTH_USER && password==process.env.AUTH_PASS
}
function getUnauthorizedResponse(req) {
    return req.auth
        ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
        : 'No credentials provided'
}

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

module.exports = router;