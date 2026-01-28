import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import DotGrid from './components/DotGrid';
import ChromaGrid from './components/ChromaGrid';
import './index.css';

const SOCKET_URL = 'http://localhost:3001';

function App() {
  const [auctions, setAuctions] = useState([]);
  const [bidAmounts, setBidAmounts] = useState({});
  const [bidderName, setBidderName] = useState('');
  const [notification, setNotification] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.io server
    socketRef.current = io(SOCKET_URL);

    // Listen for initial state
    socketRef.current.on('initialState', (data) => {
      setAuctions(data.items);
      const initialBids = {};
      data.items.forEach(item => {
        initialBids[item.id] = item.currentBid + 10;
      });
      setBidAmounts(initialBids);
    });

    // Listen for bid updates
    socketRef.current.on('bidUpdate', (updatedItem) => {
      setAuctions(prev => prev.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      ));
      showNotification(`New bid on ${updatedItem.name}: $${updatedItem.currentBid}`, 'success');
    });

    // Listen for bid success
    socketRef.current.on('bidSuccess', (item) => {
      showNotification(`Your bid of $${item.currentBid} on ${item.name} was successful!`, 'success');
    });

    // Listen for bid errors
    socketRef.current.on('bidError', (data) => {
      showNotification(data.error, 'error');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBidChange = (itemId, value) => {
    setBidAmounts(prev => ({ ...prev, [itemId]: parseFloat(value) || 0 }));
  };

  const placeBid = (itemId) => {
    if (!bidderName.trim()) {
      showNotification('Please enter your name first!', 'error');
      return;
    }

    const amount = bidAmounts[itemId];
    const item = auctions.find(a => a.id === itemId);

    if (!amount || amount <= item.currentBid) {
      showNotification(`Bid must be higher than $${item.currentBid}`, 'error');
      return;
    }

    socketRef.current.emit('placeBid', {
      itemId,
      amount,
      bidderName: bidderName.trim()
    });
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Anti-Gravity Background */}
      <DotGrid
        dotSize={5}
        gap={15}
        baseColor="#3272ae"
        activeColor="#7300ff"
        proximity={120}
        shockRadius={250}
        shockStrength={5}
        resistance={750}
        returnDuration={1.5}
      />

      {/* Main Dashboard UI */}
      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full py-8 px-4">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Live Bidding Platform
            </h1>
            <p className="text-gray-300 text-lg">Real-time bidding with race condition protection</p>
          </header>

          {/* User Name Input */}
          <div className="max-w-md mx-auto mb-8">
            <div className="glass-dark p-6 rounded-xl">
              <label className="block text-sm font-medium mb-2 text-gray-300">Your Name</label>
              <input
                type="text"
                value={bidderName}
                onChange={(e) => setBidderName(e.target.value)}
                placeholder="Enter your name to start bidding"
                className="w-full glass px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all text-white"
              />
            </div>
          </div>

          {/* Auction Items Grid - ChromaGrid with Spotlight Effects */}
          <ChromaGrid
            auctionItems={auctions}
            placeBid={placeBid}
            bidAmounts={bidAmounts}
            handleBidChange={handleBidChange}
            bidderName={bidderName}
            currentUser={socketRef.current?.id}
          />

          {/* Instructions */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="glass-dark p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-3">🔒 Race Condition Protection</h3>
              <p className="text-gray-300 leading-relaxed">
                This platform uses a <span className="text-primary font-semibold">mutex lock mechanism</span> to prevent race conditions.
                When multiple users bid simultaneously, requests are processed sequentially. Only bids higher than the current bid are accepted.
                Try opening multiple browser tabs and bidding at the same time to see it in action!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`toast glass-dark px-6 py-4 rounded-lg shadow-xl ${notification.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
          }`}>
          <p className={`font-semibold ${notification.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
            {notification.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
