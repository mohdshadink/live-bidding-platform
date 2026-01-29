/**
 * Auction Items Data Layer
 * 
 * Centralized initial state for auction items.
 * Separates data from server logic for better modularity.
 */

const getInitialAuctionItems = () => [
    {
        id: 1,
        title: "Vintage Camera",
        currentBid: 100,
        highestBidder: null,
        auctionEndsAt: Date.now() + 900000,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32"
    },
    {
        id: 2,
        title: "Rare Painting",
        currentBid: 500,
        highestBidder: null,
        auctionEndsAt: Date.now() + 900000,
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5"
    },
    {
        id: 3,
        title: "Antique Vase",
        currentBid: 250,
        highestBidder: null,
        auctionEndsAt: Date.now() + 900000,
        image: "https://images.unsplash.com/photo-1618220179428-22790b461013"
    },
    {
        id: 4,
        title: "Classic Car Model",
        currentBid: 1000,
        highestBidder: null,
        auctionEndsAt: Date.now() + 900000,
        image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f"
    }
];

module.exports = { getInitialAuctionItems };
