const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user?.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// GET notifications for a specific user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Users can only access their own notifications unless they're admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get current date to filter out expired notifications
    const now = new Date();

    const notifications = await Notification.find({
      $and: [
        {
          $or: [
            { recipient: userId, isActive: true },
            { isGlobal: true, isActive: true }
          ]
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: now } }
          ]
        }
      ]
    })
    .populate('createdBy', 'First name Last name')
    .sort({ createdAt: -1 })
    .limit(50);

    // Add read status for each notification
    const notificationsWithReadStatus = notifications.map(notification => {
      const isRead = notification.readBy.some(read => 
        read.user && read.user.toString() === userId
      );
      
      return {
        ...notification.toObject(),
        isRead,
        readAt: isRead ? notification.readBy.find(read => 
          read.user && read.user.toString() === userId
        )?.readAt : null
      };
    });

    res.json({
      success: true,
      notifications: notificationsWithReadStatus,
      unreadCount: notificationsWithReadStatus.filter(n => !n.isRead).length
    });
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create new notification (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { title, message, recipient, isGlobal, type, priority, expiresAt } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    if (recipient && !mongoose.Types.ObjectId.isValid(recipient)) {
      return res.status(400).json({ message: 'Invalid recipient ID' });
    }

    // If recipient is specified, check if user exists
    if (recipient) {
      const user = await User.findById(recipient);
      if (!user) {
        return res.status(404).json({ message: 'Recipient user not found' });
      }
    }

    const notificationData = {
      title: title.trim(),
      message: message.trim(),
      recipient: recipient || null,
      isGlobal: !!isGlobal,
      type: type || 'system',
      priority: priority || 'normal',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id
    };

    const notification = new Notification(notificationData);
    await notification.save();
    await notification.populate('createdBy', 'First name Last name');

    // 🚀 REAL-TIME BROADCASTING VIA SOCKET.IO
    const io = req.app.get('socketio');
    if (io) {
      if (notificationData.isGlobal) {
        // Broadcast to all users
        io.emit('new_notification', notification);
        console.log('📢 Global notification sent to all users');
      } else if (notificationData.recipient) {
        // Send to specific user
        io.to(notificationData.recipient.toString()).emit('new_notification', notification);
        console.log(`📧 Notification sent to user: ${notificationData.recipient}`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user can access this notification
    if (!notification.isGlobal && notification.recipient?.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if already marked as read
    const alreadyRead = notification.readBy.some(read => 
      read.user && read.user.toString() === userId.toString()
    );

    if (!alreadyRead) {
      notification.readBy.push({
        user: userId,
        readAt: new Date()
      });
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE notification (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const notificationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
