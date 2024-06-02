// index.js
const path = require("path");
const express = require('express');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const userRoute = require('./routes/user');
const blogRoute = require("./routes/blog");
const { checkForAuthenticationCookie } = require("./middlewares/authentication");

const app = express();
const PORT = 8000;

const Blog = require('./models/Blog');

mongoose.connect('mongodb://localhost:27017/FileUpload', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit process with failure
    });

app.set('view engine', 'ejs');
app.set('views', path.resolve("./views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());

// Use the authentication check for all routes except those for signing in or signing up
app.use('/user', userRoute);
app.use('/blog', blogRoute);

app.get('/', checkForAuthenticationCookie('token'), async (req, res) => {
    const allBlogs = await Blog.find({});
    res.render("home", {
        user: req.user,
        blogs: allBlogs,
    });
});

app.use(checkForAuthenticationCookie('token'));

app.listen(PORT, () => {
    console.log(`Server Started at PORT: ${PORT}`);
});
