const { Router } = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Otp = require('../models/otp');
const User = require('../models/user');
const Blog = require('../models/Blog');
const path = require('path');
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
        text: 
`Dear User,

Just one more step to download.

You must confirm your identity using this one-time pass code: ${otp}

Note: This code will expire in 10 minutes.


Sincerely,

Sankalp Ashish `,
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
    const cachedValue = await client.get(key);
    return cachedValue;
}

function getHashKey(search_mail) {
    return crypto.createHash('sha256').update(JSON.stringify(search_mail)).digest('hex');
}

router.get('/request/:uuid', (req, res) => {
    const { blogId, uuid, errorMessage } = req.query;
    const { uuid: requestUuid } = req.params;
    res.render('otpRequest', { blogId, uuid: requestUuid, errorMessage: errorMessage || null });
});

router.post('/generate', async (req, res) => {
    const { email, blogId } = req.body;
    const { uuid } = req.query;
    const checkRedis = await find_in_redis(email);
    if (checkRedis) {
        console.log("Cache Hit");
        return otpgenerator(email, blogId, uuid, res);
    }
    const user = await User.findOne({ email });
    if (!user) {
        const errorMessage = 'Email not found';
        return res.redirect(`/otp/request/${uuid}?blogId=${blogId}&errorMessage=${errorMessage}`);
    }
    console.log("Cache Miss");
    const key = getHashKey(email);
    await client.set(key, JSON.stringify(user), 'EX', 3600);
    otpgenerator(email, blogId, uuid, res);
});

router.get('/verify', (req, res) => {
    const { blogId, uuid, errorMessage } = req.query;
    res.render('otpVerify', { blogId, uuid, errorMessage: errorMessage || null });
});

router.post('/verify', async (req, res) => {
    const { email, otp, blogId } = req.body;
    const { uuid } = req.query;

    const storedOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!storedOtp || storedOtp.otp !== otp) {
        const errorMessage = 'Invalid or expired OTP';
        return res.redirect(`/otp/verify?blogId=${blogId}&uuid=${uuid}&errorMessage=${errorMessage}`);
    }

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
