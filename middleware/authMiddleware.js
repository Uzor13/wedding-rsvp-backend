const jwt = require('jsonwebtoken');
const {SECRET_KEY} = require('../config');

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({message: 'Unauthorized'});
    }

    try {
        const payload = jwt.verify(token, SECRET_KEY);
        req.auth = payload;
        next();
    } catch (error) {
        res.status(401).json({message: 'Unauthorized'});
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
        return res.status(403).json({message: 'Forbidden'});
    }
    next();
};

module.exports = {authenticate, authorize};
