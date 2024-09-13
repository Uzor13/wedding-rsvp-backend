const Guest = require('../models/guestModel');
const qrCode = require('qrcode');
const { SITE_LINK } = require('../config');
const { generateUniqueId, generateCode } = require('../utils/idUtils');
const pdfUtils = require('../utils/pdfUtils');

// Add new guest
const addGuest = async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;

        const existingGuest = await Guest.findOne({ phoneNumber });
        if (existingGuest) {
            return res.status(400).json({ message: 'Guest with this phone number already exists' });
        }

        const uniqueId = generateUniqueId();
        const uniqueLink = `${SITE_LINK}/rsvp/${uniqueId}`;
        const qrcode = await qrCode.toDataURL(uniqueLink);
        const code = generateCode();

        const guest = new Guest({
            name,
            phoneNumber,
            uniqueId,
            qrCode: qrcode,
            code,
        });

        await guest.save();
        res.status(201).json({ guest, uniqueLink, code });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

// Handle RSVP
const handleRsvp = async (req, res) => {
    try {
        const guest = await Guest.findOne({ uniqueId: req.params.uniqueId });
        if (guest) {
            guest.rsvpStatus = true;
            await guest.save();
            res.status(201).json({ guest, success: true });
        } else {
            res.status(404).json({ message: 'No guest found', success: false });
        }
    } catch (e) {
        res.status(500).json({ message: e.message, success: false });
    }
};

// Get guest information
const getGuestInfo = async (req, res) => {
    try {
        const guest = await Guest.findOne({ uniqueId: req.params.uniqueId });
        if (guest) {
            res.json(guest);
        } else {
            res.status(404).json({ error: 'Guest not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all guests
const getAllGuests = async (req, res) => {
    try {
        const guests = await Guest.find({}).select('-qrCode');
        res.json(guests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify guest
const verifyGuest = async (req, res) => {
    try {
        const { uniqueId, code } = req.body;
        const guest = await Guest.findOne({ $or: [{ uniqueId }, { code }] });

        if (!guest) {
            return res.status(401).json({ success: false, message: 'Guest not found' });
        }

        if (guest.isUsed) {
            return res.status(400).json({ success: false, message: 'This code has already been used' });
        }

        guest.isUsed = true;
        guest.rsvpStatus = true;
        await guest.save();

        res.json({ success: true, message: 'Verification successful', guestName: guest.name });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Generate PDF invitation
const generateInvitationPdf = async (req, res) => {
    try {
        const guest = await Guest.findOne({ uniqueId: req.params.uniqueId });
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

        pdfUtils.createPdfBuffer(htmlContent, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Import guests from CSV
const importGuestsFromCsv = async (req, res) => {
    try {
        const { csvData } = req.body;

        csv.parse(csvData, { columns: true, trim: true }, async (err, records) => {
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
};

module.exports = {
    addGuest,
    handleRsvp,
    getGuestInfo,
    getAllGuests,
    verifyGuest,
    generateInvitationPdf,
    importGuestsFromCsv
};
