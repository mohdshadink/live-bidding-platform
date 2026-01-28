import { useRef, useEffect, useState } from 'react';
import './AuctionCard.css';

const AuctionCard = ({ item, index, placeBid, bidAmounts, handleBidChange, bidderName, currentUser, onCardRef, isFlashing }) => {
    // Initialize targetTime ONLY ONCE using useState lazy initialization
    const [targetTime] = useState(() => {
        return item.auctionEndsAt ? item.auctionEndsAt : (Date.now() + (15 * 60 * 1000));
    });
    const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());
    const cardRef = useRef(null);

    // Timer logic - updates every second
    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = targetTime - Date.now();
            setTimeLeft(newTimeLeft);
            if (newTimeLeft <= 0) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [targetTime]);

    // Format time display
    const formatTime = (ms) => {
        if (ms <= 0) return "CLOSED";
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms / 1000 / 60) % 60);
        const seconds = Math.floor((ms / 1000) % 60);
        return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    };

    const isWinning = item.highestBidder === currentUser;
    const isOutbid = item.userHasBid && !isWinning;
    const isClosed = timeLeft <= 0;

    // Store ref for parent component
    useEffect(() => {
        if (cardRef.current) {
            onCardRef(index, cardRef.current);
        }
    }, [index, onCardRef]);

    return (
        <div
            ref={cardRef}
            className={`chroma-card relative p-6 rounded-xl overflow-hidden ${isFlashing ? 'flash-green' : ''}`}
            style={{
                '--mouse-x': '0px',
                '--mouse-y': '0px',
                '--spotlight-opacity': 0
            }}
        >
            <div className="spotlight-overlay" />

            <div className="relative z-10">
                <div className="absolute top-0 right-0 flex gap-2">
                    {isWinning && (
                        <div className="badge-winning px-3 py-1 rounded-full text-xs font-bold">
                            WINNING 👑
                        </div>
                    )}
                    {isOutbid && (
                        <div className="badge-outbid px-3 py-1 rounded-full text-xs font-bold">
                            OUTBID ⚠️
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-gray-400 text-sm">Current Bid:</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                            ${item.currentBid}
                        </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Time Remaining:</span>
                        {isClosed ? (
                            <div className="badge-closed px-3 py-1 rounded-full text-xs font-bold">
                                CLOSED 🔒
                            </div>
                        ) : (
                            <span className="text-xl font-bold text-cyan-400 font-mono">
                                {formatTime(timeLeft)}
                            </span>
                        )}
                    </div>

                    {item.highestBidder && (
                        <p className="text-sm text-gray-400 mt-2">
                            Highest Bidder:{' '}
                            <span className="text-violet-400 font-semibold">{item.highestBidder}</span>
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Your Bid Amount
                        </label>
                        <input
                            type="number"
                            value={bidAmounts[item.id] || item.currentBid + 10}
                            onChange={(e) => handleBidChange(item.id, e.target.value)}
                            placeholder={`Minimum: $${item.currentBid + 1}`}
                            className="w-full"
                            min={item.currentBid + 1}
                            step="10"
                            disabled={isClosed}
                        />
                    </div>

                    <button
                        onClick={() => placeBid(item.id)}
                        disabled={!bidderName.trim() || isClosed}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${bidderName.trim() && !isClosed
                            ? 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 shadow-lg shadow-violet-500/50'
                            : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {isClosed ? 'Auction Closed' : 'Place Bid'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuctionCard;
