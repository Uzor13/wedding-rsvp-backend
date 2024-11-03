const AfricasTalking = require('africastalking');

const username = process.env.REACT_APP_SMS_USERNAME;
const apiKey = process.env.REACT_APP_SMS_API_KEY;

const africastalking = AfricasTalking({ username, apiKey });

const sms = africastalking.SMS;

async function sendBulkSMS(recipients, message) {
    try {
        console.log(recipients)
        const result = await sms.send({
            to: recipients,
            message: message
        });
        console.log("result", result);
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
}


module.exports = {
    sendBulkSMS
}

