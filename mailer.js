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

export const sendConfirmationMail = async (email, name, url) => {
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
  const emailHtmlBody = await emailTemplate.render('confirmation-mail.html', { name, url });
  const emailTextBody = await emailTemplate.render('confirmation-mail.text', { name, url });
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
}