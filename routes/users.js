const User = require('../models/User');
const router = require('express').Router();
const hbs = require('hbs');
const { ensureAuthenticated } = require('../routes/auth');

router.get('/', ensureAuthenticated, async (req, res) => {
    res.render("home", {user: req.session.user});
});

//update user
router.put('/:id', ensureAuthenticated, async (req, res) => {
    if (req.session.userId === req.params.id || req.session.isAdmin) {
        if (req.body.password) {
            try {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        } catch (error) {
            return res.status(500).json(error);
        }
    }
        try {
            const updatedUser = await User.findByIdAndUpdate(req.params.id, {
                $set: req.body
            });
            res.status(200).json("Account has been updated successfully!");
        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(401).json("You can only update your account");
    }
});
//delete user
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
        try {
            const updatedUser = await User.deleteOne({ _id: req.params.id }, {
                $set: req.body
            });
            res.status(200).json("Account has been deleted!");
        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(401).json("You can only delete your account");
    }
});
//get profile page
router.get('/:id/profile', ensureAuthenticated, async (req, res) => {
    res.render("profile", {user: req.session.user});
});

//follow a user
router.put('/:id/follow', ensureAuthenticated, async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if (!user.followers.includes(req.body.userId)) {
                await user.updateOne({ $push: { followers: req.body.userId } });
                await currentUser.updateOne({ $push: { following: req.params.id } });
                res.status(200).json("User has been followed");
            } else {
                res.status(403).json("You already follow this user");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    }else {
        res.status(401).json("You can't follow yourself");
    }
});
//unfollow a user
router.put('/:id/unfollow', ensureAuthenticated, async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if (user.followers.includes(req.body.userId)) {
                await user.updateOne({ $pull: { followers: req.body.userId } });
                await currentUser.updateOne({ $pull: { following: req.params.id } });
                res.status(200).json("User has been unfollowed");
            } else {
                res.status(403).json("You do not follow this user");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    }else {
        res.status(401).json("You can't unfollow yourself");
    }
});

//get a user
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const { password, updatedAt, ...other } = user._doc;
        res.status(200).json(other);
    } catch (error) {
        res.status(500).json(error);
    }
});


module.exports = router;