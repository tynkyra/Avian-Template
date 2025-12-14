import express from 'express';
import { db } from '../database/init.js';

const router = express.Router();

// Send a message
router.post('/', (req, res) => {
  const { conversationId, content, type, replyTo } = req.body;
  const senderId = req.user.userId;

  if (!conversationId || !content) {
    return res.status(400).json({ error: 'Conversation ID and content are required' });
  }

  // Verify user is participant in conversation
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, senderId],
    (err, participant) => {
      if (err || !participant) {
        return res.status(403).json({ error: 'Not authorized to send message to this conversation' });
      }

      db.run(
        'INSERT INTO messages (conversation_id, sender_id, type, content, reply_to) VALUES (?, ?, ?, ?, ?)',
        [conversationId, senderId, type || 'text', content, replyTo],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to send message' });
          }

          // Get the created message with sender info
          db.get(`
            SELECT m.id, m.type, m.content, m.reply_to as replyTo, m.state, m.created_at as date,
                   u.id as sender_id, u.first_name as sender_firstName, u.last_name as sender_lastName,
                   u.email as sender_email, u.avatar as sender_avatar, u.last_seen as sender_lastSeen
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
          `, [this.lastID], (err, message) => {
            if (err) {
              return res.status(500).json({ error: 'Message sent but failed to retrieve' });
            }

            const formattedMessage = {
              id: message.id,
              type: message.type,
              content: message.content,
              date: message.date,
              replyTo: message.replyTo,
              state: message.state,
              sender: {
                id: message.sender_id,
                firstName: message.sender_firstName,
                lastName: message.sender_lastName,
                email: message.sender_email,
                avatar: message.sender_avatar,
                lastSeen: message.sender_lastSeen
              }
            };

            res.status(201).json(formattedMessage);
          });
        }
      );
    }
  );
});

// Get messages for a conversation
router.get('/:conversationId', (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.userId;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  // Verify user is participant in conversation
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, userId],
    (err, participant) => {
      if (err || !participant) {
        return res.status(403).json({ error: 'Not authorized to view this conversation' });
      }

      db.all(`
        SELECT m.id, m.type, m.content, m.reply_to as replyTo, m.state, m.created_at as date,
               u.id as sender_id, u.first_name as sender_firstName, u.last_name as sender_lastName,
               u.email as sender_email, u.avatar as sender_avatar, u.last_seen as sender_lastSeen
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [conversationId, limit, offset], (err, messages) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch messages' });
        }

        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          date: msg.date,
          replyTo: msg.replyTo,
          state: msg.state,
          sender: {
            id: msg.sender_id,
            firstName: msg.sender_firstName,
            lastName: msg.sender_lastName,
            email: msg.sender_email,
            avatar: msg.sender_avatar,
            lastSeen: msg.sender_lastSeen
          }
        })).reverse();

        res.json(formattedMessages);
      });
    }
  );
});

// Mark message as read
router.post('/:messageId/read', (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.userId;

  db.run(
    'INSERT OR REPLACE INTO message_receipts (message_id, user_id) VALUES (?, ?)',
    [messageId, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to mark message as read' });
      }
      res.json({ success: true });
    }
  );
});

// Delete a message
router.delete('/:messageId', (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.userId;

  // Check if user owns the message
  db.get(
    'SELECT id FROM messages WHERE id = ? AND sender_id = ?',
    [messageId, userId],
    (err, message) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!message) {
        return res.status(403).json({ error: 'Not authorized to delete this message' });
      }

      db.run('DELETE FROM messages WHERE id = ?', [messageId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete message' });
        }
        res.json({ success: true });
      });
    }
  );
});

export default router;