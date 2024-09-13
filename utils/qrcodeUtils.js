const qrCode = require('qrcode');

const generateQrCode = async (link) => {
    try {
        return await qrCode.toDataURL(link);
    } catch (err) {
        throw new Error('QR Code generation failed');
    }
};

module.exports = { generateQrCode };
