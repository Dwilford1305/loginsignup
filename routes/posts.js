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
router.put('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {
            await post.updateOne({$set: req.body});
            res.status(200).json("The post has been updated");
        } else {
            res.status(403).json("You can only update your own post");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
//delete a post
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {
            await post.deleteOne({$set: req.body});
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
router.get('/timeline/all', async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        const userPosts = await Post.find({userId: user._id});
        let friendPosts = await Promise.all(
            user.following.map(async (friendId) => {
                return Post.find({userId: friendId});
            })
        );
        // Flatten the array
        friendPosts = friendPosts.flat();

        res.render('home', { userPosts, friendPosts, user: req.session.user });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});
module.exports = router;