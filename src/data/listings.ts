export interface PropertyMetadata {
  id: string;
  name: string;
  city: string;
  address: string;
  headline: string;
  description: string;
  heroImage: string;
  highlights: string[];
  amenities: string[];
  sleepingArrangements: string[];
}

export const propertyMetadata: Record<string, PropertyMetadata> = {
  '101': {
    id: '101',
    name: '2B N1 A - 29 Shoreditch Heights',
    city: 'London',
    address: '29 Shoreditch High St, London N1 6NG, UK',
    headline: 'Industrial luxury loft in the heart of Shoreditch',
    description:
      'Floor-to-ceiling windows, bespoke interiors, and curated art create a memorable stay for guests seeking a design-forward base in East London.',
    heroImage:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1600&q=80',
    highlights: ['Sleeps 4 guests', '2 bedrooms / 2 baths', 'Panoramic city views', 'Concierge services available'],
    amenities: ['Fast Wi-Fi', 'In-unit laundry', 'Espresso machine', 'Smart home lighting', 'Secure keypad access'],
    sleepingArrangements: ['Bedroom 1: King bed', 'Bedroom 2: Queen bed'],
  },
  '202': {
    id: '202',
    name: 'Camden Warehouse Loft',
    city: 'London',
    address: '71 Chalk Farm Rd, London NW1 8AN, UK',
    headline: 'Converted warehouse with bold interiors and private terrace',
    description:
      'A spacious loft that blends historic warehouse character with modern Scandinavian finishes. Steps from Camden Market and Regent\'s Canal.',
    heroImage:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
    highlights: ['Sleeps 6 guests', 'Open-plan living space', 'Private terrace', 'Dedicated workspace'],
    amenities: ['Equipped chef\'s kitchen', 'Sonos sound system', 'Rainfall showers', 'Smart TV', 'Underfloor heating'],
    sleepingArrangements: ['Bedroom 1: King bed', 'Bedroom 2: Queen bed', 'Lounge: Pull-out sofa'],
  },
  '303': {
    id: '303',
    name: 'Soho Boutique Flat',
    city: 'London',
    address: '16 Wardour St, London W1D 6QF, UK',
    headline: 'Boutique pied-a-terre with curated interiors and balcony',
    description:
      'Boutique-style residence with layered textures and bespoke furnishings. Ideal for couples and business travelers seeking a central stay.',
    heroImage:
      'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1600&q=80',
    highlights: ['Sleeps 2 guests', 'Private balcony', 'Designer furniture', '24/7 self check-in'],
    amenities: ['High-speed Wi-Fi', 'Nespresso bar', 'Heated floors', 'Premium linens', 'Weekly housekeeping'],
    sleepingArrangements: ['Bedroom: Queen bed'],
  },
};

