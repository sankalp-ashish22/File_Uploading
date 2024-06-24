require('dotenv').config();
const path = require("path");
const express = require('express');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const userRoute = require('./routes/user');
const blogRoute = require("./routes/blog");
const otpRoute = require("./routes/otp");
const { checkForAuthenticationCookie } = require("./middlewares/authentication");
const client = require("./client");
const app = express();
const PORT = 8000;

const Blog = require('./models/Blog');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/FileUpload')
    .then(() => console.log("MongoDB Connected"))
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit process with failure
    });

// Middleware and view engine setup
app.set('view engine', 'ejs');
app.set('views', path.resolve("./views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());

// Routes setup
app.use('/user', userRoute);
app.use('/blog', blogRoute);
app.use('/otp', otpRoute);

// Home route
app.get('/', checkForAuthenticationCookie('token'), async (req, res) => {
    try {
        // Redirect admin to admin homepage
        if (req.user.role === 'ADMIN') {
            return res.redirect('/admin/homepage');
        }
        
        // Fetch blogs created by the current authenticated user
        const userBlogs = await Blog.find({ createdBy: req.user._id });
        const blogCount = userBlogs.length;
        const blogsWithSize = userBlogs.map(blog => {
            const contentLength = blog.content ? blog.content.length : 0;
            return {
                ...blog._doc,
                totalSize: contentLength
            };
        });
        res.render("home", {
            user: req.user,
            blogs: userBlogs,
            blogCount: blogCount,
            blogsWithSize: blogsWithSize,
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Admin homepage route
app.get('/admin/homepage', checkForAuthenticationCookie('token'), async (req, res) => {
    try {
        const userBlogs = await Blog.find({ createdBy: req.user._id });
        const blogCount = userBlogs.length;
        const blogsWithSize = userBlogs.map(blog => {
            const contentLength = blog.content ? blog.content.length : 0;
            return {
                ...blog._doc,
                totalSize: contentLength
            };
        });
        res.render("admin", {
            user: req.user,
            blogs: userBlogs,
            blogCount: blogCount,
            blogsWithSize: blogsWithSize,
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server started at PORT: ${PORT}`);
});
