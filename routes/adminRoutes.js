const express = require('express');
const router = express.Router();
const {authenticate, authorize} = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const guestController = require('../controllers/guestController');

router.post('/login', authController.loginAdmin);
router.post('/couple/login', authController.loginCouple);
router.post('/couples', authenticate, authorize('admin'), authController.createCouple);
router.get('/couples', authenticate, authorize('admin'), authController.listCouples);

router.post('/add-guest', authenticate, authorize('admin', 'couple'), guestController.addGuest);
router.get('/guests', authenticate, authorize('admin', 'couple'), guestController.getAllGuests);
router.post('/verify-guest', authenticate, authorize('admin', 'couple'), guestController.verifyGuest);
router.post('/import', authenticate, authorize('admin', 'couple'), guestController.importGuestsFromCsv);
router.delete('/delete/:phoneNumber', authenticate, authorize('admin', 'couple'), guestController.deleteGuest);
router.post('/confirm-rsvp/:uniqueId', authenticate, authorize('admin', 'couple'), guestController.confirmRsvp);
router.post('/send-sms', authenticate, authorize('admin', 'couple'), guestController.sendSms);

module.exports = router;
