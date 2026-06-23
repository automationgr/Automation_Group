/* ============================================================
   AUTOMATION GROUP — cms.js
   Minimal localStorage fallback store, used by messages.js to keep
   a contact-form submission on-device if Supabase is unreachable
   (the Admin Portal's own database, via cms-loader.js + the
   per-page *-cms.js files, is the real content/data pipeline).
   ============================================================ */
'use strict';

const AUTOMATION_CMS_KEY = 'automation_cms_v1';

const AUTOMATION_CMS = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(AUTOMATION_CMS_KEY) || '{"messages":[]}');
    } catch (e) { return { messages: [] }; }
  },
  save(data) { localStorage.setItem(AUTOMATION_CMS_KEY, JSON.stringify(data)); },
  getMessages() { return this.load().messages || []; },
  addMessage(msg) {
    const d = this.load();
    if (!d.messages) d.messages = [];
    d.messages.unshift({ ...msg, id: Date.now(), read: false, time: new Date().toLocaleString() });
    this.save(d);
    return true;
  }
};
