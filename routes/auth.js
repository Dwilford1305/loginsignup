const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');



router.get('/', (req, res) => {
    res.render("signup.hbs")
});

//SIGNUP
router.post("/signup", async (req, res) => {
    const check = await User.findOne({username: req.body.username});

    if (check) {
        res.send("Username already exists");
    } else {
        try {
            //hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPass = await bcrypt.hash(req.body.password, salt);

            //create new user
            const user = await new User({
                username: req.body.username,
                email: req.body.email,
                password: hashedPass
            })
            //save user
            await user.save();
            res.redirect("/api/posts");
        } catch (error) {
            console.log(error);
        }
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


module.exports = router;