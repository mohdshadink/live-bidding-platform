# Live Bidding Platform 🚀

A production-ready real-time bidding platform with strict race condition handling, built for a 48-hour take-home assignment.

## 🎯 Features

- **Real-time Bidding**: Instant updates using Socket.io
- **Race Condition Protection**: Mutex lock mechanism ensures data consistency
- **Interactive UI**: Anti-gravity dot animation background using GSAP
- **Validation**: Server-side bid validation (NewBid > CurrentBid)
- **Docker Ready**: Containerized backend for easy deployment

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express**: RESTful API and HTTP server
- **Socket.io**: WebSocket communication for real-time updates
- **In-Memory State**: Auction data management

### Frontend
- **React** (Vite): Fast development and optimized builds
- **Tailwind CSS**: Utility-first styling with glassmorphism effects
- **GSAP + InertiaPlugin**: Advanced physics-based animations
- **Socket.io-client**: Real-time server communication

## 🔒 Race Condition Solution

### The Problem
When multiple users bid simultaneously on the same item, concurrent requests can create race conditions:
```
User A reads currentBid = $100
User B reads currentBid = $100
User A bids $110 (valid)
User B bids $105 (should be invalid, but appears valid based on stale data)
```

### Our Solution: Mutex Lock

We implement a **boolean flag-based mutex** (`isBidLocked`) with an async/await pattern:

```javascript
let isBidLocked = false;

async function placeBid(itemId, newBid, bidderName) {
  // Wait for lock to be released
  while (isBidLocked) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Acquire lock
  isBidLocked = true;

  try {
    const item = auctionItems.find(i => i.id === itemId);
    
    // CRITICAL: This check happens inside the lock
    if (newBid <= item.currentBid) {
      return { success: false, error: 'Bid too low' };
    }

    // Update bid
    item.currentBid = newBid;
    item.highestBidder = bidderName;
    
    return { success: true, item };
  } finally {
    // Always release the lock
    isBidLocked = false;
  }
}
```

### How It Works

1. **Sequential Processing**: When request A arrives, it acquires the lock. Request B must wait.
2. **Read-Validate-Write**: All three operations happen atomically within the lock.
3. **Guaranteed Release**: The `finally` block ensures the lock is released even if errors occur.
4. **Polling Wait**: The `while` loop with 10ms intervals checks for lock availability.

### Testing Race Conditions

To verify the race condition handling:

```bash
# Terminal 1: Send concurrent requests using curl
curl -X POST http://localhost:3001/api/bid -H "Content-Type: application/json" -d '{"itemId":1,"amount":120,"bidderName":"Alice"}' &
curl -X POST http://localhost:3001/api/bid -H "Content-Type: application/json" -d '{"itemId":1,"amount":115,"bidderName":"Bob"}' &
```

**Expected Behavior**: Only the higher bid succeeds. The lower bid receives an error even if both were sent simultaneously.

### Trade-offs

✅ **Pros**:
- Simple to implement and understand
- Works well for single-instance deployments
- No external dependencies

❌ **Cons**:
- Not suitable for multi-server deployments
- Polling-based wait is not the most efficient

🔧 **Production Recommendation**: For horizontal scaling, use **Redis-based distributed locks** (Redlock algorithm) or a database with row-level locking (e.g., PostgreSQL `SELECT FOR UPDATE`).

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Backend Setup

```bash
cd server
npm install
npm start
```

Server will run on `http://localhost:3001`

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Client will run on `http://localhost:5173`

## 🐳 Docker Deployment

### Build and Run Backend Container

```bash
cd server
docker build -t bidding-platform-server .
docker run -p 3001:3001 bidding-platform-server
```

### Verify Container

```bash
docker ps
curl http://localhost:3001/api/auctions
```

## 🎮 Usage

1. Open the application in your browser
2. Enter your name in the input field
3. View the current auction items with their bids
4. Enter your bid amount (must be higher than current bid)
5. Click "Place Bid" to submit
6. Watch real-time updates as other users bid!

**Pro Tip**: Open multiple browser tabs/windows to simulate multiple users and test the real-time synchronization.

## 🧪 Testing

### Manual Testing
1. Open 3 browser tabs
2. Quickly submit bids from each tab
3. Verify only valid bids are accepted
4. Check console logs for race condition handling

### Automated Testing
```bash
# Run concurrent bid simulation
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/bid \
    -H "Content-Type: application/json" \
    -d "{\"itemId\":1,\"amount\":$((100 + i)),\"bidderName\":\"User$i\"}" &
done
wait
```

## 📁 Project Structure

```
Bidder/
├── server/
│   ├── index.js          # Express + Socket.io server with race condition logic
│   ├── package.json      # Backend dependencies
│   └── Dockerfile        # Docker configuration
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── DotGrid.jsx    # Anti-gravity animation component
│   │   ├── App.jsx            # Main bidding dashboard
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles + Tailwind
│   ├── tailwind.config.js     # Tailwind configuration
│   ├── postcss.config.js      # PostCSS configuration
│   └── package.json           # Frontend dependencies
└── README.md                  # This file
```

## 🎨 UI Features

- **Anti-Gravity Background**: Interactive dot grid that responds to mouse movement and clicks
- **Glassmorphism Cards**: Modern frosted-glass effect for auction items
- **Real-time Notifications**: Toast messages for bid updates and errors
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Smooth Animations**: GSAP-powered transitions and effects

## 🔧 Configuration

### Backend Environment Variables
```bash
PORT=3001  # Server port (default: 3001)
```

### Frontend Socket Configuration
Update `SOCKET_URL` in `client/src/App.jsx` if deploying to production:
```javascript
const SOCKET_URL = 'https://your-production-server.com';
```

## 🚀 Future Enhancements

- [ ] Persistent database (MongoDB/PostgreSQL)
- [ ] User authentication and session management
- [ ] Bid history and analytics
- [ ] Countdown timers for auctions
- [ ] Redis-based distributed locking for multi-server deployments
- [ ] Image uploads for auction items
- [ ] Payment integration

## 📝 License

MIT

## 👨‍💻 Developer Notes

This project was built as a 48-hour take-home assignment. The race condition handling demonstrates understanding of:
- Concurrency control mechanisms
- Async/await patterns in Node.js
- Critical section protection
- Real-time communication with WebSockets

**Key Design Decision**: Used in-memory state and boolean mutex for simplicity and demonstration purposes. A production system would use Redis or database-level locking for horizontal scalability.

---

**Built with ❤️ for the Live Bidding Platform Assignment**
