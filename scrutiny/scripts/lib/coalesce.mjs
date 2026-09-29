// Coalesce an expensive async job (e.g. rebuilding data.json) so bursts of requests share runs:
//   - no run in progress        -> start one now
//   - a run is in progress      -> wait for one follow-up run that starts after it (it will see this request's changes)
//   - a follow-up is already queued -> share that follow-up
// Every caller's promise settles only after a run that started after the caller asked, so no change is missed.
export function coalesce(job) {
  let running = null;
  let queued = null;
  // The job starts synchronously, so "a run is in progress" is true as soon as start() returns.
  const start = () => {
    running = (async () => { try { return await job(); } finally { running = null; } })();
    return running;
  };
  return function request() {
    if (queued) return queued;
    if (!running) return start();
    queued = running.catch(() => {}).then(() => { queued = null; return start(); });
    return queued;
  };
}
