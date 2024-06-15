const { Router } = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Otp = require('../models/otp');
const User = require('../models/user');
const Blog = require('../models/Blog');
const path = require('path');
const { verifyOTP } = require('../middlewares/otpVerification');
const client = require("../client");
require('dotenv').config();

const router = Router();

async function otpgenerator(email, blogId, uuid, res) {
 
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

        res.redirect(`/otp/verify?blogId=${blogId}&uuid=${uuid}`);
    });
}

async function find_in_redis(search_mail) {
    const key = getHashKey(search_mail);
    const cachedValue = await client.get(key); // Corrected Redis command
    return cachedValue;
}

function getHashKey(search_mail) {
    return crypto.createHash('sha256').update(JSON.stringify(search_mail)).digest('hex');
}

router.get('/request', (req, res) => {
    const { blogId, uuid } = req.query;
    console.log(req.query);
    res.render('otpRequest', { blogId, uuid });
});

router.post('/generate', async (req, res) => {
    const { email, blogId } = req.body;
    const { uuid } = req.query;
    console.log(uuid);
    const checkRedis = await find_in_redis(email);
    if (checkRedis) {
        console.log("Cache Hit");
        return otpgenerator(email, blogId, uuid, res); // Added return statement
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).send('Email not found');
    }
    console.log("Cache Miss");
    const key = getHashKey(email);
    await client.set(key, JSON.stringify(user), 'EX', 300); // Store in the cached memory for 300 seconds afer that it will expired
    otpgenerator(email, blogId, uuid, res);
});

router.get('/verify', (req, res) => {
    const { blogId, uuid } = req.query;
    res.render('otpVerify', { blogId, uuid });
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
