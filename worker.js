// Serves the static site as-is.
// (The previous version of this worker rewrote link-preview meta tags for
// /careers?job=<slug> requests; the careers page was removed during the
// Automation Group rebrand, so that logic is gone. Restore similar logic
// here if a future page needs per-item dynamic OG tags.)
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
