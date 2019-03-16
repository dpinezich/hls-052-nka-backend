import "dotenv/config";
import express from "express";
import xlsx from "node-xlsx";
import stream from "stream";
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
        fs.readFile(fileName, (err, data) => {
          let allData = {};
          if (data) {
            allData = JSON.parse(data);
          }
          const excelRows = Object.keys(allData).map(key => {
            return Object.values(allData[key]);
          });
          const buffer = xlsx.build([
            {
              name: "Saved Data",
              data: excelRows
            }
          ]);
          var fileContents = Buffer.from(buffer, "base64");
          const readStream = new stream.PassThrough();
          readStream.end(fileContents);

          res.set(
            "Content-disposition",
            "attachment; filename=SavedData" + Date.now() + ".xlsx"
          );
          res.set(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );

          readStream.pipe(res);
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
