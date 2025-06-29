const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    // 1. Get the token from the request header
    const token = req.header('x-auth-token');

    // 2. Check if there is no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // 3. If there is a token, verify it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. If valid, attach the user's info to the request object
        req.user = decoded.user;

        // 5. Move on to the next function (the actual API route)
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
}

module.exports = authMiddleware;