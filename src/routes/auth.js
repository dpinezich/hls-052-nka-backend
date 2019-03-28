import "dotenv/config";
import express from "express";
import Excel from 'exceljs';
import stream from "stream";
import moment from "moment";
import fs from "fs";
import basicAuth from "express-basic-auth";
import { successResponse, errorResponse } from "../libs/responder";

const fileName = process.env.FILENAME;

const myAuthorizer = (username, password) =>
  username == process.env.AUTH_USER && password == process.env.AUTH_PASS;
const getUnauthorizedResponse = req =>
  req.auth
    ? `Credentials ${req.auth.user} : ${req.auth.password} rejected`
    : "No credentials provided";

module.exports = app => {

  // auth configuration
  app.use(
    basicAuth({
      authorizer: myAuthorizer,
      unauthorizedRen8sponse: getUnauthorizedResponse,
      challenge: true,
      realm: "DreamLand"
    })
  );

  app.get("/auth/download", (req, res) => {
    fs.exists(fileName, exists => {
      if (exists) {
        fs.readFile(fileName, async (err, data) => {
          let allData = {};
          if (data) {
            allData = JSON.parse(data);
          }

          const workbook = new Excel.Workbook();
          const sheet = workbook.addWorksheet('Saved Data');
          sheet.columns = [
            { header: 'Full name', key: 'full_name', width: 20 },
            { header: 'Email', key: 'email', width: 20 },
            { header: 'Subject', key: 'subject', width: 20 },
            { header: 'Email body', key: 'htmlBody', width: 10 },
            { header: 'Text body', key: 'textBody', width: 10 },
            { header: 'Link', key: 'link', width: 20 },
            { header: 'Signup date', key: 'signup_time', width: 20 },
            { header: 'Confirmation time', key: 'confirmation_time' },
            { header: 'Validated', key: 'validated' },
            { header: 'IP address', key: 'ip_address', width: 12 },
            { header: 'Street', key: 'street' },
            { header: 'City/Zip', key: 'city' },
            { header: 'Interest', key: 'interest' },
            { header: 'Camp', key: 'camp' },
            { header: 'Lang', key: 'lang' },
          ];

          const excelRows = Object.keys(allData).map(key => {
            const _data = allData[key];
            sheet.addRow({
              ..._data,
              full_name: `${_data.first_name} ${_data.last_name}`,
              signup_time: _data.signup_time ? moment(_data.signup_time).format('YYYY-MM-DD HH:mm') : null,
              confirmation_time: _data.confirmation_time ? moment(_data.confirmation_time).format('YYYY-MM-DD HH:mm') : null,
              validated: _data.validated ? 'Yes' : 'No',
            });
            return ;
          });

          res.set(
            "Content-disposition",
            "attachment; filename=SavedData" + Date.now() + ".xlsx"
          );
          res.set(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );

          await workbook.xlsx.write(res);
          res.end();
        });
      } else {
        errorResponse(res, { msg: "nothing to show" });
      }
    });
  });

  app.get("/auth/reset-db", (req, res) => {
    fs.writeFile(fileName, JSON.stringify({}), error => {});
    successResponse(res, {
      msg: "done"
    });
  });
};
