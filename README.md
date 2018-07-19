# Blank Starter Project - DB API
## Blank starter project with MySQL DB / Auth / Upload / Mail API

This is a blank 'starter' project structure created for faster project development.

It uses MySQL as the backend database, has a built in token authication system, upload file api and very light/basic mail api (for testing).

## To install:

### Edit MySQL connection settings in 'server.js' file...
```
const db = mysql.createConnection({
  host     : "localhost",
  user     : "root",
  password : "password",
  database : "apiDB"
})
```

### Create 'users' table within your MySQL DB...
```
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

```

### Setup NPM modules...
```
npm install
```
### Run Server...
```
node server
```
### Note:
```
Create and setup 'public/uploads' folder permissions correctly to allow upload.
```

### Go create something great...
