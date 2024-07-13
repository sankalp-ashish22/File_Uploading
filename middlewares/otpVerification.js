const OTPModel = require('../models/Otp');

const verifyOTP = async (req, res, next) => {
    try {
        const { otp, email } = req.body;

        if (!otp || !email) {
            return res.status(400).json({ error: 'OTP and Email are required' });
        }

        const existingOTP = await OTPModel.findOne({ email, otp });

        if (!existingOTP || existingOTP.createdAt < new Date(Date.now() - 10 * 60 * 1000)) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        await OTPModel.deleteOne({ _id: existingOTP._id });

        next();
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { verifyOTP };
