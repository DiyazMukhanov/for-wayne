const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({path: './config.env'});

process.on("uncaughtException", err => {
    console.log('UNCAUGHT EXCEPTION! Shutting down');
    console.log(err.name, err.message);
    process.exit(1);
});

const app = require('./app');
// const dbUser = process.env.USERNAME
const dbPassword = process.env.DATABASE_PASSWORD
const dbUser = process.env.DB_USER
const devIp = process.env.NODE_ENV === 'production' ? '195.211.27.141' : process.env.DEV_IP //change to prod server 
console.log(devIp);

    mongoose.connect(`mongodb://${dbUser}:${dbPassword}@${devIp}/langy`, {}).then(() =>
    console.log('DB connection successful')).catch((err) => console.log('DB connection failed'));

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
    console.log(`App is running on port ${port}...`);
});

