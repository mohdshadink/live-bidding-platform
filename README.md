# Live Bidding Platform

A real-time auction platform built with React and Node.js, featuring live bid updates, race condition protection, and an immersive user interface.

## Description

The Live Bidding Platform is a full-stack web application that enables users to participate in live auctions with real-time bid synchronization across all connected clients. The platform implements robust concurrency control and provides visual feedback for bidding activities, ensuring a smooth and reliable auction experience.

## Tech Stack

### Frontend
- **React** - Component-based UI library
- **Socket.io Client** - Real-time WebSocket communication
- **GSAP** - High-performance animations
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next-generation frontend tooling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional event-based communication
- **CORS** - Cross-Origin Resource Sharing middleware

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Docker** - Containerization support

## Key Features

### Real-Time Synchronization
All bid updates are instantly broadcast to all connected clients via WebSocket connections, ensuring everyone sees the current auction state simultaneously.

### Race Condition Protection
The server implements a mutex lock mechanism to handle concurrent bid requests safely. This ensures that bids are processed sequentially, preventing race conditions when multiple users attempt to bid simultaneously.

### Concurrency Control
- **Server-Side Mutex**: Boolean lock (`isBidLocked`) prevents simultaneous bid processing
- **Validation**: Bid amounts are validated against current highest bid within the critical section
- **Atomic Updates**: State updates are atomic and immediately broadcast to all clients

### Immersive UI Experience
- **Dynamic Spotlight Effect**: Interactive radial gradient follows mouse movement over auction cards
- **Visual Feedback**: Green flash animation triggers on successful bids
- **Status Badges**: Real-time indicators show winning/outbid status
- **Timer Display**: Countdown timers for each auction with hours/minutes/seconds format
- **Auto-Disable**: Bid buttons automatically disable when auctions close

### Docker Support
Fully containerized application with multi-stage builds for both frontend and backend, optimized for production deployment.

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd live-bidding-platform
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the `client` directory:
   ```
   VITE_SERVER_URL=http://localhost:3001
   ```

4. **Start the development servers**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will concurrently start:
   - Frontend dev server on `http://localhost:5173`
   - Backend server on `http://localhost:3001`

### Production Deployment

#### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set the root directory to `client`
3. Vercel will automatically detect Vite and configure the build

#### Backend (Render)
1. Create a new Web Service on Render
2. Connect your repository
3. Set the root directory to `server`
4. Build command: `npm install`
5. Start command: `node index.js`

#### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Architecture

### State Management
- Client-side state managed with React hooks (`useState`, `useEffect`, `useRef`)
- Server-side state stored in-memory (resets on server restart)
- Automatic state synchronization via Socket.io events

### Communication Flow
1. Client connects via WebSocket
2. Server sends initial auction state
3. Client displays auction items with live timers
4. User places bid → Client emits bid event
5. Server validates and processes bid (mutex-protected)
6. Server broadcasts update to all clients
7. All clients receive and display updated bid

### Timer System
- **Server**: Provides `auctionEndsAt` timestamp
- **Client**: Calculates remaining time locally
- **Sync**: Timers stay synchronized across all clients
- **Optimization**: Automatic cleanup when timers reach zero

## Project Structure

```
live-bidding-platform/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── App.jsx         # Main application component
│   │   └── index.css       # Global styles
│   ├── .env                # Environment variables
│   └── package.json
├── server/                 # Backend Node.js server
│   ├── index.js            # Express & Socket.io server
│   ├── Dockerfile          # Backend container config
│   └── package.json
├── docker-compose.yml      # Multi-container orchestration
└── package.json            # Root workspace config
```

## License

This project is open source and available under the MIT License.
