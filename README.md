# Blank Starter Project - DB API
## Blank starter project with MySQL DB / Auth / Upload / Mail API

This is a blank 'starter' project structure I created for faster project development.

It uses MySQL as the backend database, has a built in token authication system, upload file api and very light/basic mail api (for testing).

To install:

Edit DB settings in 'server.js' file...
```
const db = mysql.createConnection({
  host     : "localhost",
  user     : "root",
  password : "password",
  database : "apiDB"
})
```

Setup NPM modules...
```
npm install
```
Run Server...
```
node server
```
