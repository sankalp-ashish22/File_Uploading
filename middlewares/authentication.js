// middlewares/authentication.js
const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) {
            return res.redirect("/user/signin");
        }
        try {
            const userPayload = validateToken(tokenCookieValue);
            req.user = userPayload;
        } catch (error) {
            return res.redirect("/user/signin");
        }
        next();
    };
}

module.exports = {
    checkForAuthenticationCookie,
};
