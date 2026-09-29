// Embedded mode: this app running inside the Maha GST Intelligence shell.
// The shell owns identity and navigation, so the app shows no landing page,
// no sign-in and no sidebar of its own. Only a parent on the allowlist is
// trusted; a direct visit, or a frame on any other site, gets the normal sign-in.
const env = import.meta.env || {}; // undefined under node --test
const PARENTS = (env.VITE_EMBED_PARENTS || 'http://localhost:5174,http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);

export const embedRequested = typeof window !== 'undefined'
  && window.self !== window.top
  && new URLSearchParams(window.location.search).has('embed');

// A message counts only if it comes from our own parent window on an allowed origin.
// Served together with the platform (one address), the parent is simply our own origin.
export const fromTrustedParent = (event) => event.source === window.parent
  && (event.origin === window.location.origin || PARENTS.includes(event.origin));

// How long to wait for the shell to hand over the officer before falling back to sign-in.
export const HANDSHAKE_MS = 4000;

// The shell's typeface, loaded only when embedded (src/embed.css switches to it).
const SHELL_FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap';

// Take on the shell's look: src/embed.css keys every override off this attribute.
export const applyShellTheme = (on) => {
  const root = document.documentElement;
  if (!on) { delete root.dataset.embed; return; }
  root.dataset.embed = 'shell';
  if (!document.getElementById('shell-fonts')) {
    const link = Object.assign(document.createElement('link'), { id: 'shell-fonts', rel: 'stylesheet', href: SHELL_FONTS });
    document.head.appendChild(link);
  }
};
