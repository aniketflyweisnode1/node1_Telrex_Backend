const Notification = require('../../models/Notification.model');
const AppError = require('../../utils/AppError');

// Get all notifications
exports.getNotifications = async (userId, query = {}) => {
  const filter = { user: userId };
  if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';
  
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(query.limit ? parseInt(query.limit) : 50);
  
  return notifications;
};

// Mark notification as read
exports.markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId
  });
  
  if (!notification) throw new AppError('Notification not found', 404);
  
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();
  
  return notification;
};

// Create notification (helper function for other services)
exports.createNotification = async (userId, data) => {
  const notification = await Notification.create({
    user: userId,
    ...data
  });
  
  return notification;
};

