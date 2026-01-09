const router = require('express').Router();
const controller = require('./address.controller');
const auth = require('../../middlewares/auth.middleware');

router.get('/addresses', controller.getAddresses);
router.get('/addresses/:id', controller.getAddressById);
router.post('/addresses', auth, controller.createAddress);
router.put('/addresses/:id', auth, controller.updateAddress);
router.delete('/addresses/:id', auth, controller.deleteAddress);

module.exports = router;

