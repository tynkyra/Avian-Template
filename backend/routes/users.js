import express from 'express';
import { db } from '../database/init.js';

const router = express.Router();

// Get current user profile
router.get('/me', (req, res) => {
  const userId = req.user.userId;

  db.get(`
    SELECT id, first_name as firstName, last_name as lastName, 
           email, avatar, last_seen as lastSeen
    FROM users WHERE id = ?
  `, [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get contacts
    db.all(`
      SELECT u.id, u.first_name as firstName, u.last_name as lastName, 
             u.email, u.avatar, u.last_seen as lastSeen
      FROM contacts c
      JOIN users u ON c.contact_id = u.id
      WHERE c.user_id = ?
    `, [userId], (err, contacts) => {
      if (err) {
        contacts = [];
      }

      res.json({
        ...user,
        contacts: contacts || []
      });
    });
  });
});

// Search users
router.get('/search', (req, res) => {
  const { q } = req.query;
  const userId = req.user.userId;

  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  db.all(`
    SELECT id, first_name as firstName, last_name as lastName, 
           email, avatar, last_seen as lastSeen
    FROM users 
    WHERE id != ? AND (
      first_name LIKE ? OR 
      last_name LIKE ? OR 
      email LIKE ?
    )
    LIMIT 20
  `, [userId, `%${q}%`, `%${q}%`, `%${q}%`], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Search failed' });
    }

    res.json(users);
  });
});

// Add contact
router.post('/contacts', (req, res) => {
  const { contactId } = req.body;
  const userId = req.user.userId;

  if (!contactId) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  if (contactId === userId) {
    return res.status(400).json({ error: 'Cannot add yourself as contact' });
  }

  // Check if user exists
  db.get('SELECT id FROM users WHERE id = ?', [contactId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add contact (bidirectional)
    db.run(
      'INSERT OR IGNORE INTO contacts (user_id, contact_id) VALUES (?, ?)',
      [userId, contactId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to add contact' });
        }

        db.run(
          'INSERT OR IGNORE INTO contacts (user_id, contact_id) VALUES (?, ?)',
          [contactId, userId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to add contact' });
            }

            res.status(201).json({ success: true, message: 'Contact added' });
          }
        );
      }
    );
  });
});

// Remove contact
router.delete('/contacts/:contactId', (req, res) => {
  const contactId = req.params.contactId;
  const userId = req.user.userId;

  db.run(
    'DELETE FROM contacts WHERE (user_id = ? AND contact_id = ?) OR (user_id = ? AND contact_id = ?)',
    [userId, contactId, contactId, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to remove contact' });
      }

      res.json({ success: true, message: 'Contact removed' });
    }
  );
});

export default router;