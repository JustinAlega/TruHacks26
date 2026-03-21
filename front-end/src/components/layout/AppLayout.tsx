import { useEffect, type ReactNode } from 'react';
import './AppLayout.css';

export function AppLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('theme-dark');
    return () => { document.documentElement.classList.remove('theme-dark'); };
  }, []);

  return (
    <div className="canvas-shell">
      <div className="canvas-shell__grid" aria-hidden />
      <div className="canvas-shell__vignette" aria-hidden />
      <div className="canvas-shell__content">{children}</div>
    </div>
  );
}
