import 'dotenv/config';
import fs from "fs";
import {mailer} from "../mailer";
import {successResponse, fileNotExist, errorResponse} from "../libs/responder";
import TokenGenerator from "uuid-token-generator";
import emailValidator from "email-validator";

const fileName = process.env.FILENAME;

module.exports = app => {

  app.get("/", (req, res) => {
    successResponse(res, {
      route: "/"
    });
  });

  app.post("/save", (req, res) => {
    const email = req.body.email;

    if (!email || !emailValidator.validate(email)) {
      return errorResponse(res, {
        msg: "invalid email"
      }, 422);
    }

    fs.exists(fileName, exists => {
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
      const url = `http${req.secure ? 's' : ''}://${req.headers.host}/validate/${token}`
      mailer.sendConfirmationMail(req.body.email, req.body.name, url);

      return successResponse(res, {
        msg: "done"
      });
    });
  });

  app.get("/validate/:token?", (req, res) => {
    const token = req.params.token;
    if (!token) {
      return unspecifiedToken(res);
    }

    if (!fs.existsSync(fileName)) {
      return fileNotExist(res);
    }

    fs.readFile(fileName, (err, data) => {
      let allData;

      if (data) {
        allData = JSON.parse(data);
      }

      if (allData[token]) {
        allData[token]["validated"] = 1;
        fs.writeFile(fileName, JSON.stringify(allData), error => {});

        return successResponse(res, {
          msg: "validated"
        });
      }

      return errorResponse(res, {
        msg: "no data"
      });
    });
  });

  function saveData(dataFromFile, clientData, token) {
    dataFromFile[token] = clientData;
    dataFromFile[token]["validated"] = 0;
    fs.writeFile(fileName, JSON.stringify(dataFromFile), error => {});
  }

  function sendEmail({ name, email, url }) {}
};
