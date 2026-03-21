import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import './LandingPage.css';

export function LandingPage() {
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [sid, setSid] = useState('');
  const setCtx = useChatStore((s) => s.setStudentContext);
  const nav = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('theme-dark');
    return () => { document.documentElement.classList.remove('theme-dark'); };
  }, []);

  const ok = name.trim() && major.trim() && sid.trim();

  const submit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setCtx({ name: name.trim(), major: major.trim(), studentId: sid.trim() });
    nav('/chat');
  }, [name, major, sid, ok, setCtx, nav]);

  return (
    <div className="land theme-dark">
      <div className="land__wash" aria-hidden />
      <div className="land__grid" aria-hidden />
      <div className="land__inner">
        <div className="land__orb" aria-hidden />
        <h1 className="land__title">Aria</h1>
        <p className="land__subtitle">AI Academic &amp; Career Advisor</p>
        <p className="land__lede">
          Voice-first guidance for courses, grades, and careers.
          Enter your details to start — insight panels will appear as
          draggable holographic windows.
        </p>
        <form className="land__form" onSubmit={submit}>
          <label className="land__field">
            <span className="land__label">Full name</span>
            <input className="land__input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Smith" autoFocus />
          </label>
          <label className="land__field">
            <span className="land__label">Major</span>
            <input className="land__input" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Computer Science" />
          </label>
          <label className="land__field">
            <span className="land__label">Student ID</span>
            <input className="land__input" value={sid} onChange={(e) => setSid(e.target.value)} placeholder="STU-2024-0042" />
          </label>
          <button type="submit" className="land__cta" disabled={!ok}>
            Start session
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
