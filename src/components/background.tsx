import React, { useEffect, useRef, useState } from 'react';

type CarouselProps = {
  images: string[];
  autoplay?: boolean;
  intervalMs?: number;
  fadeMs?: number;
  pauseOnHover?: boolean;
};

const BackgroundCarousel: React.FC<CarouselProps> = ({
  images,
  autoplay = true,
  intervalMs = 6000,
  fadeMs = 900,
  pauseOnHover = true,
}) => {
  const safeImages = Array.isArray(images) ? images : [];
  const hasMultiple = safeImages.length > 1;

  const [baseIndex, setBaseIndex] = useState(0);
  const [overlayIndex, setOverlayIndex] = useState(hasMultiple ? 1 : 0);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const advance = () => {
    if (!hasMultiple) return;
    const next = (baseIndex + 1) % safeImages.length;
    setOverlayIndex(next);
    setOverlayVisible(true);
    window.setTimeout(() => {
      setBaseIndex(next);
      setOverlayVisible(false);
    }, fadeMs);
  };

  useEffect(() => {
    if (!autoplay || !hasMultiple || paused) return;
    timerRef.current = window.setInterval(() => {
      advance();
    }, intervalMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [autoplay, hasMultiple, paused, intervalMs, baseIndex]);

  const baseUrl = safeImages[baseIndex] ?? '';
  const overlayUrl = safeImages[overlayIndex] ?? baseUrl;

  return (
    <div
      className="w-full h-full border-none block relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Background image carousel"
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: baseUrl ? `url(${baseUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: overlayUrl ? `url(${overlayUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: overlayVisible ? 1 : 0,
          transition: `opacity ${fadeMs}ms ease-in-out`,
        }}
      />
    </div>
  );
};

export default BackgroundCarousel;
