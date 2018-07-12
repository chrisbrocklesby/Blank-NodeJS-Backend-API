/////////////// Required ///////////////
const express = require("express")
const mysql = require("mysql")
const bodyParser = require("body-parser")
const multer = require("multer")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const sendmail = require("sendmail")()

/////////////// Variables ///////////////
const key = "mySuperStrongPassKey123" // <- JWT Key

/////////////// Declare ///////////////
const app = express()
app.use(express.static('public'))

////////////////////// Upload ////////////////
const storage = multer.diskStorage({
    destination: './public/uploads/', filename: (req, file, callback) => {
        var newfilename = req.user.id + "-" + Date.now() + "-" + file.originalname.toLowerCase().replace(/\s/g, '-')
        callback( null, newfilename)
    }
})
const upload = multer( {
  storage: storage,
  limits: {fileSize: 10000000, files: 10} // <- 10mb (10000000) max upload with 10 files
}).array('file', 10)

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
app.post("/api/user/login?", (req, res) => {
    db.query("SELECT * FROM users WHERE email = ?", req.body.email, (error, response) => {
        if (error) {
            res.sendStatus(400)
        } else {
            bcrypt.compare(req.body.password, response[0].password, (error, success) => {
                if (error) {
                    res.sendStatus(401)
                } else {
                    var token = jwt.sign({ id: response[0].id, email: response[0].email }, key);
                    res.json(token)
                }
            })
        }
    })
})

/////////////// Register User ///////////////
app.post("/api/user/register?", (req, res) => {
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
app.get("/api/:table?", protected, (req, res) => {
    db.query("SELECT * FROM "+ req.params.table +"", (error, response) => {
      if (error) {
        res.sendStatus(500)
        console.log("Debug: " + error.sqlMessage)
      }
      else if (response[0] != null) {
        res.json(response)
      }
      else {
        res.sendStatus(404)
        console.log("Debug: Record Not Found or Auth Issue")
      }
    })
})

/////////////// View ///////////////
app.get("/api/:table/:id?", protected, (req, res) => {
    db.query("SELECT * FROM "+ req.params.table +" WHERE id = ?", req.params.id, (error, response) => {
        if (error) {
          res.sendStatus(500)
          console.log("Debug: " + error.sqlMessage)
        }
        else if (response[0] != null) {
          res.json(response)
        }
        else {
          res.sendStatus(404)
          console.log("Debug: Record Not Found or Auth Issue")
        }
    })
})

/////////////// Insert ///////////////
app.post("/api/:table?", protected, (req, res) => {
    req.body.user_id = req.user.id // Important Stops User from being changed.
    db.query("INSERT INTO "+ req.params.table +" SET ?", req.body, (error, response) => {
        if (error) {
            res.sendStatus(400)
        } else {
            res.sendStatus(201)
        }
    })
})


/////////////// Update ///////////////
app.put("/api/:table/:id?", protected, (req, res) => {
    req.body.user_id = req.user.id // Important Stops User from being changed.
    db.query("UPDATE "+ req.params.table +" SET ? WHERE user_id = ? AND id = ?", [req.body, req.user.id, req.params.id], (error, response) => {
        if (error) {
            res.sendStatus(400)
            console.log("Debug: " + error.sqlMessage)
        }
        else if (response.affectedRows == 0) {
            res.sendStatus(404)
            console.log("Debug: Record Not Found or Auth Issue")
        }
        else {
            res.sendStatus(200)
            console.log("Log: Record Updated")
        }
    })
})


/////////////// Delete ///////////////
app.delete("/api/:table/:id?", protected, (req, res) => {
    db.query("DELETE FROM "+ req.params.table +" WHERE user_id = ? AND id = ?", [req.user.id, req.params.id], (error, response) => {
      if (error) {
          res.sendStatus(400)
          console.log("Debug: " + error.sqlMessage)
      }
      else if (response.affectedRows == 0) {
          res.sendStatus(404)
          console.log("Debug: Record Not Found or Auth Issue")
      }
      else {
          res.sendStatus(200)
          console.log("Log: Record Deleted")
      }
    })
})


/////////////// File Upload (Muliple (12)) ///////////////
app.post('/api/upload', protected, (req, res) => {
  upload(req, res, (error) => {
    if (error) {
      res.status(400).json(error)
      console.log("Debug: " + error)
      return
    }
    else if (req.files) {
      var json = {status: "ok", filenames: []}
      for (var num = 0; num < req.files.length; num++) {
        json.filenames.push(req.files[num].filename)
      }
      res.status(201).json(json)
      console.log("Log: Upload Performed")
    }
    else {
      res.sendStatus(400)
      console.log("Debug: Upload was not successful")
    }
  })
})


/////////////// Email ///////////////
app.post('/api/mail', protected, (req, res) => {
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


/////////////// Connection ///////////////
app.get('/api/connection', (req, res) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    res.header('Expires', '-1')
    res.header('Pragma', 'no-cache')
    res.sendStatus(200)
    console.log("Log: Connection Tested Live")
})


/////////////// Start Server ///////////////
app.listen(3000, () => console.log("DB API Server running..."))
