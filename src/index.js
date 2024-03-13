const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('../models/User');


mongoose.connect(`${process.env.MONGO_URL}`)
.then(()=>{
    console.log("MongoDB connection successful");
})
.catch((error)=>{
    console.log("MongoDB connection FAILED");
})

const templatePath = path.join(__dirname, '../templates');

app.use(express.json());
app.set('view engine', 'hbs');
app.set("views", templatePath);
app.use(morgan('dev'));
const userRouter = require('../routes/users.js');
const { router: authRouter }= require('../routes/auth.js');
const postRouter = require('../routes/posts.js');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'SocEMP',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGO_URL,
    }),
    cookie: { secure: false } // set to true if your using https
}));

//import bootstrap
//const bootstrap = require('bootstrap');
app.use(express.static(path.join('public')));
app.use(express.static(path.join('node_modules/bootswatch/dist/vapor')));
app.use('/assets/vendor/bootstrap/js', 
    express.static(path.join('node_modules', 'bootstrap', 'dist', 'js')));
app.use('/assets/vendor/bootswatch/dist/vapor', 
    express.static(path.join('node_modules', 'bootswatch', 'dist', 'vapor')));

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);

app.get('/', (req, res) => {
    res.render("login.hbs")
});

app.listen(3000, () => {
    console.log('Backend server is running on port 3000');
});
