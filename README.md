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

### API URL...
```
/////////////// User URL's ////////////////
POST: http://localhost:3000/api/user/register/
POST: http://localhost:3000/api/user/login/ // <- Returns Auth Token

/////////////// API Table URL's (Replace <Table> and <ID>) ///////////////
GET: (Index) http://localhost:3000/api/<TABLE>/
GET: (By ID) http://localhost:3000/api/<TABLE>/<ID>/
POST: (Insert) http://localhost:3000/api/<TABLE>/
PUT: (Update) http://localhost:3000/api/<TABLE>/<ID>/
DELETE: (By ID) http://localhost:3000/api/<TABLE>/<ID>/

/////////////// API Upload file ///////////////
POST: (Insert) http://localhost:3000/api/upload/

/////////////// API Email ///////////////
POST: (Insert) http://localhost:3000/api/mail/

//// IMPORTANT NOTE: ////
Don't forget to send 'Authorization' header with token for protected url's !...
```

### Note:
```
Create and setup 'public/uploads' folder permissions correctly to allow upload.
```

### Go create something great...
