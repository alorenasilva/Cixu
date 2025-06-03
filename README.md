# SituationSort - Multiplayer Turn-Based Positioning Game

A real-time multiplayer game where players create situations based on hidden numbers and collaboratively arrange them on a 0-100 scale to test their intuitive understanding of relative positioning.

## Features

- **Real-time Multiplayer**: WebSocket-powered live gameplay with instant updates
- **Game Lobby System**: Room codes for easy joining and player management
- **Theme-based Prompts**: Pre-defined themes or custom prompt creation
- **Turn-based Gameplay**: Each player gets a secret number (0-100) and creates a matching situation
- **Interactive Drag & Drop**: Position situation cards on a visual 0-100 scale
- **Collaborative Free Round**: All players can adjust positions together
- **Results & Scoring**: Compare team order vs actual order with accuracy metrics
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Wouter (routing)
- **Backend**: Express.js, TypeScript, WebSocket
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket for live multiplayer features
- **UI Components**: Shadcn/ui components with custom styling

## Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn package manager

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Using Replit (Recommended)
If running on Replit, the PostgreSQL database is automatically provisioned with these environment variables:
- `DATABASE_URL`
- `PGHOST`
- `PGUSER` 
- `PGPASSWORD`
- `PGDATABASE`
- `PGPORT`

#### Option B: Local PostgreSQL Setup
Create a local PostgreSQL database and set up the environment variables:

```bash
# Create .env file
DATABASE_URL=postgresql://username:password@localhost:5432/situationsort
PGHOST=localhost
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=situationsort
PGPORT=5432
```

### 3. Initialize Database Schema

```bash
# Push database schema
npm run db:push
```

This creates all necessary tables:
- `games` - Game sessions with room codes and status
- `players` - Player information and colors
- `prompts` - Theme prompts and custom prompts
- `rounds` - Game rounds with prompt assignments
- `situations` - Player-created situations with positions

### 4. Start the Application

```bash
# Development mode (includes hot reload)
npm run dev
```

The application will be available at `http://localhost:5000`

## Game Flow

### 1. Create or Join Game
- **Host**: Enter your name and click "Create Room" to get a 6-digit room code
- **Players**: Enter room code and your name to join an existing game

### 2. Game Setup (Host Only)
- Select a theme from predefined options:
  - Life Events
  - Historical Events  
  - Daily Activities
- Or create custom prompts by selecting "Custom Prompts" and entering one prompt per line
- Minimum 3 prompts required

### 3. Gameplay
1. **Start Game**: Host clicks "Start Game" when all players have joined
2. **Secret Numbers**: Each player receives a hidden number (0-100)
3. **Create Situation**: Write a situation that represents your number
4. **Position Situation**: Drag your situation card to position it on the 0-100 scale
5. **Turn Progression**: Each player takes turns positioning their situation
6. **Free Round**: Collaborative phase where all players can adjust positions
7. **Results**: See how team order compares to actual numerical order

### 4. Scoring
- **Accuracy Percentage**: Based on correct positions in sequence
- **Grade System**: A+ (90%+) to C (50%+)
- **Visual Comparison**: Side-by-side view of team vs actual order

## API Endpoints

### Game Management
- `POST /api/games` - Create new game
- `GET /api/games/:roomCode` - Get game state
- `POST /api/games/:roomCode/join` - Join game
- `PUT /api/games/:roomCode/setup` - Configure theme/prompts
- `POST /api/games/:roomCode/start` - Start game

### Gameplay
- `POST /api/games/:roomCode/situations` - Submit situation
- `PUT /api/situations/:id/position` - Update position
- `POST /api/games/:roomCode/free-round` - Start collaborative round
- `POST /api/games/:roomCode/results` - Show results
- `POST /api/games/:roomCode/next-round` - Start next round

### WebSocket Events

#### Client → Server
- `mouse:move` - Mouse position updates
- `drag:move` - Drag position updates  
- `click:event` - Click interactions
- `game:tick` - Game timer (host only)

#### Server → Clients
- `player:joined` - New player notification
- `game:started` - Game start notification
- `situation:created` - New situation added
- `situation:moved` - Position update
- `free_round:started` - Collaborative phase
- `results:ready` - Results available
- `next_round:started` - New round

## Database Schema

### Games Table
- `id` - Unique identifier
- `roomCode` - 6-digit join code
- `status` - Game state (LOBBY, IN_PROGRESS, FREE_ROUND, SHOW_RESULTS, COMPLETED)
- `hostId` - Host player ID
- `theme` - Selected theme
- `currentRoundId` - Active round

### Players Table
- `id` - Unique identifier
- `name` - Display name
- `color` - Assigned color hex code
- `isHost` - Host flag
- `gameId` - Associated game

### Other Tables
- `prompts` - Game prompts with usage tracking
- `rounds` - Round information and completion status
- `situations` - Player situations with positions and secret numbers

## Development Commands

```bash
# Start development server
npm run dev

# Database operations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio (if configured)

# Build for production
npm run build

# Type checking
npm run type-check
```

## Environment Variables

Required environment variables:

```bash
DATABASE_URL=postgresql://user:pass@host:port/db
PGHOST=localhost
PGUSER=username  
PGPASSWORD=password
PGDATABASE=database_name
PGPORT=5432
NODE_ENV=development
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly formatted
- Ensure PostgreSQL service is running
- Check firewall/network connectivity

### WebSocket Connection Problems
- Confirm server is running on correct port (5000)
- Check browser console for connection errors
- Verify WebSocket path `/ws` is accessible

### Game State Issues
- Clear browser localStorage and refresh
- Check server logs for API errors
- Verify database schema is up to date with `npm run db:push`

## Architecture Notes

- **Monorepo Structure**: Client and server code in same repository
- **Shared Types**: Common TypeScript types in `/shared` directory
- **Real-time Sync**: WebSocket events keep all players synchronized
- **Drag & Drop**: HTML5 drag API with custom positioning logic
- **State Management**: React Context for game state with reducer pattern

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.