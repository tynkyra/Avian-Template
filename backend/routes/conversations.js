import express from 'express';
import { db } from '../database/init.js';

const router = express.Router();

// Get all conversations for a user
router.get('/', (req, res) => {
  const userId = req.user.userId;
  const includeArchived = req.query.archived === 'true';

  console.log('GET /conversations - userId:', userId, 'includeArchived:', includeArchived);

  db.all(`
    SELECT DISTINCT c.id, c.type, c.name, c.display_photo, c.avatar_a, c.avatar_b, c.created_at,
           COUNT(m.id) as message_count,
           MAX(m.created_at) as last_message_time,
           COALESCE(cp.is_archived, 0) as isArchived,
           (SELECT COUNT(*) FROM messages m2 
            LEFT JOIN message_receipts mr ON m2.id = mr.message_id AND mr.user_id = ?
            WHERE m2.conversation_id = c.id AND m2.sender_id != ? AND mr.id IS NULL
           ) as unread_count
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE cp.user_id = ? AND COALESCE(cp.is_archived, 0) = ?
    GROUP BY c.id, c.type, c.name, c.display_photo, c.avatar_a, c.avatar_b, c.created_at, cp.is_archived
    ORDER BY last_message_time DESC
  `, [userId, userId, userId, includeArchived ? 1 : 0], (err, conversations) => {
    if (err) {
      console.error('Error fetching conversations:', err);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }
    
    console.log(`Found ${conversations.length} conversations (archived=${includeArchived}):`, conversations.map(c => ({ id: c.id, name: c.name, isArchived: c.isArchived })));

    // Get participants and messages for each conversation
    const conversationPromises = conversations.map(conv => {
      return new Promise((resolve) => {
        // Get participants
        db.all(`
          SELECT u.id, u.first_name as firstName, u.last_name as lastName, 
                 u.email, u.avatar, u.last_seen as lastSeen, cp.is_admin as isAdmin
          FROM conversation_participants cp
          JOIN users u ON cp.user_id = u.id
          WHERE cp.conversation_id = ?
        `, [conv.id], (err, participants) => {
          if (err) participants = [];

          // Get recent messages
          db.all(`
            SELECT m.id, m.type, m.content, m.reply_to as replyTo, m.state, m.avatar_url as avatarUrl, m.created_at as date,
                   u.id as sender_id, u.first_name as sender_firstName, u.last_name as sender_lastName,
                   u.email as sender_email, u.avatar as sender_avatar, u.last_seen as sender_lastSeen
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at DESC
            LIMIT 50
          `, [conv.id], (err, messages) => {
            if (err) messages = [];

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
                avatar: msg.avatarUrl || msg.sender_avatar,
                lastSeen: msg.sender_lastSeen
              }
            })).reverse();

            resolve({
              id: conv.id,
              type: conv.type,
              name: conv.name,
              displayPhoto: conv.display_photo,
              avatarA: conv.avatar_a,
              avatarB: conv.avatar_b,
              contacts: participants,
              messages: formattedMessages,
              unread: conv.unread_count,
              draftMessage: ''
            });
          });
        });
      });
    });

    Promise.all(conversationPromises).then(results => {
      res.json(results);
    });
  });
});

// Create a new conversation
router.post('/', (req, res) => {
  const { type, name, participantIds, title, displayPhoto, avatarA, avatarB } = req.body;
  const userId = req.user.userId;

  console.log('Creating conversation - displayPhoto:', displayPhoto);
  console.log('Creating conversation - avatarA:', avatarA);
  console.log('Creating conversation - avatarB:', avatarB);

  // For self-chat conversations, we don't need participants
  if (type === 'self_chat') {
    // First get the user data
    db.get(
      'SELECT id, first_name, last_name, email, avatar FROM users WHERE id = ?',
      [userId],
      (err, userData) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch user data' });
        }

        if (!userData) {
          return res.status(404).json({ error: 'User not found' });
        }

        console.log('Saving conversation with displayPhoto:', displayPhoto || null);

        db.run(
          'INSERT INTO conversations (type, name, created_by, display_photo, avatar_a, avatar_b) VALUES (?, ?, ?, ?, ?, ?)',
          [type, title || name, userId, displayPhoto || null, avatarA || null, avatarB || null],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create conversation' });
            }

            const conversationId = this.lastID;

            // Add creator as the only participant
            db.run(
              'INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES (?, ?, ?)',
              [conversationId, userId, true],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to add participant' });
                }

                // Return the created conversation with the structure expected by frontend
                res.status(201).json({
                  id: conversationId,
                  type: type,
                  name: title || name,
                  displayPhoto: displayPhoto || null,
                  avatarA: avatarA || null,
                  avatarB: avatarB || null,
                  contacts: [{
                    id: userId,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    email: userData.email,
                    avatar: userData.avatar,
                    isAdmin: true
                  }],
                  messages: [],
                  unread: 0,
                  draftMessage: ''
                });
              }
            );
          }
        );
      }
    );
    return;
  }

  // Original logic for regular conversations
  if (!participantIds || participantIds.length === 0) {
    return res.status(400).json({ error: 'Participants are required' });
  }

  db.run(
    'INSERT INTO conversations (type, name, created_by) VALUES (?, ?, ?)',
    [type || 'private', name, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      const conversationId = this.lastID;

      // Add creator as admin
      db.run(
        'INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES (?, ?, ?)',
        [conversationId, userId, true]
      );

      // Add other participants
      participantIds.forEach(participantId => {
        if (participantId !== userId) {
          db.run(
            'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
            [conversationId, participantId]
          );
        }
      });

      res.status(201).json({ id: conversationId, message: 'Conversation created' });
    }
  );
});

// Update conversation details
router.patch('/:conversationId', (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.userId;
  const { name, displayPhoto, avatarA, avatarB } = req.body;

  console.log('PATCH /conversations/:id - Updating conversation:', conversationId);
  console.log('Updates:', { name, displayPhoto, avatarA, avatarB });

  // Check if user is a participant
  db.get(
    'SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, userId],
    (err, participant) => {
      if (err) {
        console.error('Error checking participant:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!participant) {
        return res.status(403).json({ error: 'Not authorized to update this conversation' });
      }

      // Build update query dynamically based on provided fields
      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (displayPhoto !== undefined) {
        updates.push('display_photo = ?');
        params.push(displayPhoto);
      }
      if (avatarA !== undefined) {
        updates.push('avatar_a = ?');
        params.push(avatarA);
      }
      if (avatarB !== undefined) {
        updates.push('avatar_b = ?');
        params.push(avatarB);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // If avatars are being updated, get the old values first before updating
      if (avatarA !== undefined || avatarB !== undefined) {
        db.get(
          'SELECT avatar_a, avatar_b FROM conversations WHERE id = ?',
          [conversationId],
          (err, oldConversation) => {
            if (err) {
              console.error('Error fetching old conversation:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            const oldAvatarA = oldConversation?.avatar_a;
            const oldAvatarB = oldConversation?.avatar_b;

            console.log('Old avatars:', { oldAvatarA, oldAvatarB });
            console.log('New avatars:', { avatarA, avatarB });

            // Now update the conversation
            const updateParams = [...params, conversationId];
            const query = `UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`;
            
            db.run(query, updateParams, function(err) {
              if (err) {
                console.error('Error updating conversation:', err);
                return res.status(500).json({ error: 'Failed to update conversation' });
              }

              console.log('Conversation updated, now updating messages...');

              // Get all messages for this conversation to reassign avatars
              db.all(
                'SELECT id, avatar_url FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
                [conversationId],
                (err, messages) => {
                  if (err) {
                    console.error('Error fetching messages for avatar update:', err);
                    // Still return success
                    return sendUpdatedConversation();
                  }

                  console.log(`Found ${messages.length} messages to update`);
                  
                  // Group messages by their current avatar to maintain conversation flow
                  // Alternate between avatarA and avatarB based on message grouping
                  const messageUpdatePromises = [];
                  let currentAvatar = avatarA; // Start with avatarA
                  let lastAvatarUrl = null;

                  messages.forEach((msg, index) => {
                    // If avatar changed from previous message, switch to other avatar
                    if (lastAvatarUrl !== null && msg.avatar_url !== lastAvatarUrl) {
                      currentAvatar = currentAvatar === avatarA ? avatarB : avatarA;
                    }
                    lastAvatarUrl = msg.avatar_url;

                    // Update this message to use current avatar
                    if (msg.avatar_url !== currentAvatar) {
                      messageUpdatePromises.push(
                        new Promise((resolve, reject) => {
                          db.run(
                            'UPDATE messages SET avatar_url = ? WHERE id = ?',
                            [currentAvatar, msg.id],
                            function(err) {
                              if (err) {
                                console.error(`Error updating message ${msg.id}:`, err);
                                reject(err);
                              } else {
                                resolve();
                              }
                            }
                          );
                        })
                      );
                    }
                  });

                  console.log(`Updating ${messageUpdatePromises.length} messages`);

                  // Wait for all message updates to complete
                  Promise.all(messageUpdatePromises)
                    .then(() => {
                      console.log('All message updates completed');
                      sendUpdatedConversation();
                    })
                    .catch((err) => {
                      console.error('Error during message updates:', err);
                      sendUpdatedConversation();
                    });
                }
              );

              function sendUpdatedConversation() {
                // Fetch and return updated conversation
                db.get(
                  'SELECT id, type, name, display_photo, avatar_a, avatar_b, created_at FROM conversations WHERE id = ?',
                  [conversationId],
                  (err, conversation) => {
                    if (err) {
                      console.error('Error fetching updated conversation:', err);
                      return res.status(500).json({ error: 'Failed to fetch updated conversation' });
                    }

                    console.log('Conversation updated successfully:', conversation);

                    res.json({
                      id: conversation.id,
                      type: conversation.type,
                      name: conversation.name,
                      displayPhoto: conversation.display_photo,
                      avatarA: conversation.avatar_a,
                      avatarB: conversation.avatar_b,
                      createdAt: conversation.created_at
                    });
                  }
                );
              }
            });
          }
        );
      } else {
        // No avatar updates, just update the conversation normally
        const updateParams = [...params, conversationId];
        const query = `UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`;
        
        db.run(query, updateParams, function(err) {
          if (err) {
            console.error('Error updating conversation:', err);
            return res.status(500).json({ error: 'Failed to update conversation' });
          }

          // Fetch and return updated conversation
          db.get(
            'SELECT id, type, name, display_photo, avatar_a, avatar_b, created_at FROM conversations WHERE id = ?',
            [conversationId],
            (err, conversation) => {
              if (err) {
                console.error('Error fetching updated conversation:', err);
                return res.status(500).json({ error: 'Failed to fetch updated conversation' });
              }

              console.log('Conversation updated successfully:', conversation);

              res.json({
                id: conversation.id,
                type: conversation.type,
                name: conversation.name,
                displayPhoto: conversation.display_photo,
                avatarA: conversation.avatar_a,
                avatarB: conversation.avatar_b,
                createdAt: conversation.created_at
              });
            }
          );
        });
      }
    }
  );
});

// Archive/Unarchive a conversation
router.patch('/:conversationId/archive', (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.userId;
  const { archived } = req.body;

  if (typeof archived !== 'boolean') {
    return res.status(400).json({ error: 'archived field must be a boolean' });
  }

  // Verify user is participant in conversation
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, userId],
    (err, participant) => {
      if (err || !participant) {
        return res.status(403).json({ error: 'Not authorized to modify this conversation' });
      }

      db.run(
        'UPDATE conversation_participants SET is_archived = ? WHERE conversation_id = ? AND user_id = ?',
        [archived ? 1 : 0, conversationId, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update conversation' });
          }
          res.json({ success: true, archived });
        }
      );
    }
  );
});

// Pin a message in a conversation
router.patch('/:conversationId/pin', (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.userId;
  const { messageId } = req.body;

  // Verify user is participant in conversation
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, userId],
    (err, participant) => {
      if (err || !participant) {
        return res.status(403).json({ error: 'Not authorized to modify this conversation' });
      }

      // Verify message exists in conversation
      if (messageId) {
        db.get(
          'SELECT id FROM messages WHERE id = ? AND conversation_id = ?',
          [messageId, conversationId],
          (err, message) => {
            if (err || !message) {
              return res.status(404).json({ error: 'Message not found in this conversation' });
            }

            db.run(
              'UPDATE conversations SET pinned_message_id = ? WHERE id = ?',
              [messageId, conversationId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to pin message' });
                }
                res.json({ success: true, pinnedMessageId: messageId });
              }
            );
          }
        );
      } else {
        // Unpin message (set to null)
        db.run(
          'UPDATE conversations SET pinned_message_id = NULL WHERE id = ?',
          [conversationId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to unpin message' });
            }
            res.json({ success: true, pinnedMessageId: null });
          }
        );
      }
    }
  );
});

// Delete a conversation
router.delete('/:conversationId', (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.userId;

  // Verify user is admin or creator of conversation
  db.get(
    'SELECT c.created_by, cp.is_admin FROM conversations c JOIN conversation_participants cp ON c.id = cp.conversation_id WHERE c.id = ? AND cp.user_id = ?',
    [conversationId, userId],
    (err, participant) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!participant) {
        return res.status(403).json({ error: 'Not authorized to delete this conversation' });
      }

      // For self_chat, allow deletion if user is the creator
      // For other types, require admin status
      db.get('SELECT type FROM conversations WHERE id = ?', [conversationId], (err, conv) => {
        if (err || !conv) {
          return res.status(404).json({ error: 'Conversation not found' });
        }

        const canDelete = conv.type === 'self_chat' || participant.is_admin || participant.created_by === userId;

        if (!canDelete) {
          return res.status(403).json({ error: 'Only admins can delete this conversation' });
        }

        // Delete messages first (cascade)
        db.run('DELETE FROM messages WHERE conversation_id = ?', [conversationId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete messages' });
          }

          // Delete participants
          db.run('DELETE FROM conversation_participants WHERE conversation_id = ?', [conversationId], (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to delete participants' });
            }

            // Delete conversation
            db.run('DELETE FROM conversations WHERE id = ?', [conversationId], (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to delete conversation' });
              }
              res.json({ success: true });
            });
          });
        });
      });
    }
  );
});

export default router;