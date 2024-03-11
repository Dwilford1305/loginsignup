const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const collection = require('./mongodb.js');
const bcrypt = require('bcrypt');

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
    if (!check) {
        res.send("Username not found");
    } else {
        const validPass = await bcrypt.compare(req.body.password, check.password);
        if (validPass) {
            res.render("home");
        } else {
            res.send("Invalid password");
        }
    }
} catch (error) {
    res.status(500).send("Error", error);
}
});

app.post('/signup', async (req, res) => {
    const data = {
        
            username: req.body.username,
            password: req.body.password
        
    }

    //check if username already exists
    const existingUser = await collection.findOne({username: data.username});
    if(existingUser){
        res.send("Username already exists");
    } else {
    // hash the password
    const saltRounds = 10;
    const hashedPass = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPass;
    await collection.insertMany([data]);

    res.render("home")
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});