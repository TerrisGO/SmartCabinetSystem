const mysql = require('mysql2');
const dbConnection = mysql.createPool({
    host     : process.env.DB_HOST, // MYSQL HOST NAME
    user     : process.env.DB_USERNAME,        // MYSQL USERNAME
    password : process.env.DB_PASSWORD,    // MYSQL PASSWORD
    database : process.env.DB_NAME      // MYSQL DB NAME
}).promise();
module.exports = dbConnection;