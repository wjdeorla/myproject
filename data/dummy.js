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

const FEED_HANDLES = ['@vie.node', '@cjs.dksss', '@nari.step', '@studio.moka', '@jiyuna_scene'];

const FEED_VIEWS = [
  42800, 128400, 8640, 31600, 17400, 64200, 9800, 22100, 55300, 7600, 41200, 28700, 19300, 73400,
  156000, 24800, 46900, 91200, 33700, 18400, 27600, 52100, 14900, 36800, 80300,
];

const FEED_CLIPS = [
  { id: 'bad-ateez-2', title: 'BAD 2', artist: 'ATEEZ', file: 'bad-ateez-2.mp4', cover: 'bad.jpg' },
  { id: 'bad-ateez-1', title: 'BAD', artist: 'ATEEZ', file: 'bad-ateez-1.mp4', cover: 'bad.jpg' },
  { id: 'bad-ateez-3', title: 'BAD 3', artist: 'ATEEZ', file: 'bad-ateez-3.mp4', cover: 'bad.jpg' },
  { id: 'combi', title: 'Combi', artist: 'Joucyplug', file: 'combi-joucyplug.mp4', cover: 'combi.jpg' },
  { id: 'crash', title: 'CRASH', artist: 'ALLDAY PROJECT', file: 'crash-allday-project.mp4', cover: 'crash.jpg' },
  { id: 'drama', title: 'Drama', artist: 'aespa', file: 'drama-aespa.mp4', cover: 'drama.jpg' },
  { id: 'ggez-1', title: 'GGEZ', artist: 'Kaien Nuen, Sugar & M.Sasuke', file: 'ggez-1.mp4', cover: 'ggez.jpg' },
  { id: 'ggez-2', title: 'GGEZ 2', artist: 'Kaien Nuen, Sugar & M.Sasuke', file: 'ggez-2.mp4', cover: 'ggez.jpg' },
  { id: 'go-hard', title: 'GO HARD', artist: 'MEOVV', file: 'go-hard-meovv.mp4', cover: 'go-hard.jpg' },
  { id: 'kneel', title: 'Kneel to None', artist: 'Goryeo Yamato', file: 'kneel-to-none.mp4', cover: 'kneel-to-none.jpg' },
  { id: 'lemon-tang', title: 'Lemon Tang', artist: 'Hearts2Hearts', file: 'lemon-tang.mp4', cover: 'lemon-tang.jpg' },
  { id: 'lemonade', title: 'LEMONADE', artist: 'aespa', file: 'lemonade-aespa.mp4', cover: 'lemonade.jpg' },
  { id: 'neon', title: 'NEON', artist: 'A2O', file: 'neon-a2o.mp4', cover: 'neon.jpg' },
  { id: 'perfect-night', title: 'Perfect Night', artist: 'LE SSERAFIM', file: 'perfect-night.mp4', cover: 'perfect-night.jpg' },
  { id: 'pretty-girl', title: 'Pretty Girl', artist: 'RESCENE', file: 'pretty-girl.mp4', cover: 'pretty-girl.jpg' },
  { id: 'redred', title: 'REDRED', artist: 'CORTIS', file: 'redred-cortis.mp4', cover: 'redred.jpg' },
  { id: 'rude', title: 'RUDE!', artist: 'Hearts2Hearts', file: 'rude.mp4', cover: 'rude.jpg' },
  { id: 'supernova', title: 'Supernova', artist: 'aespa', file: 'supernova-aespa.mp4', cover: 'supernova.jpg' },
  { id: 'talk', title: 'TALK', artist: 'ALLDAY PROJECT', file: 'talk-allday-project.mp4', cover: 'talk.jpg' },
  { id: 'undead', title: 'UNDEAD', artist: 'SUNG HANBIN', file: 'undead.mp4', cover: 'undead.jpg' },
  { id: 'wda', title: 'WDA', artist: 'aespa', file: 'wda-aespa.mp4', cover: 'wda.jpg' },
  { id: 'where-you-at', title: 'WHERE YOU AT', artist: 'ALLDAY PROJECT', file: 'where-you-at.mp4', cover: 'where-you-at.jpg' },
  { id: 'love-options', title: '연애의 조건', artist: 'BESTie', file: 'love-options.mp4', cover: 'love-options.jpg' },
  { id: 'catch-catch-1', title: '캐치 캐치', artist: 'YENA', file: 'catch-catch-1.mp4', cover: 'catch-catch.jpg' },
  { id: 'catch-catch-2', title: '캐치 캐치 2', artist: 'YENA', file: 'catch-catch-2.mp4', cover: 'catch-catch.jpg' },
];

export const FEED_ITEMS = FEED_CLIPS.map((clip, index) => {
  const views = FEED_VIEWS[index];
  return {
    id: clip.id,
    handle: FEED_HANDLES[index % FEED_HANDLES.length],
    title: clip.title,
    caption: clip.artist,
    music: `${clip.title.replace(/ \d$/, '')} - ${clip.artist}`,
    following: index % 2 === 0,
    views,
    likes: Math.round(views * 0.072),
    comments: Math.round(views * 0.0045),
    saves: Math.round(views * 0.02),
    shares: Math.round(views * 0.0035),
    cover: `/media/covers/${clip.cover}`,
    source: `/media/videos/${clip.file}`,
  };
});

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
