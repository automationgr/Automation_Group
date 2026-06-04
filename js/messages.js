/* ============================================================
   APEX R&M GROUP — messages.js
   Contact Form: saves to Admin Portal (localStorage) + EmailJS
   ============================================================ */
'use strict';

/* ── CONFIGURATION ── */
const APEX_MSG_CONFIG = {
  emailjs: {
    publicKey:  'AjrKDbhnDmViU1AE8',
    serviceId:  'service_hpantj2',
    templateId: 'template_b3729sx'
  }
};

/* ── ADMIN PORTAL COMPATIBILITY (called from admin-portal.html) ── */
window.apexLoadMessages = function () {
  if (typeof renderMsgs === 'function') renderMsgs();
  if (typeof updateMsgBadge === 'function') updateMsgBadge();
};

/* No-op stubs (Supabase disabled) */
async function apexMarkReadSupabase()    {}
async function apexMarkAllReadSupabase() {}
async function apexDeleteSupabase()      {}

/* ── SEND EMAIL via EmailJS ── */
async function apexSendEmail(msg) {
  if (typeof emailjs === 'undefined') {
    console.warn('[APEX] EmailJS not loaded');
    return false;
  }
  try {
    await emailjs.send(
      APEX_MSG_CONFIG.emailjs.serviceId,
      APEX_MSG_CONFIG.emailjs.templateId,
      {
        from_name:  msg.name    || 'Unknown',
        from_email: msg.email   || '',
        from_org:   msg.org     || '—',
        phone:      msg.phone   || '—',
        country:    msg.country || '—',
        service:    msg.service || '—',
        budget:     msg.budget  || '—',
        message:    msg.message || '',
        sent_time:  new Date().toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      }
    );
    return true;
  } catch (e) {
    console.error('[APEX] EmailJS send failed:', e);
    return false;
  }
}

/* ── SAVE MESSAGE to Admin Portal localStorage ── */
function apexSaveToAdminPortal(msg) {
  try {
    if (typeof APEX_CMS !== 'undefined' && typeof APEX_CMS.addMessage === 'function') {
      APEX_CMS.addMessage(msg);
      return true;
    }
    console.warn('[APEX] APEX_CMS not available — message not saved to admin portal');
  } catch (e) {
    console.error('[APEX] Failed to save message to admin portal:', e);
  }
  return false;
}

/* ── CONTACT FORM HANDLER ── */
function apexWireContactForm() {
  const form = document.getElementById('apex-contact-form');
  if (!form) return;

  /* Clone to strip any pre-existing submit listeners */
  const fresh = form.cloneNode(true);
  form.parentNode.replaceChild(fresh, form);

  fresh.addEventListener('submit', async function (e) {
    e.preventDefault();

    const get = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const msg = {
      name:    get('full-name'),
      org:     get('organisation'),
      email:   get('email'),
      phone:   get('phone'),
      country: get('country'),
      service: get('service'),
      budget:  get('budget'),
      message: get('brief'),
      subject: `Website enquiry — ${get('service') || 'General'}`
    };

    /* Basic validation */
    if (!msg.name || !msg.email || !msg.message) {
      _apexShowFormMsg(fresh, 'error',
        'Please fill in all required fields (Name, Email, Project Brief).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) {
      _apexShowFormMsg(fresh, 'error', 'Please enter a valid email address.');
      return;
    }

    /* Disable submit button while processing */
    const btn = fresh.querySelector('button[type="submit"]');
    const origBtnHTML = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    }

    try {
      /* 1 ─ Save to Admin Portal (localStorage) */
      apexSaveToAdminPortal(msg);

      /* 2 ─ Send email notification */
      const emailOk = await apexSendEmail(msg);

      /* 3 ─ Show success screen */
      const wrap = fresh.parentNode;
      wrap.innerHTML = `
        <div style="text-align:center;padding:3.5rem 2rem;">
          <div style="font-size:3.5rem;margin-bottom:1.25rem;">✅</div>
          <h3 style="font-family:var(--font-heading);color:var(--navy);margin-bottom:0.75rem;">
            Message Sent Successfully!
          </h3>
          <p style="color:var(--gray);font-size:0.9rem;line-height:1.6;">
            Thank you, <strong>${_esc(msg.name)}</strong>. We have received your enquiry
            and will respond within <strong>24 business hours</strong>.
          </p>
          ${!emailOk
            ? '<p style="color:var(--gray);font-size:0.82rem;margin-top:0.75rem;">⚠️ Email confirmation may be delayed — your message has been recorded.</p>'
            : ''}
          <div style="margin-top:1.5rem;">
            <a href="index.html" style="color:var(--teal);font-size:0.85rem;">← Back to Home</a>
          </div>
        </div>`;

    } catch (err) {
      console.error('[APEX] Form submission error:', err);
      if (btn) { btn.disabled = false; btn.innerHTML = origBtnHTML; }
      _apexShowFormMsg(fresh, 'error',
        'Something went wrong. Please try again or email us directly at info.apexrmgroup@gmail.com');
    }
  });
}

/* ── HELPERS ── */
function _apexShowFormMsg(form, type, text) {
  let banner = form.querySelector('.apex-form-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'apex-form-banner';
    const btn = form.querySelector('button[type="submit"]');
    if (btn) form.insertBefore(banner, btn);
    else form.appendChild(banner);
  }
  const isErr = type === 'error';
  banner.style.cssText = `
    margin-bottom:1rem;padding:.75rem 1rem;border-radius:6px;font-size:.83rem;
    background:${isErr ? 'rgba(231,76,60,.08)' : 'rgba(39,174,96,.08)'};
    border:1px solid ${isErr ? 'rgba(231,76,60,.35)' : 'rgba(39,174,96,.35)'};
    color:${isErr ? '#c0392b' : '#1e8449'};`;
  banner.textContent = text;
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 6000);
}

function _esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── AUTO-INIT ── */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined' && APEX_MSG_CONFIG.emailjs.publicKey) {
      emailjs.init(APEX_MSG_CONFIG.emailjs.publicKey);
    }
    if (document.getElementById('apex-contact-form')) {
      apexWireContactForm();
    }
  });
})();
