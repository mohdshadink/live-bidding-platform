import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

const ChromaGrid = ({ auctionItems, placeBid, bidAmounts, handleBidChange, bidderName, currentUser }) => {
    const gridRef = useRef(null);
    const cardsRef = useRef([]);
    const [flashingCards, setFlashingCards] = useState({});
    const previousBids = useRef({});

    // Green Flash Effect when currentBid changes
    useEffect(() => {
        auctionItems.forEach((item) => {
            const prevBid = previousBids.current[item.id];
            if (prevBid !== undefined && prevBid !== item.currentBid) {
                // Trigger flash
                setFlashingCards(prev => ({ ...prev, [item.id]: true }));
                setTimeout(() => {
                    setFlashingCards(prev => ({ ...prev, [item.id]: false }));
                }, 600);
            }
            previousBids.current[item.id] = item.currentBid;
        });
    }, [auctionItems]);

    useEffect(() => {
        const cards = cardsRef.current;

        // Mouse move handler for spotlight effect
        const handleMouseMove = (e, card) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Update spotlight position
            gsap.to(card, {
                '--mouse-x': `${x}px`,
                '--mouse-y': `${y}px`,
                duration: 0.3,
                ease: 'power2.out'
            });
        };

        const handleMouseEnter = (card) => {
            gsap.to(card, {
                '--spotlight-opacity': 1,
                duration: 0.4,
                ease: 'power2.out'
            });
        };

        const handleMouseLeave = (card) => {
            gsap.to(card, {
                '--spotlight-opacity': 0,
                duration: 0.4,
                ease: 'power2.out'
            });
        };

        // Attach event listeners
        cards.forEach((card) => {
            if (card) {
                const moveHandler = (e) => handleMouseMove(e, card);
                const enterHandler = () => handleMouseEnter(card);
                const leaveHandler = () => handleMouseLeave(card);

                card.addEventListener('mousemove', moveHandler);
                card.addEventListener('mouseenter', enterHandler);
                card.addEventListener('mouseleave', leaveHandler);

                // Store handlers for cleanup
                card._handlers = { moveHandler, enterHandler, leaveHandler };
            }
        });

        return () => {
            cards.forEach((card) => {
                if (card && card._handlers) {
                    card.removeEventListener('mousemove', card._handlers.moveHandler);
                    card.removeEventListener('mouseenter', card._handlers.enterHandler);
                    card.removeEventListener('mouseleave', card._handlers.leaveHandler);
                }
            });
        };
    }, [auctionItems]);

    return (
        <div
            ref={gridRef}
            className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
        >
            {auctionItems.map((item, index) => {
                const isWinning = item.highestBidder === currentUser;
                const isOutbid = item.userHasBid && !isWinning;
                const isFlashing = flashingCards[item.id];

                return (
                    <div
                        key={item.id}
                        ref={(el) => (cardsRef.current[index] = el)}
                        className={`chroma-card relative p-6 rounded-xl overflow-hidden ${isFlashing ? 'flash-green' : ''
                            }`}
                        style={{
                            '--mouse-x': '0px',
                            '--mouse-y': '0px',
                            '--spotlight-opacity': 0
                        }}
                    >
                        {/* Spotlight Effect Overlay */}
                        <div className="spotlight-overlay" />

                        {/* Card Content */}
                        <div className="relative z-10">
                            {/* Status Badges */}
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

                            {/* Auction Item Header */}
                            <div className="mb-4">
                                <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-gray-400 text-sm">Current Bid:</span>
                                    <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                                        ${item.currentBid}
                                    </span>
                                </div>
                                {item.highestBidder && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        Highest Bidder:{' '}
                                        <span className="text-violet-400 font-semibold">{item.highestBidder}</span>
                                    </p>
                                )}
                            </div>

                            {/* Bidding Form */}
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
                                    />
                                </div>

                                <button
                                    onClick={() => placeBid(item.id)}
                                    disabled={!bidderName.trim()}
                                    className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${bidderName.trim()
                                        ? 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 shadow-lg shadow-violet-500/50'
                                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                                        }`}
                                >
                                    Place Bid
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}

            <style jsx>{`
        .chroma-card {
          background: rgba(15, 15, 25, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .chroma-card:hover {
          transform: translateY(-4px);
          border-color: rgba(139, 92, 246, 0.3);
        }

        /* Green Flash Animation */
        .flash-green {
          animation: greenFlash 0.6s ease-out;
          border-color: rgba(34, 197, 94, 0.8) !important;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3);
        }

        @keyframes greenFlash {
          0% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3);
            border-color: rgba(34, 197, 94, 0.8);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.5);
            border-color: rgba(34, 197, 94, 1);
          }
          100% {
            box-shadow: 0 0 0 rgba(34, 197, 94, 0);
            border-color: rgba(255, 255, 255, 0.1);
          }
        }

        /* Badge Styles */
        .badge-winning {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #000;
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
          animation: pulse 2s infinite;
        }

        .badge-outbid {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .spotlight-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: var(--spotlight-opacity);
          background: radial-gradient(
            600px circle at var(--mouse-x) var(--mouse-y),
            rgba(139, 92, 246, 0.15),
            transparent 40%
          );
          transition: opacity 0.3s ease;
        }

        .chroma-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: var(--spotlight-opacity);
          background: radial-gradient(
            400px circle at var(--mouse-x) var(--mouse-y),
            rgba(6, 182, 212, 0.1),
            transparent 60%
          );
        }
      `}</style>
        </div>
    );
};

export default ChromaGrid;
