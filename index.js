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
const User = require('./models/user');

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
app.get('/admin/homepage', checkForAuthenticationCookie('token'), async (req, res) => {
    try {
        const userBlogs = await Blog.find({ });
        const blogCount = userBlogs.length;

      
        // Calculate the percentage of the total size relative to 1 GB
        const percentageOf1GB = (blogCount / 100) * 100;

      console.log(percentageOf1GB);

        res.render("admin", {
            user: req.user,
            blogs: userBlogs,
            blogCount: blogCount,
            Tpercentage: percentageOf1GB // Pass the percentage to the template, rounded to 2 decimal places
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/admin/registered_user', async (req, res) => {
    try {
        const users = await User.find({}); // Fetch all users from database
        res.render('registered_user', { users: users }); // Render 'registered_user' view with users data
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server started at PORT: ${PORT}`);
});
