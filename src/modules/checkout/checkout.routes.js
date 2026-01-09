const router = require('express').Router();
const controller = require('./checkout.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { processCheckoutValidation } = require('./checkout.validation');

// Get checkout summary
router.get('/checkout', controller.getCheckoutSummary);

// Process checkout (create order and payment)
router.post('/checkout', auth, processCheckoutValidation, validate, controller.processCheckout);

module.exports = router;

