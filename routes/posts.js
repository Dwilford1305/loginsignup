const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const express = require('express');
const { ensureAuthenticated } = require('./auth');

//create a post
router.post('/', ensureAuthenticated, async (req, res) => {
    const user = await User.findById(req.session.user._id);
    try {
        const newPost = new Post({
            desc: req.body.post,
            username: user.username,
            userId: user._id,
        });
        await newPost.save();
        res.redirect("/api/posts/timeline/all");
    } catch (error) {
        res.status(500).json(error);
    }
});
//update a post
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        //find the post that will be updated
        const post = await Post.findById(req.params.id);
        if (post.userId === req.session.user._id) {
            if (req.body.desc) {
                await Post.findByIdAndUpdate(req.params.id, { desc: req.body.desc });
                res.redirect("/api/posts/{{post._id}}");
            }
            
            
        } else {
            res.status(403).json("You can only update your own post");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
//delete a post
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });
        if (post.userId === req.session.user._id) {
            await post.deleteOne({ _id: post._id });
            res.status(200).json("The post has been deleted");
        } else {
            res.status(403).json("You can only delete your own post");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
//like a post
router.put('/:id/like', ensureAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({$push: {likes: req.body.userId}});
            res.status(200).json("You liked this post");
        } else {
            await post.updateOne({$pull: {likes: req.body.userId}});
            res.status(200).json("You have unliked this post");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
//get a post
router.get('/:id', async (req, res) => {
    const user = await User.findById(req.session.user._id);
    try {
        const post = await Post.findById(req.params.id);
        
        res.render('postview', { post: post, user: user });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});
//get timeline posts
router.get('/timeline/all', ensureAuthenticated, async (req, res) => {
    const io = req.app.get('io');
    const userId = req.session.user._id;
    if (userId){
    io.emit('login', { userId: userId }); // emit login event
    console.log('a user logged in with userId: ' , userId);
    }
    try {
        const user = await User.findById(req.session.user._id);
        const userPosts = await Post.find({userId: user._id});
        const allUsers = await User.find({});
        allUsers.sort((a, b) => a.username.localeCompare(b.username));
        let friendPosts = await Promise.all(
            user.following.map(async (friendId) => {
                return Post.find({userId: friendId});
            })
        );
        // Flatten the array
        friendPosts = friendPosts.flat();
        res.render('home', { userPosts, friendPosts, user: req.session.user, allUsers });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});
module.exports = router;