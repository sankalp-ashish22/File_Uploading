// routes/user.js
const { Router } = require("express");
const User = require('../models/user');
const router = Router();

router.get('/signin', (req, res) => {
    return res.render("signin");
});

router.get('/signup', (req, res) => {
    return res.render("signup");
});

router.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    try {
        const token = await User.matchPasswordAndGenerateToken(email, password);
        console.log('Token', token);
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

    try {
        const newUser = await User.create({
            fullName,
            email,
            password,
        });
        console.log("User created successfully:", newUser);
        return res.redirect("/user/signin");
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
