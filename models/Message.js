const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
    {
        senderId: {
            type:  String,
            required: true,
            ref: 'User'
        },
        receiverId: {
            type: String,
            required: true,
            ref: 'User'
        },
        senderName: {
            type: String,
            required: true,
            ref: 'User'
        },
        receiverName: {
            type: String,
            required: true,
            ref: 'User'
        },
        content: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);
MessageSchema.virtual('formattedDate').get(function() {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit' };
        return this.createdAt ? 
            this.createdAt.toLocaleDateString(undefined, options) : '';
});

module.exports = mongoose.model("Message", MessageSchema);