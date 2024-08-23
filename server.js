const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const qrCode = require('qrcode');
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, )
    .then(r => console.log('Connected to the DB...'))
    .catch(err => console.log(err));

const db = mongoose.connection;
db.on('error', err => console.error.bind(err, 'DB connection error:'));
db.once('open', () => console.log('Connected to the DB...'));

const guestSchema = new mongoose.Schema({
    name: String,
    email: String,
    phoneNumber: String,
    rsvpStatus: {type: Boolean, default: false},
    uniqueId: {type: String, unique: true},
    code: {type: String, unique: true},
    qrCode: String,
    qrcodeScanned: {type: Boolean, default: false},
})
const Guest = mongoose.model('Guest', guestSchema);

const generateUniqueId = () => {
    return crypto.randomBytes(16).toString('hex');
}

const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

//Add new guest
app.post('/api/guests', async (req, res) => {
    try {
        const {name, email, phoneNumber} = req.body;
        const uniqueId = generateUniqueId();
        const uniqueLink = process.env.SITE_LINK + `/${uniqueId}`;
        const qrcode = qrCode.toDataURL(uniqueLink);
        const code = generateCode();

        const guest = new Guest({
            name,
            email,
            phoneNumber,
            uniqueId,
            qrcode,
            code,
        });
        await guest.save();
        res.status(201).json({guest, uniqueLink})
    } catch (e) {
        res.status(400).json({error: e.message});
    }
})

// API to handle rsvp
app.post('/api/rsvp/:uniqueId', async (req, res) => {
    console.log(req)
    try {
        const guest = await Guest.findOne({uniqueId: req.params.uniqueId}, null, null);
        console.log(guest);
        if (guest) {
            guest.rsvpStatus = true;
            await guest.save();
            res.status(201).json({guest, success: true});
        } else {
            res.status(404).json({message: 'No guest found', success: false});
        }
    } catch (e) {
        res.status(500).json({message: e.message, success: false});
    }

})

//API to return guest information
app.get('/api/guest/:uniqueId', async (req, res) => {
    try {
        console.log(req.params)
        const guest = await Guest.findOne({ uniqueId: req.params.uniqueId }, null, null);
        if (guest) {
            res.json(guest);
        } else {
            res.status(404).json({ error: 'Guest not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// API route to get all guests
app.get('/api/guests', async (req, res) => {
    try {
        console.log(req.params);
        const guests = await Guest.find({}, null, null).select('-qrCode'); // Exclude qrCode for performance
        res.json(guests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
module.exports = app;