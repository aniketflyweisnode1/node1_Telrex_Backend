const cartService = require('./cart.service');

// Get cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    res.status(200).json({ success: true, data: cart });
  } catch (err) { next(err); }
};

// Add to cart
exports.addToCart = async (req, res, next) => {
  try {
    const cart = await cartService.addToCart(req.user.id, req.body);
    res.status(200).json({ 
      success: true, 
      message: 'Item added to cart successfully', 
      data: cart 
    });
  } catch (err) { next(err); }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await cartService.removeFromCart(req.user.id, req.params.itemId);
    res.status(200).json({ 
      success: true, 
      message: 'Item removed from cart', 
      data: cart 
    });
  } catch (err) { next(err); }
};

// Clear cart
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    res.status(200).json({ 
      success: true, 
      message: 'Cart cleared successfully', 
      data: cart 
    });
  } catch (err) { next(err); }
};

// Update item quantity
exports.updateItemQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await cartService.updateItemQuantity(req.user.id, req.params.itemId, quantity);
    res.status(200).json({ 
      success: true, 
      message: 'Quantity updated', 
      data: cart 
    });
  } catch (err) { next(err); }
};

// Save for later
exports.saveForLater = async (req, res, next) => {
  try {
    const cart = await cartService.saveForLater(req.user.id, req.params.itemId);
    res.status(200).json({ 
      success: true, 
      message: 'Item saved for later', 
      data: cart 
    });
  } catch (err) { next(err); }
};

// Unsave item (move back to active cart)
exports.unsaveItem = async (req, res, next) => {
  try {
    const cart = await cartService.unsaveItem(req.user.id, req.params.itemId);
    res.status(200).json({ 
      success: true, 
      message: 'Item moved back to cart', 
      data: cart 
    });
  } catch (err) { next(err); }
};

// Apply coupon
exports.applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    const result = await cartService.applyCoupon(req.user.id, couponCode);
    res.status(200).json({ 
      success: true, 
      message: 'Coupon applied successfully', 
      data: result 
    });
  } catch (err) { next(err); }
};

// Remove coupon
exports.removeCoupon = async (req, res, next) => {
  try {
    const cart = await cartService.removeCoupon(req.user.id);
    res.status(200).json({ 
      success: true, 
      message: 'Coupon removed', 
      data: cart 
    });
  } catch (err) { next(err); }
};

