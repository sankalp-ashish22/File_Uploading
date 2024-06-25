const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName) {
    return async (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) {
            return res.redirect("/user/signin");
        }
        
        try {
            const userPayload = await validateToken(tokenCookieValue); // Assuming validateToken returns a promise
            req.user = userPayload;

            // Check if user is an admin and redirect to admin homepage if accessing root path
            if (req.user.role === 'ADMIN' && req.path === '/') {
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
