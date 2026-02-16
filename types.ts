
export enum ItemCategory {
  TOOLS = 'כלי עבודה',
  GARDENING = 'גינון',
  KITCHEN = 'מטבח',
  ELECTRONICS = 'אלקטרוניקה',
  CLEANING = 'ניקיון',
  CAMPING = 'קמפינג',
  OTHER = 'אחר'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  trustScore: number;
  memberSince: string;
  itemsCount: number;
  isPro: boolean;
  totalEarned: number;
  points: number;
  level: 'שכן חדש' | 'שכן פעיל' | 'גיבור השכונה' | 'אגדה מקומית';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Item {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  category: ItemCategory;
  pricePerDay: number;
  images: string[];
  isAvailable: boolean;
  insuranceCovered: boolean;
  isPromoted?: boolean;
  condition: 'כמו חדש' | 'במצב טוב' | 'משומש';
  faqs?: FAQ[];
}

export type TransactionStatus = 'pending' | 'active' | 'returned' | 'completed';

export interface Transaction {
  id: string;
  itemId: string;
  borrowerId: string;
  lenderId: string;
  status: TransactionStatus;
  startDate: string;
  endDate?: string;
  reviewFromBorrower?: Review;
  reviewFromLender?: Review;
}

export interface Review {
  rating: number;
  comment: string;
  createdAt: string;
}
