import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/users/change-password
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old and new password are required' });
  }
  db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, row) => {
    if (err || !row) {
      return res.status(500).json({ error: 'User not found' });
    }
    const isValid = await bcrypt.compare(oldPassword, row.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }
    const hashedNew = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNew, userId], (err2) => {
      if (err2) {
        return res.status(500).json({ error: 'Failed to update password' });
      }
      res.json({ success: true });
    });
  });
});

export default router;
