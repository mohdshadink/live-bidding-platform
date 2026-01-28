import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import AuctionCard from './AuctionCard';

const ChromaGrid = ({ auctionItems, placeBid, bidAmounts, handleBidChange, bidderName, currentUser }) => {
    const gridRef = useRef(null);
    const cardsRef = useRef([]);
    const [flashingCards, setFlashingCards] = useState({});
    const previousBids = useRef({});

    /**
     * Visual Feedback: Trigger green flash animation when bid amount updates.
     * Isolated to currentBid changes only - prevents timer updates from interfering.
     */
    useEffect(() => {
        const currentBidString = auctionItems.map(item => item.currentBid).join(',');

        auctionItems.forEach(item => {
            const prevBid = previousBids.current[item.id];
            const currentBid = item.currentBid;

            if (prevBid !== undefined && currentBid > prevBid) {
                setFlashingCards(prev => ({ ...prev, [item.id]: true }));

                setTimeout(() => {
                    setFlashingCards(prev => ({ ...prev, [item.id]: false }));
                }, 600);
            }

            previousBids.current[item.id] = currentBid;
        });
    }, [auctionItems.map(item => item.currentBid).join(',')]);

    /**
     * Spotlight Hover Effect: Dynamically tracks mouse position over each card
     * and creates a radial gradient spotlight that follows the cursor.
     */
    useEffect(() => {
        const cards = cardsRef.current;

        cards.forEach((card) => {
            if (!card) return;

            const moveHandler = (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            };

            const enterHandler = () => {
                gsap.to(card, {
                    '--spotlight-opacity': 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            };

            const leaveHandler = () => {
                gsap.to(card, {
                    '--spotlight-opacity': 0,
                    duration: 0.5,
                    ease: 'power2.in'
                });
            };

            card._handlers = { moveHandler, enterHandler, leaveHandler };

            card.addEventListener('mousemove', moveHandler);
            card.addEventListener('mouseenter', enterHandler);
            card.addEventListener('mouseleave', leaveHandler);
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

    const handleCardRef = (index, ref) => {
        cardsRef.current[index] = ref;
    };

    return (
        <div
            ref={gridRef}
            className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
        >
            {auctionItems.map((item, index) => (
                <AuctionCard
                    key={item.id}
                    item={item}
                    index={index}
                    placeBid={placeBid}
                    bidAmounts={bidAmounts}
                    handleBidChange={handleBidChange}
                    bidderName={bidderName}
                    currentUser={currentUser}
                    onCardRef={handleCardRef}
                    isFlashing={flashingCards[item.id]}
                />
            ))}
        </div>
    );
};

export default ChromaGrid;
