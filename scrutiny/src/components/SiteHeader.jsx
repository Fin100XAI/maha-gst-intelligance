import React from 'react';
import Icon from './Icon.jsx';

export const PUBLIC_PAGES = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'guide', label: 'Guide' },
  { id: 'howto', label: 'How to' },
  { id: 'catalog', label: 'Rules' },
];

export function SiteHeader({ view, go }) {
  return (
    <header className="site-head no-print">
      <button className="logo-row" onClick={() => go('home')}><span className="logo-mark"><Icon name="wave" size={14} stroke={2.4} /></span>GST Intelligence</button>
      <nav className="site-nav" aria-label="Site">
        {PUBLIC_PAGES.map((p) => <button key={p.id} className={view === p.id ? 'on' : ''} onClick={() => go(p.id)}>{p.label}</button>)}
      </nav>
      <div style={{ marginLeft: 'auto' }}>
        {view !== 'login' && <button className="btn primary" onClick={() => go('login')}>Sign in</button>}
      </div>
    </header>
  );
}

export function SiteShell({ view, go, children }) {
  return (
    <div className="site">
      <SiteHeader view={view} go={go} />
      {children}
      <footer className="site-foot no-print">
        <span>GST Intelligence · POC</span>
        <span>Runs locally: taxpayer data never leaves this device</span>
        <span style={{ marginLeft: 'auto' }}>Verify law and notifications before issuing any notice</span>
      </footer>
    </div>
  );
}
