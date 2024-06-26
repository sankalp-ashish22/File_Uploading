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
        const users = await User.find({role:"USER"});
        const userCount = users.length;
      
        // Calculate the percentage of the total size relative to 1 GB
        const percentageOf1GB = (blogCount / 100) * 100;

      console.log(percentageOf1GB);

        res.render("admin", {
            user: req.user,
            blogs: userBlogs,
            blogCount: blogCount,
            Tpercentage: percentageOf1GB, // Pass the percentage to the template, rounded to 2 decimal places
            userCount: userCount,
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/admin/registered_user', checkForAuthenticationCookie('token'),async (req, res) => {
    try {
        const userBlogs = await Blog.find({});
        const blogCount = userBlogs.length;
        const users = await User.find({role:"USER"}); // Fetch all users from database
        const userCount = users.length;
        res.render('registered_user', { users: users, blogCount: blogCount, userCount: userCount }); // Render 'registered_user' view with users data
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.delete('/admin/registered_user/:userId', checkForAuthenticationCookie('token'),async (req, res) => {
    const userId = req.params.userId;

    try {
        // Delete user
        await User.findByIdAndDelete(userId);

        // Delete blogs associated with the user
        await Blog.deleteMany({ createdBy: userId });

        res.sendStatus(204); // Send success response
    } catch (error) {
        console.error('Error deleting user and blogs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/admin/registered_user/:userId/blogs', checkForAuthenticationCookie('token'),async (req, res) => {
    const userId = req.params.userId;

    try {
        // Fetch all blogs of the user
        const userBlogs = await Blog.find({ createdBy: userId });

        res.json(userBlogs); // Send user's blogs as JSON response
    } catch (error) {
        console.error('Error fetching user blogs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/admin/registered_user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const blog = await Blog.findById(id);
        if (!blog || !blog.coverImageURL) {
            return res.status(404).send('File not found');
        }

        const filePath = path.resolve(`./public/${blog.coverImageURL}`);
        console.log('File path:', filePath); // Debugging: Check the file path in console

        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                return res.status(500).send('Error downloading file');
            } else {
                console.log('File downloaded successfully:', filePath);
            }
        });
    } catch (error) {
        console.error('Error fetching blog:', error);
        return res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server started at PORT: ${PORT}`);
});
