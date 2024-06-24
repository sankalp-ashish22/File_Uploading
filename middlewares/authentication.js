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

            if (userPayload.role === 'ADMIN' && req.path === '/') {
                return res.redirect("/admin/homepage");
            }
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
