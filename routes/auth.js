const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const session = require('express-session');

function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.send(500, { message: "Please login to view this page" });
    }
}

router.get('/', (req, res) => {
    res.render("adduser.hbs", {user: req.session.user})
});

//adduser
router.post("/adduser", ensureAuthenticated, async (req, res) => {
    if (req.session.user.isAdmin || req.session.user.role === "manager") {

    const user = await User.findOne({username: req.body.username});

        if (user) {
            res.send("Username already exists");
        } else {
            try {
                //hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPass = await bcrypt.hash(req.body.password, salt);
                const isManager = req.body.manager === "on" ? true : false;

                //create new user
                const user = await new User({
                    username: req.body.username,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: hashedPass,
                    role: isManager ? "manager" : "employee"
                })
                //save user
                await user.save();
                res.redirect("/api/posts/timeline/all");
            } catch (error) {
                console.log(error);
            }
    
        }
    } else {
        res.send("You are not authorized to create a new user");
    }
});

//LOGIN
router.post('/login', async (req, res) => {
    try{
        const check = await User.findOne({username: req.body.username});
        if (!check) {
            res.send("Username not found");
        } else {
            const validPass = await bcrypt.compare(req.body.password, check.password);
            if (validPass) {
                req.session.user = check; // save user to session
                res.redirect("/api/posts/timeline/all");
            } else {
                res.send("Invalid password");
            }
        }
    } catch (error) {
        console.log(error);
    }
});

//LOGOUT
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.clearCookie('coolKey');
        res.redirect('/');
    });
});

module.exports.ensureAuthenticated = ensureAuthenticated;
module.exports.router = router;