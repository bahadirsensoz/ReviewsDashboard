import { HostawayReview } from "@/types/reviews";

export const hostawayMockReviews: HostawayReview[] = [
  {
    id: 7453,
    listingId: 101,
    listingName: "2B N1 A - 29 Shoreditch Heights",
    channel: "airbnb",
    type: "guest-to-host",
    status: "published",
    rating: 9.2,
    publicReview: "Loved the location and the loft feel. Some traffic noise in the evenings.",
    privateReview: "Provide a small welcome basket for future guests.",
    reviewCategory: [
      { category: "cleanliness", rating: 9 },
      { category: "communication", rating: 10 },
      { category: "check_in", rating: 9 },
      { category: "location", rating: 8 }
    ],
    submittedAt: "2024-08-21T22:45:14Z",
    guestName: "Shane Finkelstein",
    stayDate: "2024-08-15"
  },
  {
    id: 8124,
    listingId: 101,
    listingName: "2B N1 A - 29 Shoreditch Heights",
    channel: "booking.com",
    type: "guest-to-host",
    status: "published",
    rating: 8.4,
    publicReview: "Stylish apartment with amazing views, minor issue with the dishwasher.",
    privateReview: "Dishwasher error light was on when we arrived but reset itself.",
    reviewCategory: [
      { category: "cleanliness", rating: 8 },
      { category: "communication", rating: 9 },
      { category: "amenities", rating: 8 },
      { category: "value", rating: 8 }
    ],
    submittedAt: "2024-09-02T18:20:00Z",
    guestName: "Elena P.",
    stayDate: "2024-08-28"
  },
  {
    id: 9031,
    listingId: 101,
    listingName: "2B N1 A - 29 Shoreditch Heights",
    channel: "airbnb",
    type: "guest-to-host",
    status: "published",
    rating: 9.6,
    publicReview: "Fantastic host and lovely touches throughout the space.",
    privateReview: null,
    reviewCategory: [
      { category: "cleanliness", rating: 10 },
      { category: "communication", rating: 10 },
      { category: "respect_house_rules", rating: 10 },
      { category: "staff", rating: 9 }
    ],
    submittedAt: "2024-10-01T12:05:30Z",
    guestName: "David N.",
    stayDate: "2024-09-26"
  },
  {
    id: 9902,
    listingId: 101,
    listingName: "2B N1 A - 29 Shoreditch Heights",
    channel: "direct",
    type: "guest-to-host",
    status: "pending",
    rating: null,
    publicReview: null,
    privateReview: "Guest mentioned they will leave a review soon.",
    reviewCategory: [],
    submittedAt: "2024-10-03T09:12:00Z",
    guestName: "Pending Review",
    stayDate: "2024-10-01"
  },
  {
    id: 6501,
    listingId: 202,
    listingName: "Camden Warehouse Loft",
    channel: "airbnb",
    type: "guest-to-host",
    status: "published",
    rating: 7.8,
    publicReview: "Cool industrial vibe, but could be cleaner in the kitchen.",
    privateReview: "Please have housekeeping double-check the oven.",
    reviewCategory: [
      { category: "cleanliness", rating: 7 },
      { category: "communication", rating: 8 },
      { category: "location", rating: 9 },
      { category: "value", rating: 8 }
    ],
    submittedAt: "2024-07-18T15:22:10Z",
    guestName: "Marta Q.",
    stayDate: "2024-07-10"
  },
  {
    id: 6502,
    listingId: 202,
    listingName: "Camden Warehouse Loft",
    channel: "airbnb",
    type: "guest-to-host",
    status: "published",
    rating: 8.9,
    publicReview: "Great stay overall. Loved the welcome guide and local tips!",
    privateReview: null,
    reviewCategory: [
      { category: "cleanliness", rating: 9 },
      { category: "communication", rating: 9 },
      { category: "check_in", rating: 9 },
      { category: "value", rating: 8 }
    ],
    submittedAt: "2024-08-05T11:00:00Z",
    guestName: "Liam J.",
    stayDate: "2024-07-30"
  },
  {
    id: 7321,
    listingId: 303,
    listingName: "Soho Boutique Flat",
    channel: "airbnb",
    type: "guest-to-host",
    status: "published",
    rating: 9.8,
    publicReview: "This flat is gorgeous. Impeccably clean and amazing host.",
    privateReview: "Keep up the great work!",
    reviewCategory: [
      { category: "cleanliness", rating: 10 },
      { category: "communication", rating: 10 },
      { category: "location", rating: 10 },
      { category: "amenities", rating: 9 }
    ],
    submittedAt: "2024-09-12T20:45:00Z",
    guestName: "Sophia K.",
    stayDate: "2024-09-09"
  },
  {
    id: 7322,
    listingId: 303,
    listingName: "Soho Boutique Flat",
    channel: "vrbo",
    type: "guest-to-host",
    status: "published",
    rating: 8,
    publicReview: "Loved the decor but had trouble with hot water once.",
    privateReview: "Water boiler reset did the trick but took time.",
    reviewCategory: [
      { category: "cleanliness", rating: 8 },
      { category: "communication", rating: 8 },
      { category: "amenities", rating: 7 },
      { category: "value", rating: 8 }
    ],
    submittedAt: "2024-09-28T07:30:00Z",
    guestName: "Trevor B.",
    stayDate: "2024-09-20"
  },
  {
    id: 7323,
    listingId: 303,
    listingName: "Soho Boutique Flat",
    channel: "booking.com",
    type: "guest-to-host",
    status: "published",
    rating: 6.5,
    publicReview: "Great location but heating needed attention during our stay.",
    privateReview: "Please service the heater before winter guests arrive.",
    reviewCategory: [
      { category: "cleanliness", rating: 7 },
      { category: "communication", rating: 7 },
      { category: "amenities", rating: 6 },
      { category: "value", rating: 6 }
    ],
    submittedAt: "2024-10-15T10:00:00Z",
    guestName: "Isabella M.",
    stayDate: "2024-10-10"
  }
];


