const express = require('express');
const { body, param, validationResult } = require('express-validator');
const db = require('../config/db');
const { authorizeRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all inventory items with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, status, search, low_stock } = req.query;
    
    let query = `
      SELECT i.*, s.name as supplier_name 
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND i.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND i.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (i.name ILIKE $${paramIndex} OR i.serial_number ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (low_stock === 'true') {
      query += ` AND i.stock_level <= i.reorder_point`;
    }
    
    query += ` ORDER BY i.updated_at DESC`;
    
    const result = await db.query(query, queryParams);
    
    res.json({
      count: result.rows.length,
      items: result.rows
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: true, message: 'Server error fetching inventory' });
  }
});

// Get inventory item by ID
router.get('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const result = await db.query(`
      SELECT i.*, s.name as supplier_name 
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Inventory item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: true, message: 'Server error fetching inventory item' });
  }
});

// Create new inventory item
router.post(
  '/',
  authorizeRole(['admin', 'manager']),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('stock_level').isInt({ min: 0 }).withMessage('Stock level must be a non-negative integer'),
    body('reorder_point').isInt({ min: 0 }).withMessage('Reorder point must be a non-negative integer'),
    body('status').isIn(['available', 'in_use', 'maintenance', 'retired']).withMessage('Invalid status')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      name, category, description, serial_number, location, 
      status, stock_level, reorder_point, supplier_id 
    } = req.body;
    
    try {
      // Check if serial number already exists (if provided)
      if (serial_number) {
        const serialCheck = await db.query('SELECT id FROM inventory WHERE serial_number = $1', [serial_number]);
        if (serialCheck.rows.length > 0) {
          return res.status(400).json({ error: true, message: 'Serial number already exists' });
        }
      }
      
      // Create inventory item
      const result = await db.query(
        `INSERT INTO inventory 
         (name, category, description, serial_number, location, status, stock_level, reorder_point, supplier_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [name, category, description, serial_number, location, status, stock_level, reorder_point, supplier_id]
      );
      
      // Create initial inventory transaction
      if (stock_level > 0) {
        await db.query(
          `INSERT INTO inventory_transactions
           (inventory_id, transaction_type, quantity, previous_stock, new_stock, user_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [result.rows[0].id, 'purchase', stock_level, 0, stock_level, req.user.id, 'Initial inventory']
        );
      }
      
      // Check if stock is below reorder point and create notification
      if (stock_level <= reorder_point) {
        await db.query(
          `INSERT INTO notifications
           (title, message, type)
           VALUES ($1, $2, $3)`,
          [
            'Low Stock Alert', 
            `${name} (${serial_number || 'No S/N'}) is below reorder point. Current stock: ${stock_level}`, 
            'low_stock'
          ]
        );
      }
      
      res.status(201).json({
        message: 'Inventory item created successfully',
        item: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating inventory item:', error);
      res.status(500).json({ error: true, message: 'Server error creating inventory item' });
    }
  }
);

// Update inventory item
router.put(
  '/:id',
  authorizeRole(['admin', 'manager']),
  [
    param('id').isInt(),
    body('name').notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('stock_level').isInt({ min: 0 }).withMessage('Stock level must be a non-negative integer'),
    body('reorder_point').isInt({ min: 0 }).withMessage('Reorder point must be a non-negative integer'),
    body('status').isIn(['available', 'in_use', 'maintenance', 'retired']).withMessage('Invalid status')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      name, category, description, serial_number, location, 
      status, stock_level, reorder_point, supplier_id 
    } = req.body;
    
    try {
      // Check if item exists
      const itemCheck = await db.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
      if (itemCheck.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Inventory item not found' });
      }
      
      const currentItem = itemCheck.rows[0];
      
      // Check if serial number already exists (if changed)
      if (serial_number && serial_number !== currentItem.serial_number) {
        const serialCheck = await db.query(
          'SELECT id FROM inventory WHERE serial_number = $1 AND id != $2', 
          [serial_number, req.params.id]
        );
        if (serialCheck.rows.length > 0) {
          return res.status(400).json({ error: true, message: 'Serial number already exists' });
        }
      }
      
      // Update inventory item
      const result = await db.query(
        `UPDATE inventory 
         SET name = $1, category = $2, description = $3, serial_number = $4, 
             location = $5, status = $6, stock_level = $7, reorder_point = $8, 
             supplier_id = $9, updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING *`,
        [
          name, category, description, serial_number, location, 
          status, stock_level, reorder_point, supplier_id, req.params.id
        ]
      );
      
      // Create inventory transaction if stock level changed
      if (stock_level !== currentItem.stock_level) {
        const transactionType = stock_level > currentItem.stock_level ? 'purchase' : 'adjustment';
        const quantity = Math.abs(stock_level - currentItem.stock_level);
        
        await db.query(
          `INSERT INTO inventory_transactions
           (inventory_id, transaction_type, quantity, previous_stock, new_stock, user_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            req.params.id, 
            transactionType, 
            quantity, 
            currentItem.stock_level, 
            stock_level, 
            req.user.id, 
            'Stock update via item edit'
          ]
        );
      }
      
      // Check if stock is now below reorder point and create notification
      if (stock_level <= reorder_point && currentItem.stock_level > reorder_point) {
        await db.query(
          `INSERT INTO notifications
           (title, message, type)
           VALUES ($1, $2, $3)`,
          [
            'Low Stock Alert', 
            `${name} (${serial_number || 'No S/N'}) is below reorder point. Current stock: ${stock_level}`, 
            'low_stock'
          ]
        );
      }
      
      res.json({
        message: 'Inventory item updated successfully',
        item: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      res.status(500).json({ error: true, message: 'Server error updating inventory item' });
    }
  }
);

// Delete inventory item
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
      // Check if item exists
      const itemCheck = await db.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
      if (itemCheck.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Inventory item not found' });
      }
      
      // Delete inventory item (cascade will handle related transactions)
      await db.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
      
      res.json({
        message: 'Inventory item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      res.status(500).json({ error: true, message: 'Server error deleting inventory item' });
    }
  }
);

// Get inventory transactions for an item
router.get(
  '/:id/transactions',
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const result = await db.query(`
        SELECT t.*, u.username as user_name
        FROM inventory_transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.inventory_id = $1
        ORDER BY t.transaction_date DESC
      `, [req.params.id]);
      
      res.json({
        count: result.rows.length,
        transactions: result.rows
      });
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
      res.status(500).json({ error: true, message: 'Server error fetching inventory transactions' });
    }
  }
);

// Add inventory transaction
router.post(
  '/:id/transactions',
  authorizeRole(['admin', 'manager', 'staff']),
  [
    param('id').isInt(),
    body('transaction_type').isIn(['purchase', 'sale', 'return', 'adjustment']).withMessage('Invalid transaction type'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { transaction_type, quantity, notes } = req.body;
    
    try {
      // Get current inventory item
      const itemResult = await db.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
      if (itemResult.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Inventory item not found' });
      }
      
      const item = itemResult.rows[0];
      let newStock = item.stock_level;
      
      // Calculate new stock level based on transaction type
      switch (transaction_type) {
        case 'purchase':
        case 'return':
          newStock += quantity;
          break;
        case 'sale':
          if (quantity > item.stock_level) {
            return res.status(400).json({ 
              error: true, 
              message: 'Insufficient stock for this transaction' 
            });
          }
          newStock -= quantity;
          break;
        case 'adjustment':
          // For adjustments, quantity can be positive or negative
          newStock = Math.max(0, item.stock_level + parseInt(quantity));
          break;
      }
      
      // Create transaction
      const transactionResult = await db.query(
        `INSERT INTO inventory_transactions
         (inventory_id, transaction_type, quantity, previous_stock, new_stock, user_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.params.id, transaction_type, Math.abs(quantity), item.stock_level, newStock, req.user.id, notes]
      );
      
      // Update inventory stock level
      await db.query(
        'UPDATE inventory SET stock_level = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStock, req.params.id]
      );
      
      // Check if stock is now below reorder point and create notification
      if (newStock <= item.reorder_point && item.stock_level > item.reorder_point) {
        await db.query(
          `INSERT INTO notifications
           (title, message, type)
           VALUES ($1, $2, $3)`,
          [
            'Low Stock Alert', 
            `${item.name} (${item.serial_number || 'No S/N'}) is below reorder point. Current stock: ${newStock}`, 
            'low_stock'
          ]
        );
      }
      
      res.status(201).json({
        message: 'Transaction recorded successfully',
        transaction: transactionResult.rows[0],
        new_stock_level: newStock
      });
    } catch (error) {
      console.error('Error creating inventory transaction:', error);
      res.status(500).json({ error: true, message: 'Server error creating inventory transaction' });
    }
  }
);

// Get inventory statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalItems = await db.query('SELECT COUNT(*) as count FROM inventory');
    const lowStockItems = await db.query('SELECT COUNT(*) as count FROM inventory WHERE stock_level <= reorder_point');
    const totalValue = await db.query(`
      SELECT COALESCE(SUM(stock_level), 0) as total_stock
      FROM inventory
    `);
    const byCategoryResult = await db.query(`
      SELECT category, COUNT(*) as count
      FROM inventory
      GROUP BY category
      ORDER BY count DESC
    `);
    
    res.json({
      total_items: parseInt(totalItems.rows[0].count),
      low_stock_count: parseInt(lowStockItems.rows[0].count),
      total_stock: parseInt(totalValue.rows[0].total_stock),
      by_category: byCategoryResult.rows
    });
  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    res.status(500).json({ error: true, message: 'Server error fetching inventory statistics' });
  }
});

module.exports = router;