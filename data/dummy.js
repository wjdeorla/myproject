/**
 * SCENE HAUS prototype dummy data.
 *
 * Scale (not celebrity TikTok numbers):
 * - My shorts: local booth clips, hundreds to low 10Ks
 * - Feed: popular in-app posts, ~8K–130K views
 * - Challenges: reusable templates, ~30K–160K views
 *
 * Engagement is kept in a typical short-form band:
 * likes ~6–8% of views, comments ~0.4–0.6%, saves ~2%, shares ~0.3–0.5%.
 */

export function formatCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return '0';
  }
  if (n < 1000) {
    return String(Math.round(n));
  }
  if (n < 1_000_000) {
    const k = n / 1000;
    const text = k >= 100 ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, '');
    return `${text}K`;
  }
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export const PROFILE = {
  name: '지유나',
  handle: '@Jiyuna_scene',
  initial: 'J',
  publishedCount: 12,
  reservationCount: 5,
};

export const FEED_ITEMS = [
  {
    id: '1',
    handle: '@vie.node',
    title: 'Hype Boy 미러샷 튜토리얼',
    caption: '부스에서 완벽한 각도로 찍는 법',
    music: 'Hype Boy - NewJeans',
    following: true,
    views: 42800,
    likes: 3140,
    comments: 186,
    saves: 920,
    shares: 154,
    source: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: '2',
    handle: '@cjs.dksss',
    title: 'MOKA "It\'s Me" STUDIO',
    caption: '홍대점 모션 부스 원테이크',
    music: "It's Me - ILLIT",
    following: false,
    views: 128400,
    likes: 9620,
    comments: 512,
    saves: 2480,
    shares: 410,
    source: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: '3',
    handle: '@cjs.dksss',
    title: 'Miss you 거울춤',
    caption: '솔로 부스 슬로우 미러샷',
    music: 'Miss you - scenes',
    following: true,
    views: 8640,
    likes: 612,
    comments: 41,
    saves: 168,
    shares: 28,
    source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: '4',
    handle: '@nari.step',
    title: 'ATTENTION 그룹 챌린지',
    caption: '4인 그룹 부스 싱크 연습',
    music: 'ATTENTION - NewJeans',
    following: false,
    views: 31600,
    likes: 2210,
    comments: 148,
    saves: 740,
    shares: 96,
    source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: '5',
    handle: '@studio.moka',
    title: '레일캠 스핀 프리셋',
    caption: '모션 부스 천장 레일 첫 촬영',
    music: 'Magnetic - ILLIT',
    following: false,
    views: 17400,
    likes: 1280,
    comments: 73,
    saves: 390,
    shares: 54,
    source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
];

export const MY_SHORTS = [
  {
    id: 's1',
    title: 'Hype Boy 미러샷',
    views: 2410,
    likes: 168,
    image: 'https://images.unsplash.com/photo-1535525153412-5a090c909bd7?w=800&q=80',
  },
  {
    id: 's2',
    title: '솔로 부스 테스트',
    views: 860,
    likes: 54,
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
  },
  {
    id: 's3',
    title: '홍대점 원테이크',
    views: 12100,
    likes: 842,
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80',
  },
  {
    id: 's4',
    title: 'Slow 미러 워크',
    views: 430,
    likes: 29,
    image: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80',
  },
  {
    id: 's5',
    title: '그룹 부스 싱크',
    views: 1870,
    likes: 131,
    image: 'https://images.unsplash.com/photo-1520367745676-56196632e934?w=800&q=80',
  },
  {
    id: 's6',
    title: '레일캠 챌린지 컷',
    views: 6740,
    likes: 481,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  },
];

export const SAVED_CHALLENGES = [
  {
    id: 'c1',
    title: 'Hype Boy 미러샷',
    views: 84200,
    likes: 6180,
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80',
  },
  {
    id: 'c2',
    title: 'ATTENTION 4인 싱크',
    views: 31600,
    likes: 2290,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  },
  {
    id: 'c3',
    title: '레일캠 스핀 프리셋',
    views: 156000,
    likes: 11240,
    image: 'https://images.unsplash.com/photo-1535525153412-5a090c909bd7?w=800&q=80',
  },
];
