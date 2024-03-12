const User = require('../models/User');
const router = require('express').Router();

//update user
router.put('/:id', async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
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
router.delete('/:id', async (req, res) => {
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
//get a user
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const { password, updatedAt, ...other } = user._doc;
        res.status(200).json(other);
    } catch (error) {
        res.status(500).json(error);
    }
});
//follow a user
router.put('/:id/follow', async (req, res) => {
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
router.put('/:id/unfollow', async (req, res) => {
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
module.exports = router;