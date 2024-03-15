const router = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');
const express = require('express');
const { ensureAuthenticated } = require('./auth');
const hbs = require('hbs');


//group messages by user
function groupMessagesByUser(user, messages) {
    const msgsByUser = {};
    messages.forEach(message => {
        const otherUserId = message.senderId == user._id ? 
            message.receiverId : message.senderId;
        if (!msgsByUser[otherUserId]) {
            msgsByUser[otherUserId] = [];
        }
        msgsByUser[otherUserId].push(message);
    });

    return msgsByUser;
}

const messageTemplateSource = `
    <div class="card border-dark mb-3" style="max-width: 20rem;">
        <div class="card-header">{{senderName}}</div>
            <div class="card-body">
            <p><strong>{{content}}</strong></p>
            <p class="card-text"><small>{{formattedDate}}</small></p>
        </div>
    </div>
`;

const messageTemplate = hbs.compile(messageTemplateSource);


//get a conversation (DM)
router.get('/:id', async (req, res) => {
    const io = req.app.get('io');
    const user = await User.findById(req.session.user._id);
    const otherUser = await User.findById(req.params.id);
    io.emit('join', user); // emit join event
    console.log('a user joined with userName: ' , user.username);
    try {
        const messages = await Message.find({
            $or: [
                { senderId: user._id, receiverId: otherUser._id },
                { senderId: otherUser._id, receiverId: user._id }
            ]
        }).sort({ createdAt: -1 }).limit(5);

        messages.reverse();
        
        const newMessagesHTML = messages.map(message => messageTemplate({
            senderName: message.senderName,
            formattedDate: message.formattedDate,
            content: message.content
        }));
        res.render('DMview', {messagesHTML: newMessagesHTML.join(''), user: user, otherUser: otherUser});
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

//create a message
router.post('/:userId', ensureAuthenticated, async (req, res) => {
    const user = await User.findById(req.session.user._id);
    const otherUser = await User.findById(req.params.userId);
    const io = req.app.get('io');
    const newMessage = new Message({
        senderId: user._id,
        receiverId: otherUser._id,
        senderName: user.username,
        receiverName: otherUser.username,
        content: req.body.content,
    });
    try {
        if (newMessage.content && newMessage.content.trim() !== '') {
            await newMessage.save().then(message => {
            });
        }
        const newMessageHTML = messageTemplate({
            senderName: newMessage.senderName,
            formattedDate: newMessage.formattedDate,
            content: newMessage.content
        });
        // Convert newMessageHTML to a JSON-compatible format
        const escapedNewMessageHTML = JSON.stringify(newMessageHTML);
        io.emit('message', { newMessageHTML: escapedNewMessageHTML, user, otherUser });
        res.status(204).end();
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


module.exports = router;