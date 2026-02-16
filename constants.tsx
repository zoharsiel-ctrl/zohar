
import { Item, User, ItemCategory } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'שרה לוי',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    trustScore: 98,
    memberSince: '2023-01-15',
    itemsCount: 12,
    isPro: true,
    totalEarned: 1450,
    // Added missing properties points and level
    points: 1250,
    level: 'גיבור השכונה',
    location: { lat: 32.0853, lng: 34.7818, address: 'רחוב דיזנגוף, תל אביב' }
  },
  {
    id: 'u2',
    name: 'דוד כהן',
    avatar: 'https://picsum.photos/seed/david/100/100',
    trustScore: 92,
    memberSince: '2023-05-20',
    itemsCount: 5,
    isPro: false,
    totalEarned: 320,
    // Added missing properties points and level
    points: 450,
    level: 'שכן פעיל',
    location: { lat: 32.0734, lng: 34.7904, address: 'שדרות רוטשילד, תל אביב' }
  }
];

export const MOCK_ITEMS: Item[] = [
  {
    id: 'i1',
    ownerId: 'u1',
    name: 'פטישון DeWalt',
    description: 'פטישון עוצמתי 18V עם 2 סוללות. מושלם לקידוח בקירות בטון.',
    category: ItemCategory.TOOLS,
    pricePerDay: 40,
    images: ['https://picsum.photos/seed/drill/400/300'],
    isAvailable: true,
    insuranceCovered: true,
    isPromoted: true,
    condition: 'כמו חדש',
    faqs: [
      { question: 'האם זה מגיע עם מקדחים?', answer: 'כן, סט בסיסי של 5 מקדחי בטון כלול.' },
      { question: 'כמה זמן הסוללה מחזיקה?', answer: 'כשעתיים של עבודה מאומצת, ויש שתי סוללות בקיט.' }
    ]
  },
  {
    id: 'i2',
    ownerId: 'u2',
    name: 'סולם אלומיניום 6 שלבים',
    description: 'סולם קל משקל ויציב, מגיע לגובה של כ-2.5 מטרים.',
    category: ItemCategory.TOOLS,
    pricePerDay: 0,
    images: ['https://picsum.photos/seed/ladder/400/300'],
    isAvailable: true,
    insuranceCovered: false,
    condition: 'במצב טוב',
    faqs: [
      { question: 'האם הוא נכנס לרכב פרטי?', answer: 'כן, הוא מתקפל לאורך של 1.2 מטר.' }
    ]
  },
  {
    id: 'i3',
    ownerId: 'u1',
    name: 'מכונת שטיפה בלחץ (גרניק)',
    description: 'מכונת שטיפה חשמלית 2000 PSI, מעולה לניקוי חצרות ורכבים.',
    category: ItemCategory.CLEANING,
    pricePerDay: 60,
    images: ['https://picsum.photos/seed/washer/400/300'],
    isAvailable: true,
    insuranceCovered: true,
    condition: 'במצב טוב',
    faqs: [
      { question: 'צריך חיבור מים קבוע?', answer: 'כן, דרוש צינור גינה סטנדרטי.' }
    ]
  },
  {
    id: 'i4',
    ownerId: 'u2',
    name: 'אוהל ל-4 אנשים',
    description: 'אוהל פתיחה מהירה עמיד למים, מושלם לטיולי קמפינג משפחתיים.',
    category: ItemCategory.CAMPING,
    pricePerDay: 35,
    images: ['https://picsum.photos/seed/tent/400/300'],
    isAvailable: false,
    insuranceCovered: true,
    condition: 'משומש',
    faqs: [
      { question: 'האם הוא באמת נפתח מהר?', answer: 'כן, פתיחה ב-60 שניות בדיוק.' }
    ]
  }
];
