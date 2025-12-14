import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '..', 'database.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('📊 Connected to SQLite database');
  }
});

export const initDatabase = () => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Contacts table (relationship between users)
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (contact_id) REFERENCES users (id),
      UNIQUE(user_id, contact_id)
    )
  `);

  // Conversations table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'private',
      name TEXT,
      display_photo TEXT,
      created_by INTEGER NOT NULL,
      pinned_message_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id),
      FOREIGN KEY (pinned_message_id) REFERENCES messages (id)
    )
  `);

  // Add pinned_message_id column if it doesn't exist (migration)
  db.run(`
    ALTER TABLE conversations ADD COLUMN pinned_message_id INTEGER
  `, (err) => {
    // Ignore error if column already exists
  });

  // Add avatar_a and avatar_b columns for the two selectable avatars (migration)
  db.run(`
    ALTER TABLE conversations ADD COLUMN avatar_a TEXT
  `, (err) => {
    // Ignore error if column already exists
  });

  db.run(`
    ALTER TABLE conversations ADD COLUMN avatar_b TEXT
  `, (err) => {
    // Ignore error if column already exists
  });

  // Rename avatar to display_photo (migration)
  db.run(`
    ALTER TABLE conversations ADD COLUMN display_photo TEXT
  `, (err) => {
    if (!err) {
      // Copy data from avatar to display_photo
      db.run(`UPDATE conversations SET display_photo = avatar WHERE display_photo IS NULL`, (copyErr) => {
        if (!copyErr) {
          console.log('✅ Migrated avatar to display_photo');
        }
      });
    }
  });

  // Conversation participants
  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      is_archived BOOLEAN DEFAULT FALSE,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(conversation_id, user_id)
    )
  `);

  // Add is_archived column if it doesn't exist (migration)
  db.run(`
    ALTER TABLE conversation_participants ADD COLUMN is_archived BOOLEAN DEFAULT FALSE
  `, (err) => {
    // Ignore error if column already exists
    if (!err) {
      // Set all existing rows to is_archived = 0 (false)
      db.run(`UPDATE conversation_participants SET is_archived = 0 WHERE is_archived IS NULL`, (updateErr) => {
        if (updateErr) {
          console.log('Note: Could not update existing rows (might already be set):', updateErr.message);
        } else {
          console.log('✅ Set all existing conversations to is_archived = 0');
        }
      });
    }
  });

  // Update old avatar values ('A', 'B') to actual image URLs (migration)
  db.run(`
    UPDATE conversations 
    SET display_photo = 'https://gundam-official.com/media/2_FREEDOM_414b8262a7/2_FREEDOM_414b8262a7.png'
    WHERE (display_photo IN ('A', 'B') OR display_photo IS NULL OR display_photo LIKE '%wixmp%')
    AND avatar_a IS NULL
  `, (err) => {
    if (!err) {
      console.log('✅ Updated old display_photo values to default image');
    }
  });

  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      type TEXT DEFAULT 'text',
      content TEXT,
      reply_to INTEGER,
      state TEXT DEFAULT 'sent',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations (id),
      FOREIGN KEY (sender_id) REFERENCES users (id),
      FOREIGN KEY (reply_to) REFERENCES messages (id)
    )
  `);

  // Add avatar_url column if it doesn't exist (migration)
  db.run(`
    ALTER TABLE messages ADD COLUMN avatar_url TEXT
  `, (err) => {
    if (err) {
      // Column likely already exists
      console.log('Note: avatar_url column already exists or error:', err.message);
    } else {
      console.log('✅ Added avatar_url column to messages table');
    }
  });

  // Message attachments
  db.run(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      size INTEGER,
      url TEXT NOT NULL,
      thumbnail TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages (id)
    )
  `);

  // Message read receipts
  db.run(`
    CREATE TABLE IF NOT EXISTS message_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(message_id, user_id)
    )
  `);

  console.log('📋 Database tables initialized');
};