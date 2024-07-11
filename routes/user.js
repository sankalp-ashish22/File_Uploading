const { Router } = require("express");
const User = require('../models/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const upotp = require('../models/upotp')
const { createTokenForUser } = require("../services/authentication");
const router = Router();



async function otpgenerator(email) {
    const otp = crypto.randomInt(100000, 999999).toString();
    await upotp.create({ email, otp });

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
        subject: 'User Verification',
        text: 
`Dear User,

Just one more step to get registered.

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

        res.redirect(`/signup`);
    });
}







router.get('/signin', (req, res) => {
    return res.render("signin");
});

router.get('/signup', (req, res) => {
    return res.render("signup", { error: null });
});

router.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    try {
        const token = await User.matchPasswordAndGenerateToken(email, password);
        return res.cookie("token", token).redirect("/");
    } catch (error) {
        console.error('Error during sign-in:', error.message);
        return res.render("signin", {
            error: "Incorrect Email or Password",
        });
    }
});

router.get("/logout", (req, res) => {
    res.clearCookie("token").redirect("/user/signin");
});

router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    // Check if any required field is missing
    if (!fullName || !email || !password) {
        console.error("Missing required fields:", req.body);
        return res.status(400).render("signup", { error: "All fields are required" });
    }

    try {
        // Check if email already exists in the database
        const user = await User.findOne({ email });
        if (user) {
            console.error("Email already exists:", email);
            return res.status(400).render("signup", { error: "Email already exists" });
        }

        // Generate OTP and send email
        await otpgenerator(email);

        return res.redirect("/signup/verify");

    } catch (error) {
        if (error.code === 11000) {
            console.error("Email already exists:", email);
            return res.status(400).render("signup", { error: "Email already exists" });
        } else {
            console.error("Error during user creation:", error);
            return res.status(500).render("signup", { error: "Internal Server Error" });
        }
    }
});






module.exports = router;
