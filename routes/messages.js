const router = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');
const express = require('express');
const { ensureAuthenticated } = require('./auth');

router.get('/:userId', ensureAuthenticated, async (req, res) => {
    res.render("DMview", {user: req.session.user});
});

//group messages by user
function groupMessagesByUser(user, messages) {
    const allDMs = {};
    messages.forEach(message => {
        const otherUserId = message.senderId == user._id ? 
            message.receiverId : message.senderId;
        if (!allDMs[otherUserId]) {
            allDMs[otherUserId] = [];
        }
        allDMs[otherUserId].push(message);
    });

    return allDMs;
}

            //create a message
            router.post('/:userId', ensureAuthenticated, async (req, res) => {
                const user = await User.findById(req.session.user._id);
                const otherUser = await User.findById(req.params.userId);

                const newMessage = new Message({
                    senderId: user._id,
                    receiverId: otherUser._id,
                    senderName: user.username,
                    receiverName: otherUser.username,
                    content: req.body.content,
                });
                try {
                    if (newMessage.content && newMessage.content.trim() !== '') {
                        await newMessage.save();
                        
                    }
                    const messages = await Message.find({
                        $or: [
                            { senderId: user._id, receiverId: otherUser._id },
                            { senderId: otherUser._id, receiverId: user._id }
                        ]
                    });
                    const DM = groupMessagesByUser(user, messages);
                    res.render('DMview', { DM: DM, messages: messages, newMessage: newMessage, otherUser: otherUser, user: user });
                } catch (error) {
                    console.log(error);
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
//get a coonversation (DM)
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
//get all Direct Messages (Conversations)
router.get('/all', ensureAuthenticated, async (req, res) => {
    const io = req.app.get('io');
    const userId = req.session.user._id;
    if (userId){
    try {
        const user = await User.findById(req.session.user._id);
        const userMessages = await Message.find({
            $or: [
                { senderId: user._id },
                { receiverId: user._id }
            ]
        });
        let friendMessages = await Promise.all(
            user.following.map(async (friendId) => {
                return Message.find({
                    $or: [
                        { senderId: friendId, receiverId: user._id },
                        { senderId: user._id, receiverId: friendId }
                    ]
                });
            })
        );
        // Flatten the array
        friendMessages = friendMessages.flat();
        
        const userConversations = groupMessagesByUser(userMessages);
        const friendConversations = groupMessagesByUser(friendMessages);
        
        res.render('home', { userConversations, friendConversations, user: req.session.user });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }
});
module.exports = router;