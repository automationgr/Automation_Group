/* ============================================================
   AUTOMATION GROUP — messages.js
   Server-side storage via Supabase + EmailJS notifications
   Falls back to localStorage when Supabase is not configured.
   ============================================================

   ┌─────────────────────────────────────────────────────────┐
   │  SETUP — read this once, then never touch it again      │
   │                                                         │
   │  1. Go to https://supabase.com — create a FREE account  │
   │  2. Create a new project (choose any region)            │
   │  3. In the project: SQL Editor → run:                   │
   │     create table contact_messages (                     │
   │       id bigint generated always as identity primary key,│
   │       name text, org text, email text, phone text,      │
   │       country text, service text, message text,         │
   │       subject text, read boolean default false,         │
   │       created_at timestamptz default now()               │
   │     );                                                   │
   │  4. Go to Settings → API                                │
   │  5. Copy "Project URL" → paste into SUPABASE_URL below  │
   │  6. Copy "anon / public" key → paste into SUPABASE_KEY  │
   │  7. Go to emailjs.com → create account → Email Service  │
   │     + Email Template (params: from_name, from_email,    │
   │     from_org, phone, country, service, message,         │
   │     sent_time) → paste the 3 EmailJS IDs below.          │
   │  8. Upload this file to your hosting. Done.             │
   └─────────────────────────────────────────────────────────┘ */

'use strict';

/* ── PASTE YOUR CREDENTIALS HERE ────────────────────────────── */
const SUPABASE_URL = 'https://gvdzqwclzqdlubdusgem.supabase.co';
const SUPABASE_KEY = 'sb_publishable_--byWlzfvah4iHTYvqaDIw_ARgGL1mH';

const EMAILJS_PUBLIC_KEY  = 'DZGtXMBvL4RaGHyGG';
const EMAILJS_SERVICE_ID  = 'service_459an5n';
const EMAILJS_TEMPLATE_ID = 'template_alopfyu';

const TBL_MESSAGES = 'contact_messages';
/* ─────────────────────────────────────────────────────────────── */

/* ── Supabase client (lazy — created only when credentials exist) ── */
let _sb = null;
function getSupabase() {
  if (_sb) return _sb;
  if (SUPABASE_URL && SUPABASE_KEY && typeof supabase !== 'undefined') {
    try { _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch(e) {}
  }
  return _sb;
}
function hasSupabase() { return !!getSupabase(); }

/* ════════════════════════════════════════════════════════════════
   MESSAGES — contact form enquiries
   ════════════════════════════════════════════════════════════════ */

async function automationSaveToSupabase(msg) {
  const sb = getSupabase(); if (!sb) return false;
  try {
    const { error } = await sb.from(TBL_MESSAGES).insert({
      name: msg.name || '', org: msg.org || '', email: msg.email || '',
      phone: msg.phone || '', country: msg.country || '',
      service: msg.service || '',
      message: msg.message || '', subject: msg.subject || '', read: false
    });
    if (error) { console.error('[AUTOMATION] Supabase insert:', error.message); return false; }
    return true;
  } catch(e) { console.error('[AUTOMATION] Supabase save failed:', e); return false; }
}

async function automationLoadFromSupabase() {
  const sb = getSupabase(); if (!sb) return null;
  try {
    const { data, error } = await sb.from(TBL_MESSAGES)
      .select('*').order('created_at', { ascending: false });
    return error ? null : data;
  } catch(e) { return null; }
}

async function automationMarkReadSupabase(id) {
  const sb = getSupabase(); if (!sb) return;
  try { await sb.from(TBL_MESSAGES).update({ read: true }).eq('id', id); } catch(e) {}
}

async function automationMarkAllReadSupabase() {
  const sb = getSupabase(); if (!sb) return;
  try { await sb.from(TBL_MESSAGES).update({ read: true }).eq('read', false); } catch(e) {}
}

async function automationDeleteSupabase(id) {
  const sb = getSupabase(); if (!sb) return;
  try { await sb.from(TBL_MESSAGES).delete().eq('id', id); } catch(e) {}
}

/* ── Admin portal message refresh ── */
window.automationLoadMessages = async function() {
  if (hasSupabase()) {
    const rows = await automationLoadFromSupabase();
    if (rows !== null && typeof AUTOMATION_CMS !== 'undefined') {
      const data = AUTOMATION_CMS.load();
      data.messages = rows.map(m => ({
        id:      m.id,
        name:    m.name,    org:     m.org,     email:   m.email,
        phone:   m.phone,   country: m.country, service: m.service,
        message: m.message, subject: m.subject,
        read:    m.read,
        time: new Date(m.created_at).toLocaleString('en-GB', {
          day:'2-digit', month:'short', year:'numeric',
          hour:'2-digit', minute:'2-digit'
        })
      }));
      AUTOMATION_CMS.save(data);
    }
  }
  if (typeof renderMsgs    === 'function') renderMsgs();
  if (typeof updateMsgBadge === 'function') updateMsgBadge();
};

/* ════════════════════════════════════════════════════════════════
   EMAIL NOTIFICATIONS
   ════════════════════════════════════════════════════════════════ */

/* EmailJS hard-caps every template variable at 50KB. Messages longer than
   this go to the Admin Portal dashboard only (it accepts up to 100,000
   characters) instead of being sent to EmailJS at all. */
const EMAILJS_CHAR_LIMIT = 40000;

async function automationSendEmail(params) {
  if (typeof emailjs === 'undefined') { console.warn('[AUTOMATION] EmailJS not loaded'); return false; }
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) { return false; }
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      from_name:  params.from_name  || 'Unknown',
      from_email: params.from_email || '',
      from_org:   params.from_org   || '—',
      phone:      params.phone      || '—',
      country:    params.country    || '—',
      service:    params.service    || '—',
      message:    params.message    || '',
      sent_time: new Date().toLocaleString('en-GB', {
        day:'2-digit', month:'short', year:'numeric',
        hour:'2-digit', minute:'2-digit'
      })
    });
    return true;
  } catch(e) { console.error('[AUTOMATION] EmailJS failed:', e); return false; }
}

/* ════════════════════════════════════════════════════════════════
   CONTACT FORM
   ════════════════════════════════════════════════════════════════ */

function automationSaveToLocalStorage(msg) {
  try {
    if (typeof AUTOMATION_CMS !== 'undefined' && typeof AUTOMATION_CMS.addMessage === 'function') {
      AUTOMATION_CMS.addMessage(msg); return true;
    }
  } catch(e) {}
  return false;
}

/* Forward the submission to the Admin Portal CMS inbox (fire-and-forget; never blocks the form). */
function automationSaveToAdminPortal(msg) {
  try {
    const loaderScript = document.querySelector('script[src*="cms-loader.js"]');
    const apiBase = loaderScript ? (loaderScript.getAttribute('data-api') || '').replace(/\/$/, '') : '';
    if (!apiBase) return;
    const prefix = `Organisation: ${msg.org}\nCountry: ${msg.country}\n\n`;
    const maxBody = 100000 - prefix.length;
    const body = (msg.message || '').length > maxBody
      ? msg.message.slice(0, maxBody) + `\n\n[... truncated — ${msg.message.length.toLocaleString()} characters total, full text saved in Supabase ...]`
      : (msg.message || '');
    fetch(apiBase + '/api/public/contact', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: msg.name,
        email: msg.email,
        phone: msg.phone,
        subject: msg.subject,
        message: prefix + body,
        category: 'project-inquiry',
      }),
    }).catch(() => {});
  } catch (e) { /* never block the existing form flow */ }
}

function automationWireContactForm() {
  const form = document.getElementById('automation-contact-form');
  if (!form) return;
  const fresh = form.cloneNode(true);
  form.parentNode.replaceChild(fresh, form);

  fresh.addEventListener('submit', async function(e) {
    e.preventDefault();
    const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const msg = {
      name:    get('full-name'),
      org:     get('organisation'),
      email:   get('email'),
      phone:   get('phone'),
      country: get('country'),
      service: get('service'),
      message: get('brief'),
      subject: `Website enquiry — ${get('service') || 'General'}`
    };

    if (!msg.name || !msg.email || !msg.message) {
      _showBanner(fresh, 'error', 'Please fill in all required fields (Name, Email, Project Brief).'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) {
      _showBanner(fresh, 'error', 'Please enter a valid email address.'); return;
    }

    const btn = fresh.querySelector('button[type="submit"]');
    const orig = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…'; }

    try {
      /* Save to Supabase (cross-device, primary) */
      const sbOk = await automationSaveToSupabase(msg);
      /* Save to localStorage (same-device fallback if Supabase not set up yet) */
      if (!sbOk) automationSaveToLocalStorage(msg);

      /* Messages under the EmailJS size limit go to both EmailJS and the
         Admin Portal. Larger messages (Admin Portal accepts up to 100,000
         characters) skip EmailJS entirely and go to the Admin Portal only. */
      const tooLargeForEmail = msg.message.length > EMAILJS_CHAR_LIMIT;
      const emailOk = tooLargeForEmail ? null : await automationSendEmail({
        from_name: msg.name, from_email: msg.email, from_org: msg.org,
        phone: msg.phone, country: msg.country, service: msg.service,
        message: msg.message
      });
      /* Also record in the Admin Portal inbox so it shows up in the CMS dashboard */
      automationSaveToAdminPortal(msg);

      fresh.parentNode.innerHTML = `
        <div style="text-align:center;padding:3.5rem 2rem;">
          <div style="font-size:3.5rem;margin-bottom:1.25rem;">✅</div>
          <h3 style="font-family:var(--font-heading);color:var(--navy);margin-bottom:0.75rem;">Message Sent Successfully!</h3>
          <p style="color:var(--gray);font-size:0.9rem;line-height:1.6;">
            Thank you, <strong>${_esc(msg.name)}</strong>. We have received your enquiry
            and will respond within <strong>24 business hours</strong>.
          </p>
          ${tooLargeForEmail ? '<p style="color:var(--gray);font-size:0.82rem;margin-top:0.75rem;">ℹ️ Your message was large, so it was delivered straight to our dashboard instead of email — it has been recorded and we will respond soon.</p>' : (!emailOk ? '<p style="color:var(--gray);font-size:0.82rem;margin-top:0.75rem;">⚠️ Email confirmation may be delayed — your message has been recorded.</p>' : '')}
          <div style="margin-top:1.5rem;"><a href="index.html" style="color:var(--teal);font-size:0.85rem;">← Back to Home</a></div>
        </div>`;
    } catch(err) {
      console.error('[AUTOMATION] Form error:', err);
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
      _showBanner(fresh, 'error', 'Something went wrong. Please email us directly at info@automationgroup.tech');
    }
  });
}

function _showBanner(form, type, text) {
  let b = form.querySelector('.automation-form-banner');
  if (!b) {
    b = document.createElement('div'); b.className = 'automation-form-banner';
    const btn = form.querySelector('button[type="submit"]');
    if (btn) form.insertBefore(b, btn); else form.appendChild(b);
  }
  const err = type === 'error';
  b.style.cssText = `margin-bottom:1rem;padding:.75rem 1rem;border-radius:6px;font-size:.83rem;`
    + `background:${err?'rgba(231,76,60,.08)':'rgba(39,174,96,.08)'};`
    + `border:1px solid ${err?'rgba(231,76,60,.35)':'rgba(39,174,96,.35)'};`
    + `color:${err?'#c0392b':'#1e8449'};`;
  b.textContent = text;
  b.scrollIntoView({ behavior:'smooth', block:'center' });
  setTimeout(() => { if (b.parentNode) b.remove(); }, 6000);
}

function _esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Auto-init ── */
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY) emailjs.init(EMAILJS_PUBLIC_KEY);
    if (document.getElementById('automation-contact-form')) automationWireContactForm();
  });
})();
