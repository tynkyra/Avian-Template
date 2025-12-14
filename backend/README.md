# Avian Chat Backend

This is the backend API for the Avian Chat application, built with Node.js, Express, and SQLite.

## Features

- 🔐 User authentication (register/login)
- 💬 Real-time messaging with Socket.IO
- 👥 Contact management
- 🗨️ Conversation management
- 📊 SQLite database for data persistence
- 🔒 JWT-based authentication
- 📡 RESTful API endpoints

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key
   DB_PATH=./database.sqlite
   FRONTEND_URL=http://localhost:5174
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users/search` - Search users
- `POST /api/users/contacts` - Add contact
- `DELETE /api/users/contacts/:contactId` - Remove contact

### Conversations
- `GET /api/conversations` - Get user's conversations
- `POST /api/conversations` - Create new conversation

### Messages
- `GET /api/messages/:conversationId` - Get conversation messages
- `POST /api/messages` - Send message
- `POST /api/messages/:messageId/read` - Mark message as read
- `DELETE /api/messages/:messageId` - Delete message

### Health Check
- `GET /api/health` - Server health status

## Database Schema

The application uses SQLite with the following tables:

- **users** - User accounts
- **contacts** - User relationships
- **conversations** - Chat conversations
- **conversation_participants** - Conversation members
- **messages** - Chat messages
- **attachments** - Message attachments
- **message_receipts** - Read receipts

## Real-time Features

The backend uses Socket.IO for real-time features:

- Live messaging
- Typing indicators
- User presence
- Message delivery status

## Development

### Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run init-db` - Initialize database (if needed)

### Project Structure

```
backend/
├── database/
│   └── init.js          # Database initialization
├── middleware/
│   └── auth.js          # Authentication middleware
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── conversations.js # Conversation routes
│   ├── messages.js      # Message routes
│   └── users.js         # User routes
├── index.js             # Main server file
├── package.json
└── .env                 # Environment variables
```

## Testing the Backend

Visit `http://localhost:5174/test` in your frontend to access the backend testing interface.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | Required |
| `DB_PATH` | SQLite database path | `./database.sqlite` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5174` |

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- CORS configured for frontend domain
- Input validation on all endpoints

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper `FRONTEND_URL`
4. Consider using a production database
5. Set up reverse proxy (nginx)
6. Use process manager (PM2)

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the `PORT` in `.env`
2. **Database errors**: Delete `database.sqlite` to reset
3. **CORS errors**: Check `FRONTEND_URL` in `.env`
4. **Authentication fails**: Verify `JWT_SECRET` is set

### Logs

The server logs important events:
- Database connection status
- Server startup information
- Socket connections
- API request errors