/**
 * VideoPlayer.tsx
 *
 * The product video, as a poster that becomes YouTube's player when pressed.
 * Nothing loads from YouTube until then, so the page stays fast and a visitor
 * who never plays it never contacts YouTube. Without JavaScript the poster is
 * a plain link to the video on YouTube.
 */

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { VIDEO, VIDEO_EMBED_URL, VIDEO_WATCH_URL, clock } from '../content/video';

export const VideoPlayer: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const poster = import.meta.env.BASE_URL + VIDEO.poster;

  if (playing) {
    return (
      <div className="video">
        <iframe
          src={`${VIDEO_EMBED_URL}?autoplay=1&rel=0&modestbranding=1`}
          title={VIDEO.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      className="video video--poster"
      href={VIDEO_WATCH_URL}
      onClick={(e) => {
        e.preventDefault();
        setPlaying(true);
      }}
      aria-label={`Play the video: ${VIDEO.title}, ${clock(VIDEO.seconds)}`}
    >
      <picture>
        <source srcSet={`${poster}.webp`} type="image/webp" />
        <img
          src={`${poster}.jpg`}
          alt=""
          width={VIDEO.posterWidth}
          height={VIDEO.posterHeight}
          loading="lazy"
          decoding="async"
        />
      </picture>
      <span className="video__play" aria-hidden="true">
        <Play size={30} fill="currentColor" strokeWidth={0} />
      </span>
      <span className="video__length" aria-hidden="true">
        {clock(VIDEO.seconds)}
      </span>
    </a>
  );
};
