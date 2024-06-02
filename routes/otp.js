const { Router } = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Otp = require('../models/otp');
const User = require('../models/user');
const Blog = require('../models/Blog');
const path = require('path');
const { verifyOTP } = require('../middlewares/otpVerification');
require('dotenv').config();

const router = Router();

router.get('/request', (req, res) => {
    const { blogId, uuid } = req.query; // Get uuid from query parameters
    console.log(req.query);
    res.render('otpRequest', { blogId, uuid }); // Pass uuid to the OTP request view
});

router.post('/generate', async (req, res) => {
    const { email, blogId } = req.body;
    const { uuid } = req.query; // Extract uuid from req.query
    console.log(uuid);
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).send('Email not found');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    await Otp.create({ email, otp });

    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for file download',
        text: `Your OTP is ${otp}`,
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending email');
        }

        res.redirect(`/otp/verify?blogId=${blogId}&uuid=${uuid}`); // Use extracted uuid
    });
});


router.get('/verify', (req, res) => {
    const { blogId,uuid } = req.query;
    res.render('otpVerify', { blogId,uuid });
});

router.post('/verify', verifyOTP, async (req, res) => {
    const { blogId } = req.body;
    try {
        const blog = await Blog.findById(blogId);
        if (!blog || !blog.coverImageURL) {
            return res.status(404).send('File not found');
        }

        const filePath = path.resolve(`./public/${blog.coverImageURL}`);
        res.download(filePath);
    } catch (error) {
        console.error('Error downloading file:', error);
        return res.status(500).send('Error downloading file');
    }
});

module.exports = router;
