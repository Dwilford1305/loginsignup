const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ynuwarp.mongodb.net/loginSignupdb`)
.then(()=>{
    console.log("MongoDB connection successful");
})
.catch((error)=>{
    console.log("MongoDB connection FAILED");
})

const logInSchema = new mongoose.Schema({
        username: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        }
});


const collection = new mongoose.model("users", logInSchema);

module.exports = collection;