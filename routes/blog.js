const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const Blog = require('../models/Blog');
const { verifyOTP } = require('../middlewares/otpVerification');
const { checkForAuthenticationCookie } = require('../middlewares/authentication');

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

const upload = multer({ storage: storage });

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
    const uuid = crypto.randomUUID();
    try {
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
router.post('/', checkForAuthenticationCookie('token'), upload.single('coverImage'), async (req, res) => {
    try {
        const { title } = req.body;
        const blog = await Blog.create({
            title,
            createdBy: req.user._id,  // Ensure createdBy is set to the authenticated user's ID
            coverImageURL: `uploads/${req.file.filename}`,
        });

        return res.redirect(`/blog/${blog._id}`);
    } catch (error) {
        console.error('Error creating blog:', error);
        return res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
