const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const session = require('express-session')
// const MongoStore = require('connect-mongo')(session)
const csurf = require('csurf')
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();
const app = express();

const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Sanitize user input
app.use(mongoSanitize());

// middleware
app.use(express.static('public'));
app.use(express.json());

// view engine
app.set('view engine', 'ejs');
const username = encodeURIComponent('UserManagement');
const password = encodeURIComponent('PA44Qhb3fdYooxoC');
const databaseName = 'Cotrans';

// database connection
const dbURI =`mongodb+srv://${username}:${password}@cluster0.ljs3d.mongodb.net/${databaseName}?retryWrites=true&w=majority`;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));

// session
// const maxAge = 3 * 24 * 60 * 60;
// let sessionOptions = session({
//   secret: "secret id",
//   resave: false,
//   saveUninitialized: false,
//   cookie: {maxAge: maxAge, httpOnly: true}
// })
// app.use(sessionOptions)


// xss 
app.use(xss());

// cookies
app.use(cookieParser());
const csrfProtection = csurf({ cookie: true });

// routes
app.get('*', csrfProtection, checkUser);
app.get('/', csrfProtection, requireAuth, (req, res) => res.render('home'));
app.get('/smoothies', csrfProtection, requireAuth, (req, res) => res.render('smoothies'));
app.use(authRoutes);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/valider_or', upload.fields([
  { name: 'commentaire', maxCount: 1 },
  { name: 'employee', maxCount: 1},
  { name: 'uploadedFiles', maxCount: 20 }
  ]), async (req, res) => {


    const images = req.files.uploadedFiles;
    const commentData = req.body.commentaire;
    const employe = req.body.employee;

    console.log("comment ---> ", commentData);
    console.log("employeee ---> ", employe);
    console.log("images ---> ", images);


  })