const router = require('express').Router();
const controller = require('./cart.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  addToCartValidation,
  applyCouponValidation,
  updateQuantityValidation
} = require('./cart.validation');

// Get cart
router.get('/cart', auth, controller.getCart);

// Add to cart
router.post('/cart/items', auth, addToCartValidation, validate, controller.addToCart);

// Update item quantity
router.put('/cart/items/:itemId/quantity', auth, updateQuantityValidation, validate, controller.updateItemQuantity);

// Remove item from cart
router.delete('/cart/items/:itemId', auth, controller.removeFromCart);

// Clear cart
router.delete('/cart', auth, controller.clearCart);

// Save for later
router.post('/cart/items/:itemId/save', auth, controller.saveForLater);

// Apply coupon
router.post('/cart/coupon', auth, applyCouponValidation, validate, controller.applyCoupon);

// Remove coupon
router.delete('/cart/coupon', auth, controller.removeCoupon);

module.exports = router;

