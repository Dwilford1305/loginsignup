const router = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');
const express = require('express');
const { ensureAuthenticated } = require('./auth');

//create a message
router.post('/', ensureAuthenticated, async (req, res) => {
    const user = await User.findById(req.session.user._id);
    try {
        const newMessage = new Message({
            senderId: user._id,
            receiverId: req.body.user._id,
            senderName: user.username,
            receiverName: req.body.user.username,
            content: req.body.content,
        });
        await newMessage.save();
        res.redirect("/api/posts/timeline/all");
    } catch (error) {
        res.status(500).json(error);
    }
});
//update a message
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        //find the message that will be updated
        const message = await Message.findById(req.params.id);
        if (message.userId === req.session.user._id) {
            if (req.body.desc) {
                await Message.findByIdAndUpdate(req.params.id, { content: req.body.content });
                res.redirect("/api/posts/timeline/all");
            }
            
            
        } else {
            res.status(403).json("You can only update your own message");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
//delete a message
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const message = await Message.findOne({ _id: req.params.id });
        if (message.senderId === req.session.user._id) {
            await message.deleteOne({ _id: message._id });
            res.status(200).json("The message has been deleted");
        } else {
            res.status(403).json("You can only delete your own message");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
//get a message
router.get('/:id', async (req, res) => {
    const user = await User.findById(req.session.user._id);
    try {
        const message = await Message.findById(req.params.id);
        
        res.render('messageview', { message: message, user: user });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});
//get all messages
router.get('/all', ensureAuthenticated, async (req, res) => {
    const io = req.app.get('io');
    const userId = req.session.user._id;
    if (userId){
    try {
        const user = await User.findById(req.session.user._id);
        const userMessages = await Message.find({userId: user._id});
        const allMessages = await Message.find({});
        let friendMessages = await Promise.all(
            user.following.map(async (friendId) => {
                return Message.find({userId: friendId});
            })
    );
        // Flatten the array
        friendMessages = friendMessages.flat();
        res.render('home', { userMessages, friendMessages, user: req.session.user, allMessages });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }
});
module.exports = router;