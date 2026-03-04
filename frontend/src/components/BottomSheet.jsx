import { useState, useEffect, useCallback } from 'react';

/**
 * Animated bottom sheet with backdrop.
 * Slides up on open, slides down on close with smooth transitions.
 */
export default function BottomSheet({
  open,
  onClose,
  children,
  zIndex = 1000,
  maxHeight = '70vh',
  padding = '8px 12px env(safe-area-inset-bottom, 12px)',
  background = '#0d1526',
  pointerEvents = true,
  duration = 300,
}) {
  // mounted = in DOM; show = animation target state
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Double-RAF: first frame renders at translateY(100%), second frame triggers transition
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setShow(false);
      const timer = setTimeout(() => setMounted(false), duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration]);

  // Lock body scroll while open
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mounted]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!mounted) return null;

  const transition = `transform ${duration}ms cubic-bezier(0.32, 0.72, 0, 1)`;
  const backdropTransition = `background ${duration}ms ease`;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex,
        background: show ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        transition: backdropTransition,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        pointerEvents: pointerEvents ? 'auto' : undefined,
      }}
      onClick={handleBackdropClick}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px 16px 0 0',
          maxHeight,
          overflowY: 'auto',
          padding,
          transform: show ? 'translateY(0)' : 'translateY(100%)',
          transition,
        }}
      >
        {children}
      </div>
    </div>
  );
}
