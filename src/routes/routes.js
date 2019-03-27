import 'dotenv/config';
import fs from "fs";
import {mailer} from "../mailer";
import {successResponse, fileNotExist, errorResponse} from "../libs/responder";
import TokenGenerator from "uuid-token-generator";
import emailValidator from "email-validator";
import {readFileAsync} from "../libs/utils";
import get from 'lodash.get';
import path from 'path';

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

    fs.exists(fileName, async exists => {
      const token = new TokenGenerator(256, TokenGenerator.BASE62).generate();
      let allData = {};
      const { gender, first_name, last_name, email, street, city, interest, camp, lang } = req.body;
      const dataToSave = {
        gender,
        first_name,
        last_name,
        email,
        street,
        city,
        interest,
        camp,
        lang,
        validated: false,
        signup_time: new Date().getTime()
      }
      if (exists) {
        fs.readFile(fileName, (err, data) => {
          if (data) {
            allData = JSON.parse(data);
          }
          saveData(allData, dataToSave, token);
        });
      } else {
        saveData(allData, dataToSave, token);
      }
      const translations = await readFileAsync(
        `${path.resolve()}/emails/locales/home-${lang}.json`,
        'utf8'
      );
      const url = `http${req.secure ? 's' : ''}://${req.headers.host}/validate/${token}`
      req.body.link = url;
      req.body.gender = get(JSON.parse(translations), `form.gender.${req.body.gender}`);
      req.body.subject = get(JSON.parse(translations), 'email.subject');
      mailer.sendConfirmationMail(url, req.body);

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
        allData[token]["confirmation_time"] = new Date().getTime();
        fs.writeFile(fileName, JSON.stringify(allData), error => {});
        const {camp, lang, gender, last_name } = allData[token];
        let redirectUrl = process.env.REDIRECT_URL;
        redirectUrl += '?lang=' + lang + '&camp=' + camp;
        redirectUrl += '&gender=' + gender + '&name=' + last_name;
        return res.redirect(redirectUrl);
      }

      return errorResponse(res, 'invalid token');
    });
  });

  function saveData(dataFromFile, clientData, token) {
    dataFromFile[token] = clientData;
    dataFromFile[token]["validated"] = 0;
    fs.writeFile(fileName, JSON.stringify(dataFromFile), error => {});
  }

  function sendEmail({ name, email, url }) {}
};
