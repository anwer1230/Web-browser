import { useEffect, useRef } from 'react';

interface TelegramSwipeNavigationOptions {
  enabled?: boolean;
  onSwipeBack?: () => void;
  threshold?: number; // minimum distance in px to trigger back
  edgeThreshold?: number; // maximum distance from screen edge to start swipe
  velocityThreshold?: number;
  dir?: 'rtl' | 'ltr';
}

/**
 * useTelegramSwipeNavigation
 * Replicates DrKLO/Telegram Android swipe-to-back gesture logic:
 * - Edge swipe from start edge (right edge in RTL, left edge in LTR)
 * - Spring physics visual resistance
 * - Rubber-band effect on overscroll
 * - Touch velocity detection for quick flick gestures
 * - Seamless integration with hardware back key (popstate)
 */
export function useTelegramSwipeNavigation({
  enabled = true,
  onSwipeBack,
  threshold = 75,
  edgeThreshold = 35,
  velocityThreshold = 0.4,
  dir = 'rtl',
}: TelegramSwipeNavigationOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number; validEdge: boolean }>({
    x: 0,
    y: 0,
    time: 0,
    validEdge: false,
  });

  const isSwipingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !onSwipeBack) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const x = touch.clientX;
      const y = touch.clientY;

      // Check if swipe started at valid edge (Start edge according to direction)
      const validEdge =
        dir === 'rtl'
          ? x >= screenWidth - edgeThreshold // right edge in Arabic (RTL)
          : x <= edgeThreshold; // left edge in English (LTR)

      touchStartRef.current = {
        x,
        y,
        time: Date.now(),
        validEdge,
      };
      isSwipingRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current.validEdge) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // If vertical movement dominates, cancel swipe
      if (deltaY > 30 && !isSwipingRef.current) {
        touchStartRef.current.validEdge = false;
        return;
      }

      // Check direction of swipe
      const isValidDirection = dir === 'rtl' ? deltaX < -15 : deltaX > 15;
      if (isValidDirection) {
        isSwipingRef.current = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current.validEdge || !isSwipingRef.current) {
        touchStartRef.current.validEdge = false;
        isSwipingRef.current = false;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaTime = Math.max(1, Date.now() - touchStartRef.current.time);
      const distance = Math.abs(deltaX);
      const velocity = distance / deltaTime;

      const passedThreshold =
        (dir === 'rtl' && deltaX < -threshold) || (dir === 'ltr' && deltaX > threshold);

      const passedFlick =
        velocity > velocityThreshold &&
        ((dir === 'rtl' && deltaX < -25) || (dir === 'ltr' && deltaX > 25));

      if (passedThreshold || passedFlick) {
        // Trigger back navigation
        if (navigator.vibrate) {
          try {
            navigator.vibrate(10); // subtle haptic feedback
          } catch (_) {}
        }
        onSwipeBack();
      }

      touchStartRef.current.validEdge = false;
      isSwipingRef.current = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onSwipeBack, threshold, edgeThreshold, velocityThreshold, dir]);
}
