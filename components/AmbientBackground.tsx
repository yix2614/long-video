import React, { useEffect, useState } from 'react';

interface AmbientBackgroundProps {
  posterUrl?: string;
  videoUrl?: string;
  className?: string;
  opacity?: number;
}

const generatedPosterCache = new Map<string, string>();

const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ posterUrl, videoUrl, className = '', opacity = 0.40 }) => {
  const [resolvedPosterUrl, setResolvedPosterUrl] = useState(posterUrl || '');

  useEffect(() => {
    if (posterUrl) {
      setResolvedPosterUrl(posterUrl);
      return;
    }

    if (!videoUrl) {
      setResolvedPosterUrl('');
      return;
    }

    const cachedPoster = generatedPosterCache.get(videoUrl);
    if (cachedPoster) {
      setResolvedPosterUrl(cachedPoster);
      return;
    }

    let isCancelled = false;
    const video = document.createElement('video');

    const captureFrame = () => {
      if (isCancelled || !video.videoWidth || !video.videoHeight) {
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        if (!context) {
          return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        generatedPosterCache.set(videoUrl, dataUrl);

        if (!isCancelled) {
          setResolvedPosterUrl(dataUrl);
        }
      } catch {
        if (!isCancelled) {
          setResolvedPosterUrl('');
        }
      }
    };

    const handleLoadedMetadata = () => {
      const targetTime = video.duration && video.duration > 0.12 ? 0.12 : 0;

      if (targetTime === 0) {
        captureFrame();
        return;
      }

      video.currentTime = targetTime;
    };

    const handleSeeked = () => {
      captureFrame();
    };

    const handleError = () => {
      if (!isCancelled) {
        setResolvedPosterUrl('');
      }
    };

    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    video.src = videoUrl;
    video.load();

    return () => {
      isCancelled = true;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [posterUrl, videoUrl]);

  if (!resolvedPosterUrl) {
    return null;
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none -z-10">
        <img
            src={resolvedPosterUrl}
            alt=""
            className={`w-full h-full object-fill transition-opacity duration-500 ${className}`}
            style={{
                opacity: opacity,
                // Much stronger blur
                filter: 'blur(30px) saturate(135%) brightness(0.95) contrast(1.15)',
                // Scale is handled by parent container now to avoid clipping issues
                transform: 'scale(1.02)', // Slight scale to prevent edge bleeding
                backfaceVisibility: 'hidden',
            }}
        />
    </div>
  );
};

export default AmbientBackground;
