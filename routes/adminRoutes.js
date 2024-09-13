const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const guestController = require('../controllers/guestController');

router.post('/login', authController.login);
router.post('/add-guest', verifyAdmin, guestController.addGuest);
router.get('/guests', verifyAdmin, guestController.getAllGuests);
router.post('/verify-guest', verifyAdmin, guestController.verifyGuest);
router.post('/import', guestController.importGuestsFromCsv);

module.exports = router;
