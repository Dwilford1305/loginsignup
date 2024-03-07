const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const collection = require('./mongodb.js');

const templatePath = path.join(__dirname, '../templates');

app.use(express.json());
app.set('view engine', 'hbs');
app.set("views", templatePath);
app.use(express.urlencoded({ extended: false }));

//import bootstrap
//const bootstrap = require('bootstrap');
app.use(express.static(path.join('public')));
app.use(express.static(path.join('node_modules/bootswatch/dist/vapor')));
app.use('/assets/vendor/bootstrap/js', 
    express.static(path.join('node_modules', 'bootstrap', 'dist', 'js')));
app.use('/assets/vendor/bootswatch/dist/vapor', 
    express.static(path.join('node_modules', 'bootswatch', 'dist', 'vapor')));

app.get('/', (req, res) => {
    res.render("login.hbs")
});

app.get('/signup', (req, res) => {
    res.render("signup.hbs")
});

app.post('/login', async (req, res) => {
try{
    const check = await collection.findOne({username: req.body.username});
    if(!check){
        res.send("Username not found");
        res.render("login.hbs");
    } else {
        const validPass = await bcrypt.compare(req.body.password, check.password);
        if(validPass){
            res.render("home.hbs");
        } else {
            res.send("Invalid Password");
            res.render("login.hbs");
        }
    
    }
} catch  {
    res.send("Wrong Username or Password");
}
});

app.post('/signup', async (req, res) => {

    const data = {
        username: req.body.username,
        password: req.body.password
    }

    // check if username already exists
    const existingUser = await collection.findOne({username: data.username});
    if (existingUser) {
        res.send("Username already exists");
    } else {
        // hash the password using bcrypt
        const saltRounds = 10;
        const hashedPass = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPass; // replace the password with the hashed password
        await collection.insertMany([data]);

        res.render("home")
    }

});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});