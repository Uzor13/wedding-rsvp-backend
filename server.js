const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const qrCode = require('qrcode');
const mongoose = require('mongoose');
const crypto = require('crypto');
const pdf = require('html-pdf');
const csv = require('csv-parse');
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
    phoneNumber: String,
    rsvpStatus: {type: Boolean, default: false},
    uniqueId: {type: String, unique: true},
    code: {type: String, unique: true},
    qrCode: String,
    isUsed: { type: Boolean, default: false },
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
        const {name, phoneNumber} = req.body;
        const uniqueId = generateUniqueId();
        const uniqueLink = process.env.SITE_LINK + `/${uniqueId}`;
        const qrcode = qrCode.toDataURL(uniqueLink);
        const code = generateCode();

        const guest = new Guest({
            name,
            phoneNumber,
            uniqueId,
            qrcode,
            code,
        });
        await guest.save();
        res.status(201).json({guest, uniqueLink, code})
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

app.post('/api/verify', async (req, res) => {
    try {
        const { uniqueId, fourDigitCode } = req.body;
        const guest = await Guest.findOne({
            $or: [{ uniqueId }, { fourDigitCode }],
            isUsed: false
        }, null, null);

        if (!guest) {
            return res.status(404).json({ success: false, message: 'Invalid code or already used' });
        }

        guest.isUsed = true;
        guest.rsvpStatus = true;
        await guest.save();

        res.json({ success: true, message: 'Verification successful', guestName: guest.name });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/invitation/:uniqueId/pdf', async (req, res) => {
    try {
        const guest = await Guest.findOne({ uniqueId: req.params.uniqueId }, null, null);
        if (!guest) {
            return res.status(404).json({ error: 'Guest not found' });
        }

        const htmlContent = `
      <html>
        <body>
          <h1>Wedding Invitation</h1>
          <p>Dear ${guest.name},</p>
          <p>You are cordially invited to our wedding celebration.</p>
          <p>Your unique code: ${guest.code}</p>
          <img src="${guest.qrCode}" alt="QR Code" />
        </body>
      </html>
    `;

        pdf.create(htmlContent).toBuffer((err, buffer) => {
            if (err) {
                return res.status(500).json({ error: 'PDF generation failed' });
            }
            res.contentType('application/pdf');
            res.send(buffer);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/guests/import', async (req, res) => {
    try {
        const { csvData } = req.body;

        csv.parse(csvData, {
            columns: true,
            trim: true
        }, async (err, records) => {
            if (err) {
                return res.status(400).json({ error: 'Invalid CSV format' });
            }

            const importedGuests = [];

            for (const record of records) {
                const uniqueId = generateUniqueId();
                const code = generateCode();
                const qrCode = await qrCode.toDataURL(uniqueId);

                const guest = new Guest({
                    name: record.name,
                    phoneNumber: record.phoneNumber,
                    uniqueId,
                    code,
                    qrCode
                });

                await guest.save();
                importedGuests.push(guest);
            }

            res.json(importedGuests);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
module.exports = app;