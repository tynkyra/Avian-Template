import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/users/verify-password
router.post('/', authenticateToken, (req, res) => {
  // Debug: log token and user info
  console.log('[verify-password] req.headers.authorization:', req.headers['authorization']);
  console.log('[verify-password] req.user:', req.user);
  console.log('[verify-password] request body password:', req.body.password);
  const userId = req.user && req.user.userId;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  if (!userId) {
    return res.status(400).json({ error: 'User ID missing from token' });
  }
  db.get('SELECT password, email FROM users WHERE id = ?', [userId], async (err, row) => {
    if (err || !row) {
      console.log('[verify-password] DB error or user not found:', err, row);
      return res.status(500).json({ error: 'User not found' });
    }
    console.log('[verify-password] DB email:', row.email);
    console.log('[verify-password] DB hash:', row.password);
    const isValid = await bcrypt.compare(password, row.password);
    console.log('[verify-password] bcrypt.compare result:', isValid);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect password' });
    }
    res.json({ success: true });
  });
});

export default router;
