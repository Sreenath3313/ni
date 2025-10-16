const express = require('express');
const { body, param, validationResult } = require('express-validator');
const db = require('../config/db');
const { authorizeRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all suppliers with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM orders WHERE supplier_id = s.id AND status = 'pending') as pending_orders
      FROM suppliers s
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (s.name ILIKE $${paramIndex} OR s.contact_person ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY s.name ASC`;
    
    const result = await db.query(query, queryParams);
    
    res.json({
      count: result.rows.length,
      suppliers: result.rows
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: true, message: 'Server error fetching suppliers' });
  }
});

// Get supplier by ID
router.get('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const supplierResult = await db.query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM orders WHERE supplier_id = s.id AND status = 'pending') as pending_orders
      FROM suppliers s
      WHERE s.id = $1
    `, [req.params.id]);
    
    if (supplierResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Supplier not found' });
    }
    
    // Get inventory items from this supplier
    const inventoryResult = await db.query(`
      SELECT id, name, category, stock_level, reorder_point, status
      FROM inventory
      WHERE supplier_id = $1
      ORDER BY name ASC
    `, [req.params.id]);
    
    // Get orders for this supplier
    const ordersResult = await db.query(`
      SELECT o.*, u.username as created_by
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.supplier_id = $1
      ORDER BY o.created_at DESC
    `, [req.params.id]);
    
    const supplier = supplierResult.rows[0];
    supplier.inventory_items = inventoryResult.rows;
    supplier.orders = ordersResult.rows;
    
    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: true, message: 'Server error fetching supplier' });
  }
});

// Create new supplier
router.post(
  '/',
  authorizeRole(['admin', 'manager']),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('status').isIn(['active', 'inactive', 'pending']).withMessage('Invalid status')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, contact_person, email, phone, address, status } = req.body;
    
    try {
      const result = await db.query(
        `INSERT INTO suppliers 
         (name, contact_person, email, phone, address, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, contact_person, email, phone, address, status]
      );
      
      res.status(201).json({
        message: 'Supplier created successfully',
        supplier: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ error: true, message: 'Server error creating supplier' });
    }
  }
);

// Update supplier
router.put(
  '/:id',
  authorizeRole(['admin', 'manager']),
  [
    param('id').isInt(),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('status').isIn(['active', 'inactive', 'pending']).withMessage('Invalid status')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, contact_person, email, phone, address, status } = req.body;
    
    try {
      // Check if supplier exists
      const supplierCheck = await db.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
      if (supplierCheck.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Supplier not found' });
      }
      
      const result = await db.query(
        `UPDATE suppliers 
         SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, 
             status = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [name, contact_person, email, phone, address, status, req.params.id]
      );
      
      res.json({
        message: 'Supplier updated successfully',
        supplier: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ error: true, message: 'Server error updating supplier' });
    }
  }
);

// Delete supplier
router.delete(
  '/:id',
  authorizeRole(['admin']),
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      // Check if supplier exists
      const supplierCheck = await db.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
      if (supplierCheck.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Supplier not found' });
      }
      
      // Check if supplier has inventory items
      const inventoryCheck = await db.query('SELECT COUNT(*) FROM inventory WHERE supplier_id = $1', [req.params.id]);
      if (parseInt(inventoryCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          error: true, 
          message: 'Cannot delete supplier with associated inventory items. Update inventory items first.' 
        });
      }
      
      // Delete supplier (cascade will handle related orders)
      await db.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
      
      res.json({
        message: 'Supplier deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ error: true, message: 'Server error deleting supplier' });
    }
  }
);

// Create order for supplier
router.post(
  '/:id/orders',
  authorizeRole(['admin', 'manager']),
  [
    param('id').isInt(),
    body('expected_delivery_date').optional().isISO8601().withMessage('Valid date is required'),
    body('total_amount').optional().isNumeric().withMessage('Total amount must be a number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { expected_delivery_date, total_amount, notes } = req.body;
    
    try {
      // Check if supplier exists
      const supplierCheck = await db.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
      if (supplierCheck.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Supplier not found' });
      }
      
      const result = await db.query(
        `INSERT INTO orders 
         (supplier_id, expected_delivery_date, total_amount, user_id, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.params.id, expected_delivery_date, total_amount, req.user.id, notes]
      );
      
      // Create notification for new order
      await db.query(
        `INSERT INTO notifications
         (title, message, type)
         VALUES ($1, $2, $3)`,
        [
          'New Order Created', 
          `New order #${result.rows[0].id} created for ${supplierCheck.rows[0].name}`, 
          'order_update'
        ]
      );
      
      res.status(201).json({
        message: 'Order created successfully',
        order: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: true, message: 'Server error creating order' });
    }
  }
);

// Get all orders for a supplier
router.get('/:id/orders', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const result = await db.query(`
      SELECT o.*, u.username as created_by
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.supplier_id = $1
      ORDER BY o.created_at DESC
    `, [req.params.id]);
    
    res.json({
      count: result.rows.length,
      orders: result.rows
    });
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ error: true, message: 'Server error fetching supplier orders' });
  }
});

// Update order status
router.put(
  '/orders/:orderId',
  authorizeRole(['admin', 'manager']),
  [
    param('orderId').isInt(),
    body('status').isIn(['pending', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { status, notes } = req.body;
    
    try {
      // Check if order exists
      const orderCheck = await db.query(`
        SELECT o.*, s.name as supplier_name
        FROM orders o
        JOIN suppliers s ON o.supplier_id = s.id
        WHERE o.id = $1
      `, [req.params.orderId]);
      
      if (orderCheck.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Order not found' });
      }
      
      const order = orderCheck.rows[0];
      
      // Update order
      const result = await db.query(
        `UPDATE orders 
         SET status = $1, notes = CASE WHEN $2 IS NULL THEN notes ELSE $2 END, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [status, notes, req.params.orderId]
      );
      
      // Create notification for order status update
      await db.query(
        `INSERT INTO notifications
         (title, message, type)
         VALUES ($1, $2, $3)`,
        [
          'Order Status Updated', 
          `Order #${order.id} from ${order.supplier_name} is now ${status}`, 
          'order_update'
        ]
      );
      
      res.json({
        message: 'Order updated successfully',
        order: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: true, message: 'Server error updating order' });
    }
  }
);

module.exports = router;