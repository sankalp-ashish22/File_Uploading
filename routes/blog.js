// routes/blog.js
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const Blog = require('../models/Blog');
const { checkForAuthenticationCookie } = require("../middlewares/authentication");

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

router.get('/add-new', checkForAuthenticationCookie('token'), (req, res) => {
    return res.render('addblog', {
        user: req.user,
    });
});

router.get('/:id', checkForAuthenticationCookie('token'), async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    return res.render('blog', {
        user: req.user,
        blog,
    });
});

router.get('/download/:id', checkForAuthenticationCookie('token'), async (req, res) => {
    const uuid = crypto.randomUUID();
    console.log(uuid);
    const blog = await Blog.findById(req.params.id);
    res.render('downloading', { uuid: uuid, blog: blog });
});

router.post('/', checkForAuthenticationCookie('token'), upload.single('coverImage'), async (req, res) => {
    const { title } = req.body;
    const blog = await Blog.create({
        title,
        createdBy: req.user._id,
        coverImageURL: `uploads/${req.file.filename}`,
    });

    console.log(req.body);
    console.log(req.file);
    return res.redirect(`/blog/${blog._id}`);
});

module.exports = router;
