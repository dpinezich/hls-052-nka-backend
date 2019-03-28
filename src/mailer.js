import "dotenv/config";
import nodemailer from "nodemailer";
import path from "path";
import mailgun from "mailgun-js";

const mailgunConfig = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

const sendConfirmationMail = async (url, body) => {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: body.email,
    subject: body.subject,
    text: body.textBody,
    html: body.htmlBody
  };
  mailgunConfig.messages().send(mailOptions, function(error, body) {
    console.log(error);
    console.log(body);
  });
};

export const mailer = {
  sendConfirmationMail
};
