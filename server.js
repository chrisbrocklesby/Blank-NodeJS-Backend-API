/////////////// Required ///////////////
const express = require("express")
const mysql = require("mysql")
const bodyParser = require("body-parser")
const multer = require("multer")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const sendmail = require("sendmail")()

/////////////// Variables ///////////////
const key = "mySuperStrongPassKey123"

/////////////// Declare ///////////////
const app = express()
app.use(express.static('public'))

////////////////////// Upload ////////////////
const storage = multer.diskStorage({
    destination: './uploads/', filename: (req, file, callback) => {
        callback( null, Date.now()+ "-" + file.originalname)
    }
})
const upload = multer( { storage: storage } );

/////////////// Middleware ///////////////
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

////////////// Allow Remote Access CORS and Auth Header ////////////
app.all('*', (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  next()
});

/////////////// DB Config and Connect ///////////////
const db = mysql.createConnection({
  host     : "localhost",
  user     : "root",
  password : "password",
  database : "apiDB"
})

db.connect((error) => {
    if (error) throw error.message
})

/////////////// Protected Area Function Middleware (Token) ///////////////
function protected(req, res, next) {
    jwt.verify(req.headers.authorization, key, (error, decoded) => {
        if (error) {
            res.sendStatus(401)
        } else {
            req.user = decoded //<- Pass Token User Data
            return next()
        }
    })
}

/////////////// New User ///////////////
app.post("/user/login?", (req, res) => {
    db.query("SELECT * FROM users WHERE email = ?", req.body.email, (error, response) => {
        if (error) {
            res.sendStatus(400)
        } else {
            bcrypt.compare(req.body.password, response[0].password, (error, success) => {
                if (error) {
                    res.sendStatus(401)
                } else {
                    var token = jwt.sign({ email: response[0].email }, key);
                    res.json(token)
                }
            })
        }
    })
})

/////////////// Register User ///////////////
app.post("/user/register?", (req, res) => {
    bcrypt.hash(req.body.password, 10, (error, hashPassword) => {
        if (error) {
            res.sendStatus(400)
        } else {
            req.body.password = hashPassword
            db.query("INSERT INTO users SET ?", req.body, (error, response) => {
                if (error) {
                    res.sendStatus(400)
                } else {
                    res.sendStatus(201)
                }
            })
        }
    })
})

/////////////// Index ///////////////
app.get("/posts?", (req, res) => {
    db.query("SELECT * FROM posts", (error, response) => {
        if (error) {
            res.sendStatus(500)
        } else {
            res.json(response)
        }
    })      
})

/////////////// View ///////////////
app.get("/posts/:id?", (req, res) => {
    db.query("SELECT * FROM posts WHERE id = ?", req.params.id, (error, response) => {
        if (error) {
            res.sendStatus(500)
        } else {
            if (response[0] != null) {
                res.json(response)
            } else {
                res.sendStatus(404)
            }
        }
    })
})

/////////////// Insert ///////////////
app.post("/posts?", protected, (req, res) => {
    db.query("INSERT INTO posts SET ?", req.body, (error, response) => {
        if (error) {
            res.sendStatus(400)
        } else {
            res.sendStatus(201)
        }
    })
})

/////////////// Update ///////////////
app.put("/posts/:id?", protected, (req, res) => {
    db.query("UPDATE posts SET ? WHERE id = ?", [req.body, req.params.id], (error, response) => {
        if (error) {
            res.sendStatus(400)
        } else {
            res.sendStatus(200)
        }
    })
})

/////////////// Delete ///////////////
app.delete("/posts/:id?", protected, (req, res) => {
    db.query("DELETE FROM posts WHERE id = ?", req.params.id, (error, response) => {
        if (error) {
            res.sendStatus(400)
        } else {
            res.sendStatus(200)
        }
    })
})

/////////////// File Upload (Muliple (12)) ///////////////
app.post('/upload', upload.array('files', 12), (req, res) => {
  res.sendStatus(201)
})

/////////////// Email ///////////////
app.post('/mail', protected, (req, res) => {
    if (req.body != null){      
        sendmail({
            from: req.body.from,
            to: req.body.to,
            subject: req.body.subject,
            html: req.body.body,
        },(error, response) => {
            if (error) {
                res.sendStatus(500)
            } else {
                res.sendStatus(200)
            }
        })
    } else {
        res.sendStatus(400)
    }
})


/////////////// Start Server ///////////////
app.listen(3000, () => console.log("DB API Server running..."))