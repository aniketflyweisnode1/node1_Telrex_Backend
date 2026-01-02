const notificationService = require('./notification.service');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications(req.user.id, req.query);
    res.status(200).json({ success: true, data: notifications });
  } catch (err) { next(err); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (err) { next(err); }
};

