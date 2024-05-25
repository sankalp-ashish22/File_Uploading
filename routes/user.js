const { Router } = require("express");
const User = require('../models/user');
const router = Router();

router.get('/signin', (req, resp) => {
    return resp.render("signin");
});

router.get('/signup', (req, resp) => {
    return resp.render("signup");
});

router.post("/signin", async (req, resp) => {
    const { email, password } = req.body;
    try {
        const token = await User.matchPasswordAndGenerateToken(email, password);
        console.log('Token', token);
        return resp.cookie("token", token).redirect("/");
    } catch (error) {
        console.error('Error during sign-in:', error.message); // Log the error for debugging
        return resp.render("signin", {
            error: "Incorrect Email or Password",
        });
    }
});
router.get("/logout",(req,resp)=>{
    resp.clearCookie("token").redirect("/user/signin")
})
router.post('/signup', async (req, resp) => {
    const { fullName, email, password } = req.body;
    console.log("Received data:", { fullName, email, password }); // Log the received data

    try {
        const newUser = await User.create({
            fullName,
            email,
            password,
        });
        console.log("User created successfully:", newUser); // Log successful creation
        return resp.redirect("/");
    } catch (error) {
        if (error.code === 11000) { // MongoDB duplicate key error
            console.error("Email already exists:", email);
            return resp.status(400).send("Email already exists");
        } else {
            console.error("Error during user creation:", error);
            return resp.status(500).send("Internal Server Error");
        }
    }
});

module.exports = router;
