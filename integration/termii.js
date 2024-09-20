const axios = require('axios');

const API_KEY = process.env.TERMII_API_KEY;
const SENDER_ID = 'WeddingRSVP';

async function sendSMS(to, message) {
    const url = 'https://v3.api.termii.com/api/sms/send';

    const data = {
        to: to,
        from: SENDER_ID,
        sms: message,
        type: 'unicode',
        api_key: API_KEY,
        channel: 'generic',
    };

    try {
        const response = await axios.post(url, data);
        console.log('SMS sent successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending SMS:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {sendSMS}