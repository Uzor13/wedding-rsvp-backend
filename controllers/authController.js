const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

const login = (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    } else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
};

module.exports = { login };
