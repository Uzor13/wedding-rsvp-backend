const crypto = require('crypto');

const generateUniqueId = () => {
    return crypto.randomBytes(16).toString('hex');
};

const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

module.exports = { generateUniqueId, generateCode };
