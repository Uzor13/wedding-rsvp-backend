require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

const client = twilio(accountSid, authToken);

async function sendSMS(to, message) {
    try {
        const result = await client.messages.create({
            body: message,
            messagingServiceSid: messagingServiceSid,
            to: to
        });
        console.log(`SMS sent successfully to ${to}. SID: ${result.sid}`);
        return result;
    } catch (error) {
        console.error(`Error sending SMS to ${to}:`, error);
        throw error;
    }
}

module.exports = {sendSMS};