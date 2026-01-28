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
// AUCTION STATE - HARD RESET TO DEFAULT
// ============================================
// NO FILE SYSTEM PERSISTENCE - ALWAYS STARTS FRESH
let auctionItems = [
  { id: 1, title: "Vintage Camera", currentBid: 100, highestBidder: null, auctionEndsAt: Date.now() + 900000, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32" },
  { id: 2, title: "Rare Painting", currentBid: 500, highestBidder: null, auctionEndsAt: Date.now() + 900000, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5" },
  { id: 3, title: "Antique Vase", currentBid: 250, highestBidder: null, auctionEndsAt: Date.now() + 900000, image: "https://images.unsplash.com/photo-1618220179428-22790b461013" },
  { id: 4, title: "Classic Car Model", currentBid: 1000, highestBidder: null, auctionEndsAt: Date.now() + 900000, image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f" }
];

// ============================================
// RACE CONDITION PROTECTION - MUTEX LOCK
// ============================================
/**
 * Boolean flag implementing a simple mutex lock to prevent race conditions.
 * Ensures only one bid transaction can be processed at a time across all clients.
 * This guarantees atomic bid validation and updates even under high concurrency.
 */
let isBidLocked = false;

/**
 * Handles bid placement with mutex-based race condition protection.
 * Ensures sequential processing of bids to prevent invalid state updates.
 * 
 * @param {number} itemId - The auction item ID
 * @param {number} newBid - The proposed bid amount
 * @param {string} bidderName - Name of the bidder
 * @returns {Promise<Object>} Result with success/error
 */
async function placeBid(itemId, newBid, bidderName) {
  // Spinlock: Wait for lock to be released if another bid is in progress
  while (isBidLocked) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Critical Section: Acquire lock to ensure atomic bid processing
  isBidLocked = true;

  try {
    const item = auctionItems.find(i => i.id === itemId);

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    /**
     * CRITICAL: Validation must occur inside the lock to prevent race conditions.
     * Without the lock, two simultaneous requests could both pass validation
     * before either updates the state, resulting in an invalid final bid.
     */
    if (newBid <= item.currentBid) {
      return {
        success: false,
        error: `Bid must be higher than current bid of $${item.currentBid}`
      };
    }

    // Atomic state update
    item.currentBid = newBid;
    item.highestBidder = bidderName;

    return {
      success: true,
      item: { ...item }
    };

  } finally {
    // Always release the lock, even on error
    isBidLocked = false;
  }
}

// ============================================
// HTTP ROUTES
// ============================================

app.get('/api/auctions', (req, res) => {
  res.json({ items: auctionItems });
});

app.get('/items', (req, res) => {
  res.json({ items: auctionItems });
});

app.post('/api/bid', async (req, res) => {
  const { itemId, amount, bidderName } = req.body;

  if (!itemId || !amount || !bidderName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await placeBid(itemId, amount, bidderName);

  if (result.success) {
    // Broadcast update to all connected Socket.io clients
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
  console.log(`[INFO] New client connected: ${socket.id}`);

  // Send initial auction state to newly connected client
  socket.emit('initialState', { items: auctionItems });

  socket.on('placeBid', async (data) => {
    const { itemId, amount, bidderName } = data;

    if (!itemId || !amount || !bidderName) {
      socket.emit('bidError', { error: 'Missing required fields' });
      return;
    }

    const result = await placeBid(itemId, amount, bidderName);

    if (result.success) {
      // Broadcast to all clients for real-time updates
      io.emit('bidUpdate', result.item);
      // Confirm success to the bidder
      socket.emit('bidSuccess', result.item);
    } else {
      socket.emit('bidError', { error: result.error, itemId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[INFO] Client disconnected: ${socket.id}`);
  });
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  // FORCE RESET: Ensure fresh auction data on every server start
  auctionItems = [
    { id: 1, title: "Vintage Camera", currentBid: 100, highestBidder: null, auctionEndsAt: Date.now() + 900000, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32" },
    { id: 2, title: "Rare Painting", currentBid: 500, highestBidder: null, auctionEndsAt: Date.now() + 900000, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5" },
    { id: 3, title: "Antique Vase", currentBid: 250, highestBidder: null, auctionEndsAt: Date.now() + 900000, image: "https://images.unsplash.com/photo-1618220179428-22790b461013" },
    { id: 4, title: "Classic Car Model", currentBid: 1000, highestBidder: null, auctionEndsAt: Date.now() + 900000, image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f" }
  ];
  console.log(`\n[RESET] Auction data HARD RESET to default state`);
  console.log(`[INFO] Live Bidding Platform Server Running`);
  console.log(`[INFO] Server: http://localhost:${PORT}`);
  console.log(`[INFO] Race Condition Protection: ENABLED (Mutex Lock)\n`);
});
