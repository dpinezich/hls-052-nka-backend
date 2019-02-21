require('dotenv').config();
const nodemailer = require("nodemailer");
const EmailTemplate = require('email-templates');
const path = require('path');
let transporter;

if (process.env.MAIL_SERVER != '' && process.env.MAIL_USER != '') {
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE == 'false' ? false : true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
}

exports.sendConfirmationMail = async function (email, name) {
  if (process.env.MAIL_SERVER == '' || process.env.MAIL_FROM == '') {
    return;
  }
  const emailTemplate = new EmailTemplate({
    juice: true,
    juiceResources: {
      preserveImportant: true,
      webResources: {
        relativeTo: path.join(__dirname, 'css')
      }
    }
  });
  const emailHtmlBody = await emailTemplate.render('confirmation-mail.html', { name });
  const emailTextBody = await emailTemplate.render('confirmation-mail.text', { name });
  const mailOptions = {
    from: process.env.MAIL_FROM, 
    to: email,
    subject: 'Confirmation link',
    text: emailTextBody,
    html: emailHtmlBody
  };
  transporter.sendMail(mailOptions, (err, info) => {});
}