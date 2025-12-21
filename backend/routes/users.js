

import express from 'express';
import { db } from '../database/init.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Set up multer for avatar uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'avatars');
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('[MULTER] Avatar upload destination:', uploadDir);
        cb(null, uploadDir);
      } catch (err) {
        console.error('[MULTER] Error creating upload directory:', err);
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      try {
        const ext = path.extname(file.originalname);
        const filename = `user_${req.user.userId}_${Date.now()}${ext}`;
        console.log('[MULTER] Avatar upload filename:', filename);
        cb(null, filename);
      } catch (err) {
        console.error('[MULTER] Error generating filename:', err);
        cb(err);
      }
    }
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      console.error('[MULTER] File rejected, not an image:', file.mimetype);
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

const router = express.Router();

// Update current user profile with avatar upload support
router.put('/me', upload.single('avatar'), (req, res) => {
  const userId = req.user.userId;
  const { firstName, lastName } = req.body;
  console.log('PUT /users/me called');
  console.log('Request body:', req.body);
  if (req.file) {
    console.log('Avatar file received:', req.file.originalname, '->', req.file.path);
  } else {
    console.log('No avatar file uploaded');
  }
  let avatarPath = undefined;
  if (req.file) {
    // Save relative path for avatar
    avatarPath = `/avatars/${req.file.filename}`;
  }
  // Get current avatar if not uploading new one
  db.get('SELECT avatar FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      console.error('DB error fetching user:', err);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
    const avatarToSave = avatarPath || (row && row.avatar) || '';
    db.run(
      `UPDATE users SET first_name = ?, last_name = ?, avatar = ? WHERE id = ?`,
      [firstName, lastName, avatarToSave, userId],
      function (err) {
        if (err) {
          console.error('DB error updating user:', err);
          return res.status(500).json({ error: 'Failed to update user' });
        }
        // Return updated user
        db.get(`
          SELECT id, first_name as firstName, last_name as lastName, 
                 email, avatar, last_seen as lastSeen
          FROM users WHERE id = ?
        `, [userId], (err, user) => {
          if (err || !user) {
            console.error('DB error fetching updated user:', err);
            return res.status(500).json({ error: 'Failed to fetch updated user' });
          }
          console.log('Returning updated user:', user);
          res.json(user);
        });
      }
    );
  });
});

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