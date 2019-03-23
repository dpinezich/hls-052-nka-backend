import 'dotenv/config';
import nodemailer from "nodemailer";
import EmailTemplate from 'email-templates';
import path from 'path';
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

const sendConfirmationMail = async (url, {last_name, email, gender}) => {
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
  const emailHtmlBody = await emailTemplate.render('confirmation-mail.html', { last_name, gender, email, url });
  const emailTextBody = await emailTemplate.render('confirmation-mail.text', { last_name, gender, email, url });
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Confirmation link',
    text: emailTextBody,
    html: emailHtmlBody
  };
  transporter.sendMail(mailOptions, (err, info) => {
    console.log('error', err);
    console.log('info', info);
  });
};

export const mailer = {
  sendConfirmationMail
};