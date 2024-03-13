const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const path = require('path');
const server = http.createServer(app);
const io = socketIo(server);
app.set('io', io);
const hbs = require('hbs');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('../models/User');
hbs.registerHelper('eq', function(a, b) {
    return a === b;
});


mongoose.connect(`${process.env.MONGO_URL}`)
.then(async ()=>{
    console.log("MongoDB connection successful");

    //check if users exist
    const users = await User.find();

    if (users.length === 0) {
        const adminUser = new User({
            username: "admin",
            password: "$2b$10$4VMd0HFUerjzju0y56J15eFyHRW7kO53drIk.i.iqE75jSlm9n6h6",
            isAdmin: true,
            role: "admin"
        });
        await adminUser.save();
        console.log("Admin user created");
    }
})
.catch((error)=>{
    console.log("MongoDB connection FAILED");
    console.log(error);
})

const partialsPath = path.join(__dirname, '../partials');
const templatePath = path.join(__dirname, '../templates');

app.use(express.json());
app.set('view engine', 'hbs');
hbs.registerPartials(partialsPath);
app.set("views", templatePath);
app.use(morgan('dev'));
const userRouter = require('../routes/users.js');
const { router: authRouter }= require('../routes/auth.js');
const postRouter = require('../routes/posts.js');
const messageRouter = require('../routes/messages.js');
const User = require('../models/User');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'coolKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGO_URL,
    }),
    cookie: { secure: false } // set to true if your using https
}));


app.use(express.static(path.join('public')));

app.use(express.static(path.join('node_modules/bootswatch/dist/slate')));
app.use('/assets/vendor/bootstrap/js', 
    express.static(path.join('node_modules', 'bootstrap', 'dist', 'js')));
app.use('/assets/vendor/bootswatch/dist/slate', 
    express.static(path.join('node_modules', 'bootswatch', 'dist', 'slate')));
    app.use('/socket.io', express.static(path.join(__dirname, 
        'node_modules', 'socket.io', 'client-dist')));
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);
app.use("/api/messages", messageRouter);

app.get('/', (req, res) => {
    res.render("login.hbs")
});
server.listen(3000, () => {
    console.log('Backend server is running on port 3000');
});
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('login', (data) => {
        User.findByIdAndUpdate(data.userId, { inOnline: true }, (err, user) => {
            if (err) {
                console.log(err);
            } else {
                console.log(`User ${user.username} is online`);
            }
        });
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
