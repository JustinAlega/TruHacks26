import { type ReactNode, useEffect, useRef } from 'react';
import type { WidgetSize } from '../../types';
import { removeDismissed } from '../../stores/widgetWindowStore';
import './FloatingWidgetWindow.css';

interface Props {
  title: string;
  size?: WidgetSize;
  animState?: 'spawning' | 'active' | 'dismissing';
  onClose: () => void;
  onMinimize: () => void;
  onFocus?: () => void;
  children: ReactNode;
}

export function FloatingWidgetWindow({
  title, size = 'standard', animState = 'active',
  onClose, onMinimize, onFocus, children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animState === 'dismissing') {
      const el = ref.current;
      if (!el) { removeDismissed(); return; }
      const handler = () => removeDismissed();
      el.addEventListener('animationend', handler, { once: true });
      return () => el.removeEventListener('animationend', handler);
    }
  }, [animState]);

  const cls = [
    'fw',
    `fw--${size}`,
    animState === 'spawning' && 'fw--spawn',
    animState === 'dismissing' && 'fw--dismiss',
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={cls} role="dialog" aria-label={title} onPointerDownCapture={onFocus}>
      <header className="fw__head fw__drag-handle">
        <span className="fw__title">{title}</span>
        <div className="fw__btns">
          <button type="button" className="fw__icon-btn" onClick={onMinimize} title="Minimize" aria-label="Minimize">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button type="button" className="fw__icon-btn" onClick={onClose} title="Close" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </header>
      <div className="fw__body">{children}</div>
    </div>
  );
}
