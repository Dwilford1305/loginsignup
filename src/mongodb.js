const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ynuwarp.mongodb.net/loginSignupdb`);
        console.log("MongoDB connection successful");
    } catch (error) {
        console.error("MongoDB connection FAILED", error);
    }
}

const ProfileSchema = new mongoose.Schema({
    local: {
        username: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        }
    },
    google: {
        id: {
            type: String,
            required: false
        },
        token: {
            type: String,
            required: false
        },
        email: {
            type: String,
            required: false
        },
        name: {
            type: String,
            required: false
        }
    },
    first_name: { type: String},
    last_name: { type: String},
    username: { type: String,
        unique: true},
    email: { type: String,
        unique: true},

});


const User = new mongoose.model("users", ProfileSchema);

module.exports.User = User;
module.exports.connectDB = connectDB;
