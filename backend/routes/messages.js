import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../database/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/attachments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Send attachments
router.post('/attachments', upload.array('files', 10), (req, res) => {
  const { conversationId, caption, avatarUrl } = req.body;
  const senderId = req.user.userId;
  const files = req.files;

  console.log('[Attachments] Received:', { conversationId, caption, avatarUrl, filesCount: files?.length });

  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'At least one file is required' });
  }

  // Verify user is participant in conversation
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, senderId],
    (err, participant) => {
      if (err || !participant) {
        return res.status(403).json({ error: 'Not authorized to send message to this conversation' });
      }

      // Create message with attachments
      const content = caption && caption.trim() ? caption.trim() : null;
      const now = new Date().toISOString();
      console.log('[Attachments] Saving content:', content);
      db.run(
        'INSERT INTO messages (conversation_id, sender_id, type, content, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [conversationId, senderId, 'attachment', content, avatarUrl, now],
        function(err) {
          if (err) {
            console.error('[Backend] Insert error:', err);
            return res.status(500).json({ error: 'Failed to send message' });
          }

          const messageId = this.lastID;

          // Insert attachments
          const attachmentPromises = files.map((file) => {
            return new Promise((resolve, reject) => {
              const fileType = file.mimetype.startsWith('image/') ? 'image' :
                              file.mimetype.startsWith('video/') ? 'video' :
                              file.mimetype.startsWith('audio/') ? 'audio' : 'file';
              
              const fileUrl = `http://127.0.0.1:3003/uploads/attachments/${file.filename}`;
              const fileSizeKB = (file.size / 1024).toFixed(2);

              db.run(
                'INSERT INTO attachments (message_id, type, name, size, url) VALUES (?, ?, ?, ?, ?)',
                [messageId, fileType, file.originalname, fileSizeKB + ' KB', fileUrl],
                function(err) {
                  if (err) reject(err);
                  else resolve({ id: this.lastID, type: fileType, name: file.originalname, size: fileSizeKB + ' KB', url: fileUrl });
                }
              );
            });
          });

          Promise.all(attachmentPromises)
            .then((attachments) => {
              // Get the created message with sender info and attachments
              db.get(`
                SELECT m.id, m.type, m.content, m.reply_to as replyTo, m.state, m.avatar_url as avatarUrl, m.created_at as date,
                       u.id as sender_id, u.first_name as sender_firstName, u.last_name as sender_lastName,
                       u.email as sender_email, u.avatar as sender_avatar, u.last_seen as sender_lastSeen
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.id = ?
              `, [messageId], (err, message) => {
                if (err) {
                  return res.status(500).json({ error: 'Message sent but failed to retrieve' });
                }

                const formattedMessage = {
                  id: message.id,
                  type: message.type,
                  content: message.content || undefined,
                  date: message.date,
                  replyTo: message.replyTo,
                  state: message.state,
                  attachments: attachments,
                  sender: {
                    id: message.sender_id,
                    firstName: message.sender_firstName,
                    lastName: message.sender_lastName,
                    email: message.sender_email,
                    avatar: message.avatarUrl || message.sender_avatar,
                    lastSeen: message.sender_lastSeen
                  }
                };

                res.status(201).json(formattedMessage);
              });
            })
            .catch((err) => {
              console.error('[Backend] Attachment insert error:', err);
              res.status(500).json({ error: 'Failed to save attachments' });
            });
        }
      );
    }
  );
});

// Send recording
router.post('/recording', upload.single('recording'), (req, res) => {
  const { conversationId, duration, avatarUrl } = req.body;
  const senderId = req.user.userId;
  const file = req.file;

  console.log('[Recording] Received:', { conversationId, duration, avatarUrl, file: file?.filename });

  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  if (!file) {
    return res.status(400).json({ error: 'Recording file is required' });
  }

  if (!duration) {
    return res.status(400).json({ error: 'Duration is required' });
  }

  // Verify user is participant in conversation
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, senderId],
    (err, participant) => {
      if (err || !participant) {
        return res.status(403).json({ error: 'Not authorized to send message to this conversation' });
      }

      // Create recording object
      const fileUrl = `http://127.0.0.1:3003/uploads/attachments/${file.filename}`;
      const fileSizeKB = (file.size / 1024).toFixed(2);
      const recording = {
        id: Date.now(), // Temporary ID for recording object
        size: fileSizeKB + ' KB',
        src: fileUrl,
        duration: duration
      };

      const now = new Date().toISOString();
      
      // Create message with recording content
      db.run(
        'INSERT INTO messages (conversation_id, sender_id, type, content, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [conversationId, senderId, 'recording', JSON.stringify(recording), avatarUrl, now],
        function(err) {
          if (err) {
            console.error('[Backend] Insert error:', err);
            return res.status(500).json({ error: 'Failed to send recording' });
          }

          const messageId = this.lastID;

          // Get the created message with sender info
          db.get(`
            SELECT m.id, m.type, m.content, m.reply_to as replyTo, m.state, m.avatar_url as avatarUrl, m.created_at as date,
                   u.id as sender_id, u.first_name as sender_firstName, u.last_name as sender_lastName,
                   u.email as sender_email, u.avatar as sender_avatar, u.last_seen as sender_lastSeen
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
          `, [messageId], (err, message) => {
            if (err) {
              return res.status(500).json({ error: 'Recording sent but failed to retrieve' });
            }

            const formattedMessage = {
              id: message.id,
              type: message.type,
              content: JSON.parse(message.content),
              date: message.date,
              replyTo: message.replyTo,
              state: message.state,
              sender: {
                id: message.sender_id,
                firstName: message.sender_firstName,
                lastName: message.sender_lastName,
                email: message.sender_email,
                avatar: message.avatarUrl || message.sender_avatar,
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

// Send a message
router.post('/', (req, res) => {
  const { conversationId, content, type, replyTo, avatarUrl } = req.body;
  const senderId = req.user.userId;

  console.log('[Backend] Received message with avatarUrl:', avatarUrl);
  console.log('[Backend] Full request body:', req.body);

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

      console.log('[Backend] Inserting message with avatar_url:', avatarUrl);
      const now = new Date().toISOString();
      db.run(
        'INSERT INTO messages (conversation_id, sender_id, type, content, reply_to, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [conversationId, senderId, type || 'text', content, replyTo, avatarUrl, now],
        function(err) {
          if (err) {
            console.error('[Backend] Insert error:', err);
            return res.status(500).json({ error: 'Failed to send message' });
          }
          console.log('[Backend] Message inserted with ID:', this.lastID);

          // Get the created message with sender info
          db.get(`
            SELECT m.id, m.type, m.content, m.reply_to as replyTo, m.state, m.avatar_url as avatarUrl, m.created_at as date,
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
                avatar: message.avatarUrl || message.sender_avatar,
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

      console.log('[Backend GET] Fetching messages for conversation:', conversationId);
      
      // Get conversation's avatar_a and avatar_b for fallback
      db.get(
        'SELECT avatar_a, avatar_b FROM conversations WHERE id = ?',
        [conversationId],
        (convErr, conversation) => {
          if (convErr) {
            console.error('[Backend GET] Error fetching conversation:', convErr);
          }
          
          db.all(`
            SELECT m.id, m.type, m.content, m.reply_to as replyTo, m.state, m.avatar_url as avatarUrl, m.created_at as date,
                   u.id as sender_id, u.first_name as sender_firstName, u.last_name as sender_lastName,
                   u.email as sender_email, u.avatar as sender_avatar, u.last_seen as sender_lastSeen
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
          `, [conversationId, limit, offset], (err, messages) => {
            if (err) {
              console.error('[Backend GET] Error fetching messages:', err);
              return res.status(500).json({ error: 'Failed to fetch messages' });
            }

            console.log('[Backend GET] Raw messages from DB:', messages.map(m => ({ id: m.id, avatarUrl: m.avatarUrl, sender_avatar: m.sender_avatar })));
            console.log('[Backend GET] Conversation avatars:', { avatar_a: conversation?.avatar_a, avatar_b: conversation?.avatar_b });

            // Get attachments for all messages
            const messageIds = messages.map(m => m.id);
            if (messageIds.length === 0) {
              return res.json([]);
            }

            db.all(`
              SELECT id, message_id as messageId, type, name, size, url, thumbnail
              FROM attachments
              WHERE message_id IN (${messageIds.map(() => '?').join(',')})
            `, messageIds, (attachErr, attachments) => {
              if (attachErr) {
                console.error('[Backend GET] Error fetching attachments:', attachErr);
              }

              // Group attachments by message ID
              const attachmentsByMessage = {};
              if (attachments) {
                attachments.forEach(att => {
                  if (!attachmentsByMessage[att.messageId]) {
                    attachmentsByMessage[att.messageId] = [];
                  }
                  attachmentsByMessage[att.messageId].push({
                    id: att.id,
                    type: att.type,
                    name: att.name,
                    size: att.size,
                    url: att.url,
                    thumbnail: att.thumbnail
                  });
                });
              }

              const formattedMessages = messages.map(msg => ({
                id: msg.id,
                type: msg.type,
                content: msg.content,
                date: msg.date,
                replyTo: msg.replyTo,
                state: msg.state,
                attachments: attachmentsByMessage[msg.id] || undefined,
                sender: {
                  id: msg.sender_id,
                  firstName: msg.sender_firstName,
                  lastName: msg.sender_lastName,
                  email: msg.sender_email,
                  // Use avatar_url if available, otherwise fallback to sender_avatar, then conversation's avatar_a
                  avatar: msg.avatarUrl || msg.sender_avatar || conversation?.avatar_a || null,
                  lastSeen: msg.sender_lastSeen
                }
              })).reverse();

              // Get pinned messages for this conversation
              db.all(`
                SELECT pm.message_id
                FROM pinned_messages pm
                WHERE pm.conversation_id = ?
              `, [conversationId], (pinErr, pinnedRefs) => {
                if (pinErr) {
                  console.error('[Backend GET] Error fetching pinned message refs:', pinErr);
                }
                
                const pinnedMessageIds = pinnedRefs ? pinnedRefs.map(p => p.message_id) : [];
                
                res.json({
                  messages: formattedMessages,
                  pinnedMessageIds: pinnedMessageIds
                });
              });
            });
          });
        }
      );
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