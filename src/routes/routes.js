import "dotenv/config";
import azure from "azure-storage";
import fs from "fs";
// import { mailer } from "../mailer";
import {
  successResponse,
  fileNotExist,
  errorResponse
} from "../libs/responder";
import TokenGenerator from "uuid-token-generator";
import emailValidator from "email-validator";
import { readFileAsync, replaceAllInEmail } from "../libs/utils";
import get from "lodash.get";
import path from "path";

const fileName = process.env.FILENAME;
const tableSvc = azure.createTableService(process.env.STORAGE_ACCOUNT, process.env.STORAGE_ACCESS);
const entGen = azure.TableUtilities.entityGenerator;

module.exports = app => {
  app.get("/", (req, res) => {
    successResponse(res, {
      route: "/"
    });
  });

  app.post("/save", (req, res) => {
    const email = req.body.email;

    if (!email || !emailValidator.validate(email)) {
      return errorResponse(
        res,
        {
          msg: "invalid email"
        },
        422
      );
    }

    fs.exists(fileName, async exists => {
      const token = new TokenGenerator(256, TokenGenerator.BASE62).generate();
      let allData = {};
      const ip_address =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
      const {
        gender,
        first_name,
        last_name,
        email,
        street,
        city,
        interest,
        camp,
        lang
      } = req.body;
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
        signup_time: new Date().getTime(),
        confirmation_time: null,
        ip_address,
      };
      const emailHtmlBody = await readFileAsync(
        `${path.resolve()}/emails/dist/confirmation-email.${lang}.html`,
        "utf8"
      );
      const translations = await readFileAsync(
        `${path.resolve()}/emails/locales/home-${lang}.json`,
        "utf8"
      );
      const url = `http${req.secure ? "s" : ""}://${
        req.headers.host
      }/validate/${token}`;
      dataToSave.link = req.body.link = url;
      dataToSave.gender = get(
        JSON.parse(translations),
        `form.gender.${req.body.gender}`
      );
      dataToSave.hero_img = 'hero.png';
      switch (camp) {
        case 'ausland':
          dataToSave.hero_img = 'ausland.jpg';
          break;
        case 'komplementaer':
          dataToSave.hero_img = 'komplementaer.jpg';
          break;
        case 'wettbewerb':
          dataToSave.hero_img = 'wettbewerb.jpg';
          break;
      }

      dataToSave.salutation = get(JSON.parse(translations), `email.salutation.${gender}`).replace('{{lastName}}', last_name);
      dataToSave.subject = req.body.subject = get(JSON.parse(translations), "email.subject");
      dataToSave.textBody = req.body.textBody = get(JSON.parse(translations), "email.textBody");
      dataToSave.htmlBody = req.body.htmlBody = replaceAllInEmail(emailHtmlBody, dataToSave);

      delete dataToSave.hero_img;
      delete dataToSave.salutation;

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

      // mailer.sendConfirmationMail(url, dataToSave);

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
        const { camp, lang, gender, last_name } = allData[token];
        let redirectUrl = process.env.REDIRECT_URL;
        redirectUrl += "?lang=" + lang + "&camp=" + camp;
        redirectUrl += "&gender=" + gender + "&name=" + last_name;
        return res.redirect(redirectUrl);
      }

      return errorResponse(res, "invalid token");
    });
  });

  function saveData(dataFromFile, clientData, token) {
    dataFromFile[token] = clientData;
    dataFromFile[token]["validated"] = 0;
    fs.writeFile(fileName, JSON.stringify(dataFromFile), error => {});

    // Add data to TableStorage
    const task = {
      PartitionKey: entGen.String(dataFromFile[token].camp),
      RowKey: entGen.String(token),
      FIRST_NAME: entGen.String(dataFromFile[token].first_name),
      LAST_NAME: entGen.String(dataFromFile[token].last_name),
      EMAIL: entGen.String(dataFromFile[token].email),
      EMAILSENT: entGen.Int32(0),
      LINK: entGen.String(dataFromFile[token].link),
      LANGUAGE: entGen.String(dataFromFile[token].lang),
      GENDER: entGen.String(dataFromFile[token].gender),
    };

    tableSvc.insertEntity('NKA',task, function (error, result, response) {
      if(!error){
        // Entity inserted
        let currentTime = new Date().getTime();
        console.log('Mail is sent to TableStorage ' + dataFromFile[token].email, ' Unix Timestamp: ', currentTime);
      } else {
        console.log(error);
      }
    });
  }

  function sendEmail({ name, email, url }) {}
};
