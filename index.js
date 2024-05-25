const path = require("path");
const express = require('express');
const mongoose = require("mongoose");
const cookiePaser = require('cookie-parser')
const userRoute = require('./routes/user');
const { checkForAuthenticationCookie } = require("./middlewares/authentication");

const app = express();
const PORT = 8000;

mongoose.connect('mongodb://localhost:27017/FileUpload', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit process with failure
    });

app.set('view engine', 'ejs');
app.set('views', path.resolve("./views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookiePaser());
app.use(checkForAuthenticationCookie('token'));
app.get('/', (req, resp) => {
    resp.render("home",{
        user: req.user,
    });
});

app.use("/user", userRoute);
app.listen(PORT, () => {
    console.log(`Server Started at PORT: ${PORT}`);
});
