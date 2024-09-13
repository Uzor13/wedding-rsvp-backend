const jwt = require('jsonwebtoken');
const SECRET_KEY = "mysecretkey";
require('dotenv').config();

const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from the Authorization header
    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        if (decoded.role === 'admin') {
            next();  // Allow access to the protected route
        } else {
            return res.status(403).json({ message: 'Forbidden' });
        }
    });
}

module.exports = {verifyAdmin};
