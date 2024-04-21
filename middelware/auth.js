const jwt = require('jsonwebtoken');
const secretKey = require('../crypto/secretKey');

module.exports = function (req, res, next) {
    // Get token from request headers
    const token = req.headers.authorization;

    // Check if token exists
    if (!token) {
        return res.status(401).json({ message: "No Token, authorization denied" });
    }

    try {
        // Verify Token
        const decoded = jwt.verify(token.split(' ')[1], secretKey); // Extract token without "Bearer " prefix
        req.user = decoded; // Attach decoded user object to request object
        next(); // Call next middleware
    } catch (error) {
        return res.status(401).json({ message: "Token is not valid" });
    }
};
