const mysql = require('mysql2/promise');
mysql.createConnection({host:'localhost', user:'root', database:'primeheal'})
  .then(c => c.query("SELECT * FROM doctoravailability WHERE doctorID = 6"))
  .then(([rows]) => console.log(rows))
  .then(()=>process.exit(0));
