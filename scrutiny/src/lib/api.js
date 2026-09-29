// Every request this app makes to its own server goes under the address the app
// was built for: "/" stand-alone, "/scrutiny/" inside the Maha GST Intelligence
// platform. Then the app works however it is mounted -- behind a proxy that
// forwards /scrutiny/ to it, or from the one server that serves both.
const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/'; // import.meta.env is undefined under node --test

export const api = (path) => `${BASE.replace(/\/$/, '')}${path}`;
