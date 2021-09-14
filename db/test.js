
// const sqlite3 = require('sqlite3').verbose();

// // open database in memory
// let db = new sqlite3.Database(':memory:', (err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log('Connected to the in-memory SQlite database.');
// });

// // close the database connection
// db.close((err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log('Close the database connection.');
// });

// const sqlite3 = require('sqlite3').verbose();

// let db = new sqlite3.Database('./db/test.db');

// db.run('CREATE TABLE student(id integer primary key, name text not null, email text unique)');

// db.close();


// const sqlite3 = require('sqlite3').verbose();

// let db = new sqlite3.Database('./db/chinook.db');

// // insert one row into the student table
// db.run(`INSERT INTO student(name, email) VALUES('김서원', '1234ksu@gmail.com')`, function (err) {
//     if (err) {
//         return console.log(err.message);
//     }
//     // get the last insert id
//     console.log(`A row has been inserted with rowid ${this.lastID}`);
// });

// // close the database connection
// db.close();

const sqlite3 = require('./sqlite3').verbose();

// // open the database
// let db = new sqlite3.Database('./db/chinook.db');

// let sql = `SELECT * FROM student`;

// db.all(sql, [], (err, rows) => {
//   if (err) {
//     throw err;
//   }
//   rows.forEach((row) => {
//     console.log(row);
//   });
// });

// // close the database connection
// db.close();