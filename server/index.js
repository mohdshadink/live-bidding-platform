const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// ============================================
// AUCTION STATE (In-Memory)
// ============================================
let auctionItems = [
  { id: 1, name: 'Vintage Watch', currentBid: 100, highestBidder: null },
  { id: 2, name: 'Rare Painting', currentBid: 500, highestBidder: null },
  { id: 3, name: 'Antique Vase', currentBid: 250, highestBidder: null },
  { id: 4, name: 'Classic Car Model', currentBid: 1000, highestBidder: null }
];

// ============================================
// RACE CONDITION HANDLING - MUTEX LOCK
// ============================================
let isBidLocked = false;

/**
 * placeBid - Handles bid placement with race condition protection
 * Uses a boolean mutex lock to ensure sequential processing
 * 
 * @param {number} itemId - The auction item ID
 * @param {number} newBid - The proposed bid amount
 * @param {string} bidderName - Name of the bidder
 * @returns {Promise<Object>} Result with success/error
 */
async function placeBid(itemId, newBid, bidderName) {
  // Wait for lock to be released if another bid is in progress
  while (isBidLocked) {
    await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms and check again
  }

  // Acquire lock
  isBidLocked = true;

  try {
    // Find the auction item
    const item = auctionItems.find(i => i.id === itemId);
    
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // CRITICAL: Validate newBid > currentBid inside the lock
    if (newBid <= item.currentBid) {
      return { 
        success: false, 
        error: `Bid must be higher than current bid of $${item.currentBid}` 
      };
    }

    // Update the bid (this is the critical section)
    item.currentBid = newBid;
    item.highestBidder = bidderName;

    return { 
      success: true, 
      item: { ...item }
    };

  } finally {
    // Always release the lock
    isBidLocked = false;
  }
}

// ============================================
// HTTP ROUTES
// ============================================

// Get all auction items
app.get('/api/auctions', (req, res) => {
  res.json({ items: auctionItems });
});

// HTTP endpoint to place bid (alternative to Socket.io)
app.post('/api/bid', async (req, res) => {
  const { itemId, amount, bidderName } = req.body;

  if (!itemId || !amount || !bidderName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await placeBid(itemId, amount, bidderName);

  if (result.success) {
    // Broadcast to all connected clients
    io.emit('bidUpdate', result.item);
    return res.json(result);
  } else {
    return res.status(400).json(result);
  }
});

// ============================================
// SOCKET.IO HANDLERS
// ============================================

io.on('connection', (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  // Send initial auction state
  socket.emit('initialState', { items: auctionItems });

  // Handle bid placement via Socket.io
  socket.on('placeBid', async (data) => {
    const { itemId, amount, bidderName } = data;

    if (!itemId || !amount || !bidderName) {
      socket.emit('bidError', { error: 'Missing required fields' });
      return;
    }

    const result = await placeBid(itemId, amount, bidderName);

    if (result.success) {
      // Broadcast to ALL clients (including sender)
      io.emit('bidUpdate', result.item);
      socket.emit('bidSuccess', result.item);
    } else {
      // Send error only to the sender
      socket.emit('bidError', { error: result.error, itemId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`\n🚀 Live Bidding Platform Server Running`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔒 Race Condition Protection: ENABLED (Mutex Lock)\n`);
});
