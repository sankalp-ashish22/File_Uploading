const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) {
            return res.redirect("/user/signin");
        }
        try {
            const userPayload = validateToken(tokenCookieValue);
            console.log('Decoded user payload:', userPayload); // Check if fullName is present
            req.user = userPayload;
            next();
        } catch (error) {
            console.error('Error validating token:', error.message);
            return res.redirect("/user/signin");
        }
    };
}

module.exports = {
    checkForAuthenticationCookie,
};
