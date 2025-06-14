const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

const credentialsPath = path.join(__dirname, '../config/google-credentials.json');

const mysqlConnection = mysql.createConnection({
	host: '34.58.141.16',
	user: 'banco_bogota_administrador',
	password: 'Vp3mpr3s4s#',
	database: 'SIBE',
	//socketPath: '/cloudsql/bbogota-davinci-empresas:us-central1:desarrollo-db3',
	port: 3306,
	ssl: true,
	ssl: {
         ca: fs.readFileSync('server-ca.pem'),
         key: fs.readFileSync('client-key.pem'),
         cert: fs.readFileSync('client-cert.pem'),
     } 
});

module.exports = mysqlConnection;
