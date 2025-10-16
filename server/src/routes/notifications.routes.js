const express = require('express');
const { param, validationResult } = require('express-validator');
const db = require('../config/db');

const router = express.Router();

// Get all notifications for the current user
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM notifications
      WHERE user_id IS NULL OR user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user.id]);
    
    res.json({
      count: result.rows.length,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: true, message: 'Server error fetching notifications' });
  }
});

// Get unread notifications count
router.get('/unread', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count FROM notifications
      WHERE is_read = false AND (user_id IS NULL OR user_id = $1)
    `, [req.user.id]);
    
    res.json({
      unread_count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({ error: true, message: 'Server error fetching unread notifications count' });
  }
});

// Mark notification as read
router.put(
  '/:id/read',
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const result = await db.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Notification not found' });
      }
      
      res.json({
        message: 'Notification marked as read',
        notification: result.rows[0]
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: true, message: 'Server error marking notification as read' });
    }
  }
);

// Mark all notifications as read
router.put('/read/all', async (req, res) => {
  try {
    await db.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE is_read = false AND (user_id IS NULL OR user_id = $1)
    `, [req.user.id]);
    
    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: true, message: 'Server error marking all notifications as read' });
  }
});

// Delete a notification
router.delete(
  '/:id',
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const result = await db.query(
        'DELETE FROM notifications WHERE id = $1 RETURNING id',
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Notification not found' });
      }
      
      res.json({
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: true, message: 'Server error deleting notification' });
    }
  }
);

module.exports = router;