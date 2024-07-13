const { createHmac, randomBytes } = require('node:crypto'); // HMAC for hashing
const { Schema, model } = require('mongoose');
const { createTokenForUser } = require('../services/authentication');


const downloadedBySchema = new Schema({
    blogId: {
      type: String,
   
    },
    blogTitle: {
        type: String,
    },
    timestamp: {
      type: Date,
      
      default: Date.now,
    },
  });


// User Schema
const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // fixed typo
    },
    salt: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    profileImageURL: {
        type: String,
        default: '/public/images/user_avatar.png',
    },
    role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: "USER",
    },
    downloadFiles:{
        type: [downloadedBySchema],
    },
}, { timestamps: true });

// MIDDLEWARE - used for hashing the password before saving the password in database
userSchema.pre("save", function(next) {
    const user = this;
    if (!user.isModified("password")) return next();

    const salt = randomBytes(16).toString('hex'); // Specify 'hex' encoding
    const hashedPassword = createHmac('sha256', salt).update(user.password).digest("hex");

    user.salt = salt; // Use `user` to ensure you're setting the correct instance
    user.password = hashedPassword;
    next();
});
userSchema.static("matchPasswordAndGenerateToken",async function(email,password){
const user = await this.findOne({email});
if(!user) throw new Error('User not found!');

const salt = user.salt;
const hashedPassword = user.password;
const userProvidedHash = createHmac("sha256",salt)
.update(password)
.digest("hex");

if(hashedPassword!==userProvidedHash) throw new Error(
    "Incorrect Password"
)
const token = createTokenForUser(user);
return token;
})
const User = model('User', userSchema); // Capitalized model name

module.exports = User;
