const nodemailer = require('nodemailer');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name;
        this.from = `admin@langy.su`;
        this.url = url;
    }

    newTransport() {
         return nodemailer.createTransport({
            //  host: 'smtp.sendgrid.net',
            //  port: 465,
            //  auth: {
            //      user: 'apikey',
            //      pass: process.env.SENDGRID_API_KEY
            //  }

             host: 'smtp.gmail.com',
             port: 465,
             auth: {
                 user: 'admin@langy.su',
                 pass: process.env.GMAIL_PASSWORD
             }
         })
    }

    async send(text, subject) {
       const mailOptions = {
          from: this.from,
          to: this.to,
           subject,
           text
       };

       await this.newTransport().sendMail(mailOptions)
    }

    async sendPasswordReset() {
       const text = `Для сброса пароля перейдите по ссылке: ${this.url}`;
       await this.send(text, 'Сброс пароля. Ссылка работает 10 мин');
    }
}