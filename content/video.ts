/**
 * video.ts
 *
 * The product video on YouTube, recorded from the real extension in a real
 * Gmail with inbox content blurred. The page, the VideoObject and llms.txt
 * are all written from this one record, so the chapters can never disagree.
 *
 * The chapters match the ones in the YouTube description.
 */

export const VIDEO = {
  id: 'PtjGAnSIG5o',
  title: 'Gmail labels and searches as tabs: Chrome extension demo',
  description:
    'A 90 second demo of Gmail Labels and Search Queries as Tabs in a real Gmail inbox: labels and searches as tabs, pinning a search, tab colours, reordering, the one-minute tour, cleanup rules and privacy. Inbox content is blurred.',
  uploadDate: '2026-09-30',
  /** ISO 8601, and the seconds a person sees in the player. */
  duration: 'PT1M31S',
  seconds: 91,
  poster: 'video/demo-poster',
  posterWidth: 1280,
  posterHeight: 720,
  chapters: [
    { start: 0, title: 'Your labels and searches, as tabs' },
    { start: 4, title: 'One click opens the view' },
    { start: 20, title: 'Run any Gmail search, press +, and it stays as a tab' },
    { start: 38, title: 'Colour the views that matter, and drag tabs into your order' },
    { start: 56, title: 'The one-minute tour' },
    { start: 74, title: 'Cleanup rules in your own Google account, and privacy' },
  ],
} as const;

export const VIDEO_WATCH_URL = `https://www.youtube.com/watch?v=${VIDEO.id}`;
/** The privacy-enhanced player, which sets no cookie until the video plays. */
export const VIDEO_EMBED_URL = `https://www.youtube-nocookie.com/embed/${VIDEO.id}`;

export const watchAt = (seconds: number) => `${VIDEO_WATCH_URL}&t=${seconds}s`;

/** 0:04, 1:14 */
export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
