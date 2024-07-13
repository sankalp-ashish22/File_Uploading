const { Router } = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Blog = require(path.join(__dirname, '../models/Blog'));
const { verifyOTP } = require('../middlewares/otpVerification');
const { checkForAuthenticationCookie} = require('../middlewares/authentication'); // Ensure correct import
const client = require("../client");


const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve('./public/uploads'));
    },
    filename: function (req, file, cb) {
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage }).array('coverImage', 10); // 'coverImages' is the field name for multiple files

// Route for viewing a specific blog by ID
router.get('/:id', checkForAuthenticationCookie('token'), async (req, res) => {
    const { id } = req.params;

    if (id === 'add-new') {
        return res.render('addblog', {
            user: req.user,
        });
    } else {
        try {
            const blog = await Blog.findById(id);
            if (!blog) {
                return res.status(404).send('Blog not found');
            }
            return res.render('blog', {
                user: req.user,
                blog,
            });
        } catch (error) {
            console.error('Error fetching blog:', error);
            return res.status(500).send('Internal Server Error');
        }
    }
});

// Route for downloading a blog
router.get('/download/:id', checkForAuthenticationCookie('token'), async (req, res) => {
    const { id } = req.params;
    // console.log(id);
    const uuid = crypto.randomUUID();
    
    try {
        await client.set(id, JSON.stringify(uuid), 'EX', 3000);
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).send('Blog not found');
        }
        res.render('downloading', {
            blog,
            uuid: uuid,
            id: id
        });
    } catch (error) {
        console.error('Error fetching blog:', error);
        return res.status(500).send('Internal Server Error');
    }
});

// Route for creating a new blog
router.post('/', checkForAuthenticationCookie('token'), (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(500).send('Internal Server Error');
        } else if (err) {
            console.error('Unknown Error:', err);
            return res.status(500).send('Internal Server Error');
        }

        try {
            const { title } = req.body;
            const files = req.files;

            // Assuming you want to create a blog entry for each uploaded file
            const blogPromises = files.map(async file => {
                const blog = await Blog.create({
                    title,
                    createdBy: req.user._id,
                    coverImageURL: `uploads/${file.filename}`,
                });
                return blog;
            });

            const createdBlogs = await Promise.all(blogPromises);
            return res.redirect("/");
        } catch (error) {
            console.error('Error creating blog:', error);
            return res.status(500).send('Internal Server Error');
        }
    });
});



// Route for deleting a blog
router.delete('/:id', checkForAuthenticationCookie('token'), async (req, res) => {
    const { id } = req.params;
    try {
        const blog = await Blog.findByIdAndDelete(id);
        if (!blog) {
            return res.status(404).send('Blog not found');
        }
        res.sendStatus(204); // No Content
    } catch (error) {
        console.error('Error deleting blog:', error);
        return res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
