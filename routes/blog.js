const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const Blog = require('../models/Blog');

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

router.get('/:id', async (req, resp) => {
    const blog = await Blog.findById(req.params.id);
    return resp.render('blog', {
        user: req.user,
        blog,
    });
});
router.get('/download/:id', async (req, resp) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog || !blog.coverImageURL) {
      return resp.status(404).send('Image not found');
  }
  
  const imagePath = path.resolve(`./public/${blog.coverImageURL}`);
  resp.download(imagePath, err => {
      if (err) {
          console.error('Error downloading file:', err);
          resp.status(500).send('Error downloading file');
      }
  });
});

router.get('/add-new', (req, resp) => {
    return resp.render('addblog', {
        user: req.user,
    });
});

router.post('/', upload.single('coverImage'), async (req, resp) => {
    const { title } = req.body;
    const blog = await Blog.create({
        title,
        createdBy: req.user._id,
        coverImageURL: `uploads/${req.file.filename}`,
    });

    console.log(req.body);
    console.log(req.file);
    return resp.redirect(`/blog/${blog._id}`);
});

module.exports = router;
