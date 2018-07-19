////////////////////////////// Required //////////////////////////////
const express = require("express")
const mysql = require("mysql")
const bodyParser = require("body-parser")
const multer = require("multer")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const sendmail = require("sendmail")()
const colors = require("colors")


////////////////////////////// Variables //////////////////////////////
const key = "mySuperStrongPassKey123" // <- JWT Key


////////////////////////////// Declare //////////////////////////////
const app = express()
app.use(express.static('public'))

//////////////////////////////// Upload ///////////////////////////////
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


//////////////////////////////// Middleware ////////////////////////////////
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


//////////////////////// Allow Client Access CORS and Auth Header /////////////////////////
app.all('*', (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  next()
});


//////////////////////////////// DB Config and Connect ////////////////////////////////
const db = mysql.createConnection({
  host     : "localhost",
  user     : "root",
  password : "password",
  database : "apiDB"
})

db.connect((error) => {
    if (error) {
      throw error.message
      console.log("Debug: ".red + "Database Connnection Error.")
    }
    else {
      console.log("Log: ".green + "Database Connnected." )
    }
})


//////////////////////////////// Protected Area Middleware (JWT) ////////////////////////////////
function protected(req, res, next) {
    jwt.verify(req.headers.authorization, key, (error, decoded) => {
        if (error || decoded == undefined) {
            res.sendStatus(401)
            console.log("Debug: ".red + "Unauthorized (Request Rejected).")
        }
        else {
            req.user = decoded // <- Pass Token User Data
            console.log("Log: ".green + "Authorized User (" + decoded.id + ")." )
            return next()
        }
    })
}


//////////////////////////////// New User ////////////////////////////////
app.post("/api/user/login?", (req, res) => {
    db.query("SELECT * FROM users WHERE email = ?", req.body.email, (error, response) => {
        if (error) {
            res.sendStatus(400)
            console.log("Debug: ".red + error.sqlMessage)
        } else {
            bcrypt.compare(req.body.password, response[0].password, (error, success) => {
                if (error) {
                    res.sendStatus(401)
                    console.log("Debug: ".red + "Login Failed.")
                } else {
                    var token = jwt.sign({ id: response[0].id, email: response[0].email }, key);
                    res.json(token)
                    console.log("Log: ".green + "Login Success Token Passed." )
                }
            })
        }
    })
})


//////////////////////////////// Register User ////////////////////////////////
app.post("/api/user/register?", (req, res) => {
      bcrypt.hash(req.body.password, 10, (error, hashPassword) => {
        if (error) {
            res.sendStatus(400)
            console.log("Debug: ".red + error)
        } else {
            req.body.password = hashPassword
            db.query("INSERT INTO users SET ?", req.body, (error, response) => {
                if (error) {
                    res.sendStatus(400)
                    console.log("Debug: ".red + error.sqlMessage)
                } else {
                    res.sendStatus(201)
                    console.log("Log: ".green + "New User Registered." )
                }
            })
        }
    })
})


//////////////////////////////// Index ////////////////////////////////
app.get("/api/:table?", (req, res) => {
   //if (req.query.search) {let search = "WHERE"}

    db.query("SELECT * FROM "+ req.params.table +"", (error, response) => {
      if (error) {
        res.sendStatus(500)
        console.log("Debug: ".red + error.sqlMessage)
      }
      else if (response[0] != null) {
        res.json(response)
        console.log("Log: ".green + "Index Data Sent.")
      }
      else {
        res.sendStatus(404)
        console.log("Debug: ".red + "Index Not Found or Auth Issue")
      }
    })
})


//////////////////////////////// View ////////////////////////////////
app.get("/api/:table/:id?", protected, (req, res) => {
    db.query("SELECT * FROM "+ req.params.table +" WHERE id = ?", req.params.id, (error, response) => {
        if (error) {
          res.sendStatus(500)
          console.log("Debug: ".red + error.sqlMessage)
        }
        else if (response[0] != null) {
          res.json(response)
          console.log("Log: ".green + "Record Data Sent.")
        }
        else {
          res.sendStatus(404)
          console.log("Debug: ".red + "Record Not Found or Auth Issue.")
        }
    })
})

//////////////////////////////// Insert ////////////////////////////////
app.post("/api/:table?", protected, (req, res) => {
    req.body.user_id = req.user.id // Important Stops User from being changed.
    db.query("INSERT INTO "+ req.params.table +" SET ?", req.body, (error, response) => {
        if (error) {
            res.sendStatus(400)
            console.log("Debug: ".red + error.sqlMessage)
        } else {
            res.sendStatus(201)
            console.log("Log: ".green + "New Record Created.")
        }
    })
})


//////////////////////////////// Update ////////////////////////////////
app.put("/api/:table/:id?", protected, (req, res) => {
    req.body.user_id = req.user.id // Important Stops User from changing owner of record.
    console.log("User: " + req.user.id)
    db.query("UPDATE "+ req.params.table +" SET ? WHERE id = ? AND user_id = ?", [req.body, req.params.id, req.user.id], (error, response) => {
        if (error) {
            res.sendStatus(400)
            console.log("Debug: ".red + error.sqlMessage)
        }
        else if (response.affectedRows == 0) {
            db.query("SELECT user_id FROM "+ req.params.table +" WHERE id = ?", req.params.id, (error, response) => {
                if (response.user_id != req.user.id) {
                  res.sendStatus(401)
                  console.log("Debug: ".red + "Not Owner of Record.")
                } else {
                  res.sendStatus(404)
                  console.log("Debug: ".red + "Record Not Found.")
                }
            })
        }
        else {
            res.sendStatus(200)
            console.log("Log: ".green + "Record Updated.")
        }
    })
})


//////////////////////////////// Delete ////////////////////////////////
app.delete("/api/:table/:id?", protected, (req, res) => {
    db.query("DELETE FROM "+ req.params.table +" WHERE id = ? AND user_id = ?", [req.params.id, req.user.id], (error, response) => {
      if (error) {
          res.sendStatus(400)
          console.log("Debug: ".red + error.sqlMessage)
      }
      else if (response.affectedRows == 0) {
        db.query("SELECT user_id FROM "+ req.params.table +" WHERE id = ?", req.params.id, (error, response) => {
            if (response.user_id != req.user.id) {
              res.sendStatus(401)
              console.log("Debug: ".red + "Not Owner of Record.")
            } else {
              res.sendStatus(404)
              console.log("Debug: ".red + "Record Not Found.")
            }
        })
      }
      else {
          res.sendStatus(200)
          console.log("Log: ".green + "Record Deleted.")
      }
    })
})


//////////////////////////////// File Upload (Muliple (12)) ////////////////////////////////
app.post('/api/upload', protected, (req, res) => {
  upload(req, res, (error) => {
    if (error) {
      res.status(400).json(error)
      console.log("Debug: ".red + error)
      return
    }
    else if (req.files) {
      var json = {status: "ok", filenames: []}
      for (var num = 0; num < req.files.length; num++) {
        json.filenames.push(req.files[num].filename)
      }
      res.status(201).json(json)
      console.log("Log: ".green + "Upload Performed.")
    }
    else {
      res.sendStatus(400)
      console.log("Debug: ".red + "Upload was not successful.")
    }
  })
})


//////////////////////////////// Email ////////////////////////////////
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
                console.log("Debug: ".red + "Email Send Error.")
            } else {
                res.sendStatus(200)
                console.log("Log: ".green + "Email Sent.")
            }
        })
    } else {
        res.sendStatus(400)
        console.log("Debug: ".red + "Email Bad Request.")
    }
})


//////////////////////////////// Connection ////////////////////////////////
app.get('/api/connection', (req, res) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    res.header('Expires', '-1')
    res.header('Pragma', 'no-cache')
    res.sendStatus(200)
    console.log("Log: ".green + "Connection Tested Performed.")
})


//////////////////////////////// Start API Server ////////////////////////////////
app.listen(3000, () => console.log("Log: ".green + "DB API Server Started (Port: 3000)."))
