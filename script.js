(function initDarkMode() {
  const DARK_KEY = 'sqlearn_dark';
  const root = document.documentElement;

  
  if (localStorage.getItem(DARK_KEY) === 'dark') {
    root.setAttribute('data-theme', 'dark');
  }

  function toggleDark() {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) {
      root.removeAttribute('data-theme');
      localStorage.setItem(DARK_KEY, 'light');
    } else {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem(DARK_KEY, 'dark');
    }
  }

  
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.addEventListener('click', toggleDark);
  });
  
  if (document.readyState !== 'loading') {
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.addEventListener('click', toggleDark);
  }
})();

(function initScrollReveal() {
  const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-pop, .reveal-clip, .section h2';

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  function observe() {
    
    document.querySelectorAll('.section h2').forEach(el => {
      if (!el.classList.contains('reveal') && !el.classList.contains('reveal-left')) {
        el.classList.add('reveal');
      }
    });
    
    document.querySelectorAll('.sub').forEach(el => {
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
    });
    document.querySelectorAll(selectors).forEach(el => obs.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe);
  } else {
    observe();
  }
  setTimeout(observe, 800);
  window.__sqlRevealObserve = observe;
})();

document.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-menu-toggle]');
  if (toggle) {
    document.querySelector('.nav')?.classList.toggle('open');
  }
});

(function highlightNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a[data-route]').forEach((a) => {
    if (a.dataset.route === path) a.classList.add('active');
  });
})();

const SQL_KEYWORDS = new Set([
  'SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE',
  'CREATE','TABLE','DROP','ALTER','ADD','PRIMARY','KEY','FOREIGN','REFERENCES',
  'NOT','NULL','AND','OR','ORDER','BY','GROUP','HAVING','JOIN','INNER','LEFT',
  'RIGHT','ON','AS','DISTINCT','INT','VARCHAR','DATE','DECIMAL','USE','DATABASE','IS',
  'COUNT','SUM','AVG','MIN','MAX','LIMIT','OFFSET','TOP','LIKE','IN','BETWEEN'
]);

function highlightSQL(code) {
  const re = /(--[^\n]*)|('(?:[^'\\]|\\.)*')|([A-Za-z_]+)|([\s\S])/g;
  let out = '';
  let m;
  while ((m = re.exec(code)) !== null) {
    if (m[1]) out += `<span class="code-comment">${escapeHtml(m[1])}</span>`;
    else if (m[2]) out += `<span class="code-string">${escapeHtml(m[2])}</span>`;
    else if (m[3]) {
      const word = m[3];
      if (SQL_KEYWORDS.has(word.toUpperCase())) out += `<span class="code-keyword">${escapeHtml(word)}</span>`;
      else out += escapeHtml(word);
    } else out += escapeHtml(m[4]);
  }
  return out;
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function makeCodeBlock(code, label) {
  const trimmed = code.trim();
  const html = highlightSQL(trimmed);
  return `
    <div>
      ${label ? `<div class="code-label">${escapeHtml(label)}</div>` : ''}
      <div class="code-wrap">
        <pre class="code-block"><code>${html}</code></pre>
        <button class="copy-btn" data-copy="${encodeURIComponent(trimmed)}">Copy</button>
      </div>
    </div>`;
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  try {
    await navigator.clipboard.writeText(decodeURIComponent(btn.dataset.copy));
    const old = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = old), 1500);
  } catch {}
});

const AUTH_KEY = 'sqlearn_auth';
const USERS_KEY = 'sqlearn_users';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; }
}
function saveUsers(u) {
  // Legacy helper only. Supabase is now used for real account storage.
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
  } catch {
    return null;
  }
}
function loginUser(u) {
  // Legacy helper only. Supabase handles the real login session now.
  if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
}
async function logoutUser() {
  localStorage.removeItem(AUTH_KEY);

  if (typeof clearSessionProgress === 'function') {
    clearSessionProgress();
  }

  await supabaseLogoutUser();
  location.href = 'index.html';
}

async function registerUser(name, email, password) {
  const res = await supabaseRegisterUser(name, email, password);

  if (res.ok && res.user) {
    loginUser(res.user);
  }

  return res;
}

async function loginWithCredentials(email, password) {
  const res = await supabaseLoginUser(email, password);

  if (res.ok && res.user) {
    loginUser(res.user);
  }

  return res;
}

function injectAuthModal() {
  const modal = document.createElement('div');
  modal.className = 'auth-modal';
  modal.id = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-panel">
      <button class="auth-close" id="auth-close-btn">✕</button>
      <div class="auth-logo">
        <span class="badge" style="width:32px;height:32px;border-radius:8px;background:var(--gradient-hero);display:grid;place-items:center;color:#fff">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
        </span>
        SQ<span style="color:var(--primary)">Learn</span>
      </div>
      <h2 id="auth-title">Welcome back</h2>
      <p class="auth-sub" id="auth-sub">Sign in to save your progress and sync across devices.</p>
      <div class="auth-tabs" id="auth-tabs-row">
        <div class="auth-tab active" data-auth-tab="login">Log In</div>
        <div class="auth-tab" data-auth-tab="register">Sign Up</div>
      </div>
      <div class="auth-error" id="auth-error"></div>

      <!-- Login form -->
      <div class="auth-form active" id="auth-form-login">
        <form id="auth-login-form" autocomplete="on" style="display:contents">
        <div class="field">
          <label for="auth-login-email">Email</label>
          <input id="auth-login-email" type="email" placeholder="you@school.edu" autocomplete="email" />
        </div>
        <div class="field">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem">
            <label for="auth-login-pass" style="margin:0">Password</label>
            <span class="forgot-link" id="open-forgot-btn">Forgot password?</span>
          </div>
          <input id="auth-login-pass" type="password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary" id="auth-login-btn" style="width:100%;justify-content:center;margin-top:.25rem">Log In</button>
        </form>
        <div style="text-align:center;font-size:.82rem;color:var(--muted)">Don't have an account? <span style="color:var(--primary);font-weight:600;cursor:pointer" data-auth-tab="register">Sign up free</span></div>
      </div>

      <!-- Register form -->
      <div class="auth-form" id="auth-form-register">
        <form id="auth-reg-form" autocomplete="on" style="display:contents">
        <div class="field">
          <label for="auth-reg-name">Full Name</label>
          <input id="auth-reg-name" type="text" placeholder="Maria Santos" autocomplete="name" />
        </div>
        <div class="field">
          <label for="auth-reg-email">Email</label>
          <input id="auth-reg-email" type="email" placeholder="you@school.edu" autocomplete="email" />
        </div>
        <div class="field">
          <label for="auth-reg-pass">Password</label>
          <input id="auth-reg-pass" type="password" placeholder="Create a password" autocomplete="new-password" />
        </div>
        <button type="submit" class="btn btn-primary" id="auth-reg-btn" style="width:100%;justify-content:center;margin-top:.25rem">Create Account</button>
        </form>
        <div style="text-align:center;font-size:.82rem;color:var(--muted)">Already have an account? <span style="color:var(--primary);font-weight:600;cursor:pointer" data-auth-tab="login">Log in</span></div>
      </div>

      <!-- Forgot Password form -->
      <div class="auth-form" id="auth-form-forgot">
        <div class="field">
          <label for="auth-forgot-email">Enter your registered email</label>
          <input id="auth-forgot-email" type="email" placeholder="you@school.edu" autocomplete="email" />
        </div>
        <button class="btn btn-primary" id="auth-forgot-btn" style="width:100%;justify-content:center;margin-top:.25rem">Recover Password</button>
        <div style="text-align:center;font-size:.82rem;color:var(--muted);margin-top:.6rem">
          <span style="color:var(--primary);font-weight:600;cursor:pointer" data-auth-tab="login">← Back to Log In</span>
        </div>
        <!-- Recovery result shown here -->
        <div class="forgot-result" id="forgot-result"></div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-auth-tab]');
    if (!tab) return;
    switchAuthTab(tab.dataset.authTab);
  });

  
  document.getElementById('open-forgot-btn').addEventListener('click', () => switchAuthTab('forgot'));

  
  document.getElementById('auth-close-btn').addEventListener('click', closeAuthModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAuthModal(); });

  document.getElementById('auth-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-login-email').value.trim();
    const pass = document.getElementById('auth-login-pass').value;
    const res = await loginWithCredentials(email, pass);
    if (res.ok) {
      migrateSessionProgressToUser(res.user.email);
      closeAuthModal();
      renderAuthNav();
    } else showAuthError(res.msg);
  });

  document.getElementById('auth-reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('auth-reg-name').value.trim();
    const email = document.getElementById('auth-reg-email').value.trim();
    const pass = document.getElementById('auth-reg-pass').value;
    if (!name) return showAuthError('Please enter your name.');
    if (!email.includes('@')) return showAuthError('Please enter a valid email.');
    if (pass.length < 6) return showAuthError('Password must be at least 6 characters.');
    const res = await registerUser(name, email, pass);
    if (res.ok) {
      migrateSessionProgressToUser(res.user.email);
      closeAuthModal();
      renderAuthNav();
    } else showAuthError(res.msg);
  });

  
  document.getElementById('auth-forgot-btn').addEventListener('click', () => {
    const email = document.getElementById('auth-forgot-email').value.trim();
    const resultEl = document.getElementById('forgot-result');
    resultEl.className = 'forgot-result show';

    if (!email.includes('@')) {
      resultEl.classList.add('forgot-error');
      resultEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Please enter a valid email address.`;
      return;
    }

    const users = getUsers();
    const user = users[email];

    if (!user) {
      resultEl.classList.add('forgot-error');
      resultEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> No account found with that email. Double-check your email or <span style="color:var(--primary);font-weight:600;cursor:pointer" data-auth-tab="register">create a new account.</span>`;
      return;
    }

    
    resultEl.classList.remove('forgot-error');
    resultEl.classList.add('forgot-success');
    resultEl.innerHTML = `
      <div class="forgot-success-inner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <div>
          <div style="font-weight:700;margin-bottom:.3rem">Account found!</div>
          <div style="font-size:.82rem;opacity:.85">Hi, <strong>${escapeHtml(user.name)}</strong>. Your password is:</div>
          <div class="forgot-pw-display">
            <span id="forgot-pw-text" class="forgot-pw-hidden">••••••••</span>
            <button class="forgot-pw-toggle" id="forgot-pw-toggle-btn" aria-label="Show password">
              <svg class="eye-show" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg class="eye-hide" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              Show
            </button>
          </div>
          <div style="font-size:.78rem;opacity:.75;margin-top:.4rem">Use this to log in, then change your password in <a href="account.html" style="color:inherit;text-decoration:underline">My Account</a>.</div>
        </div>
      </div>`;

    
    const pwText = document.getElementById('forgot-pw-text');
    const toggleBtn = document.getElementById('forgot-pw-toggle-btn');
    let visible = false;
    toggleBtn.addEventListener('click', () => {
      visible = !visible;
      pwText.textContent = visible ? user.password : '••••••••';
      pwText.classList.toggle('forgot-pw-hidden', !visible);
      toggleBtn.querySelector('.eye-show').style.display = visible ? 'none' : '';
      toggleBtn.querySelector('.eye-hide').style.display = visible ? '' : 'none';
      toggleBtn.childNodes[toggleBtn.childNodes.length - 1].textContent = visible ? ' Hide' : ' Show';
    });
  });

  
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const activeForm = document.querySelector('.auth-form.active');
    if (!activeForm) return;
    if (activeForm.id === 'auth-form-login')         document.getElementById('auth-login-form').requestSubmit();
    else if (activeForm.id === 'auth-form-register') document.getElementById('auth-reg-form').requestSubmit();
    else if (activeForm.id === 'auth-form-forgot')   document.getElementById('auth-forgot-btn').click();
  });
}

function switchAuthTab(tab) {
  
  const tabsRow = document.getElementById('auth-tabs-row');
  if (tabsRow) tabsRow.style.display = tab === 'forgot' ? 'none' : '';

  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.authTab === tab));
  document.getElementById('auth-form-login').classList.toggle('active', tab === 'login');
  document.getElementById('auth-form-register').classList.toggle('active', tab === 'register');
  document.getElementById('auth-form-forgot').classList.toggle('active', tab === 'forgot');

  
  const err = document.getElementById('auth-error');
  if (err) { err.classList.remove('show'); err.textContent = ''; }

  
  if (tab !== 'forgot') {
    const fr = document.getElementById('forgot-result');
    if (fr) { fr.className = 'forgot-result'; fr.innerHTML = ''; }
    const fe = document.getElementById('auth-forgot-email');
    if (fe) fe.value = '';
  }

  if (tab === 'login') {
    document.getElementById('auth-title').textContent = 'Welcome back';
    document.getElementById('auth-sub').textContent = 'Sign in to save your progress and sync across devices.';
  } else if (tab === 'register') {
    document.getElementById('auth-title').textContent = 'Create your account';
    document.getElementById('auth-sub').textContent = 'Free forever. Track your SQL learning journey.';
  } else {
    document.getElementById('auth-title').textContent = 'Forgot your password?';
    document.getElementById('auth-sub').textContent = 'Enter your email and we\'ll show you your saved password.';
  }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.classList.add('show'); }
}

function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (modal) { modal.classList.add('open'); switchAuthTab(tab); }
}
function closeAuthModal() {
  document.getElementById('auth-modal')?.classList.remove('open');
}

function renderAuthNav() {
  const slot = document.getElementById('auth-nav-slot');
  if (!slot) return;

  const user = getCurrentUser();

  if (user) {
    const avatarHtml = user.profilePic
      ? `<div class="auth-avatar" style="background:none;padding:0;overflow:hidden"><img src="${user.profilePic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" /></div>`
      : `<div class="auth-avatar">${escapeHtml(user.avatar || user.email.slice(0, 2).toUpperCase())}</div>`;

    slot.innerHTML = `
      <div class="user-menu-wrap">
        <button class="user-menu-btn" id="user-menu-toggle">
          ${avatarHtml}
          <span style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml((user.name || user.email).split(' ')[0])}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="user-dropdown" id="user-dropdown">
          <a href="account.html">My Account</a>
          <div class="dd-divider"></div>
          <button class="dd-logout" id="logout-btn">Log Out</button>
        </div>
      </div>`;

    document.getElementById('user-menu-toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('user-dropdown')?.classList.toggle('open');
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await logoutUser();
    });

    document.addEventListener('click', () => {
      document.getElementById('user-dropdown')?.classList.remove('open');
    });
  } else {
    slot.innerHTML = `<button class="auth-btn-nav" id="open-auth-btn">Log In</button>`;

    document.getElementById('open-auth-btn')?.addEventListener('click', () => {
      openAuthModal('login');
    });
  }
}
injectAuthModal();
renderAuthNav();

const LESSON_VIDEOS = {
  'intro':           { title: 'What is SQL? - Intro for Beginners', youtubeId: 'HXV3zeQKqGY', duration: '23 min', channel: 'freeCodeCamp' },
  'creating-tables': { title: 'CREATE TABLE in SQL - Full Tutorial', youtubeId: 'ztHopE5Wnpc', duration: '12 min', channel: 'Programming with Mosh' },
  'select':          { title: 'SQL SELECT Statement - Complete Guide', youtubeId: 'Hl4NZB1XR9I', duration: '15 min', channel: 'Web Dev Simplified' },
  'insert':          { title: 'INSERT INTO - SQL for Beginners', youtubeId: 'OfM5lC-7R4Y', duration: '10 min', channel: 'Traversy Media' },
  'update':          { title: 'UPDATE Statement in SQL', youtubeId: 'p3qvj9hO_Bo', duration: '9 min',  channel: 'Programming with Mosh' },
  'delete':          { title: 'DELETE in SQL - Explained Simply', youtubeId: 'MBjBRPKK3CM', duration: '8 min',  channel: 'freeCodeCamp' },
  'joins':           { title: 'SQL JOINs - INNER, LEFT, RIGHT, FULL', youtubeId: '9yeOJ0ZMUYw', duration: '16 min', channel: 'freeCodeCamp' },
  'aggregations':    { title: 'SQL GROUP BY, COUNT, AVG - Full Tutorial', youtubeId: 'MFDbLLb6n5g', duration: '14 min', channel: 'Web Dev Simplified' },
};

function makeVideoSection(lessonId) {
  const v = LESSON_VIDEOS[lessonId];
  if (!v) return '';
  return `
    <div class="video-section" id="video-${lessonId}">
      <div class="video-header">
        <span class="video-header-badge">Video Tutorial</span>
        <span class="video-header-title">${escapeHtml(v.title)}</span>
      </div>
      <div class="video-player-wrap" id="vwrap-${lessonId}">
        <div class="video-placeholder" onclick="loadVideo('${lessonId}')">
          <div class="video-play-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
          <div class="video-placeholder-title">${escapeHtml(v.title)}</div>
          <div class="video-placeholder-sub">Click to play • ${escapeHtml(v.duration)}</div>
        </div>
      </div>
      <div class="video-footer">
        <div class="video-footer-info">Channel: <strong>${escapeHtml(v.channel)}</strong> · ${escapeHtml(v.duration)}</div>
        <a href="https://www.youtube.com/watch?v=${v.youtubeId}" target="_blank" rel="noopener"
           style="font-size:.75rem;color:var(--primary-glow);font-weight:600">Open in YouTube ↗</a>
      </div>
    </div>`;
}

window.loadVideo = function(lessonId) {
  const v = LESSON_VIDEOS[lessonId];
  if (!v) return;
  const wrap = document.getElementById(`vwrap-${lessonId}`);
  if (!wrap) return;
  wrap.innerHTML = `<iframe
    src="https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen></iframe>`;
};

const PROGRESS_SESSION_KEY = 'sqlearn_progress_session'; 

let _guestProgressMemory = {};

function _userProgressKey(email) {
  
  return 'sqlearn_progress_u_' + (email || '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function getProgress() {
  try {
    const user = getCurrentUser();
    if (user) {
      return JSON.parse(localStorage.getItem(_userProgressKey(user.email))) || {};
    }
    return _guestProgressMemory;
  } catch {
    return {};
  }
}

function setProgress(data) {
  try {
    const user = getCurrentUser();
    if (user) {
      localStorage.setItem(_userProgressKey(user.email), JSON.stringify(data));
    } else {
      _guestProgressMemory = data;
    }
  } catch {}
}

function getPrefs() {
  const p = getProgress();
  const saved = p.prefs || {};
  return {
    taglish:  typeof saved.taglish  !== 'undefined' ? saved.taglish  : true,
    videos:   typeof saved.videos   !== 'undefined' ? saved.videos   : true,
    automark: typeof saved.automark !== 'undefined' ? saved.automark : true,
  };
}

function migrateSessionProgressToUser(email) {
  try {
    const sessionData = JSON.parse(sessionStorage.getItem(PROGRESS_SESSION_KEY)) || {};
    if (!Object.keys(sessionData).length) return; 
    const userKey = _userProgressKey(email);
    const existing = JSON.parse(localStorage.getItem(userKey)) || {};
    
    if (sessionData.lessons) {
      existing.lessons = { ...sessionData.lessons, ...(existing.lessons || {}) };
    }
    
    if (sessionData.quizHistory && sessionData.quizHistory.length) {
      const existingTs = new Set((existing.quizHistory || []).map(a => a.ts));
      const newAttempts = sessionData.quizHistory.filter(a => !existingTs.has(a.ts));
      existing.quizHistory = [...(existing.quizHistory || []), ...newAttempts];
    }
    
    if (sessionData.quizScores) {
      existing.quizScores = existing.quizScores || {};
      Object.entries(sessionData.quizScores).forEach(([id, s]) => {
        if (!existing.quizScores[id] || s.pct > existing.quizScores[id].pct) {
          existing.quizScores[id] = s;
        }
      });
    }
    localStorage.setItem(userKey, JSON.stringify(existing));
    
    sessionStorage.removeItem(PROGRESS_SESSION_KEY);
  } catch {}
}

function clearSessionProgress() {
  try { sessionStorage.removeItem(PROGRESS_SESSION_KEY); } catch {}
}

function getPracticeDone() {
  const p = getProgress();
  return p.practice || {};
}
function markPracticeDone(idx) {
  const p = getProgress();
  if (!p.practice) p.practice = {};
  p.practice[idx] = true;
  setProgress(p);
}

function markLessonDone(id) {
  if (!getPrefs().automark) return;   
  const p = getProgress();
  if (!p.lessons) p.lessons = {};
  p.lessons[id] = { done: true, ts: Date.now() };
  setProgress(p);
}
function saveLessonScore(id, score, total) {
  const p = getProgress();

  if (!p.quizScores) p.quizScores = {};

  p.quizScores[id] = {
    score,
    total,
    pct: Math.round(score / total * 100)
  };

  // local UI cache
  setProgress(p);

  // Supabase save
  if (typeof supabaseSaveLessonScore === 'function') {
    supabaseSaveLessonScore(id, score, total);
  }
}
function saveQuizAttempt(score, total, difficulty) {
  const p = getProgress();

  if (!p.quizHistory) p.quizHistory = [];

  p.quizHistory.push({
    score,
    total,
    pct: Math.round(score / total * 100),
    difficulty: difficulty || 'all',
    ts: Date.now()
  });

  // local UI cache
  setProgress(p);

  // Supabase database save
  if (typeof supabaseSaveQuizAttempt === 'function') {
    supabaseSaveQuizAttempt(score, total, difficulty);
  }
}
function getQuizHistory() {
  const p = getProgress();
  return p.quizHistory || [];
}
function getBestQuizScore() {
  const h = getQuizHistory();
  if (!h.length) return null;
  return h.reduce((best, a) => a.pct > best.pct ? a : best, h[0]);
}
function getLessonProgress(id) {
  const p = getProgress();
  return p?.lessons?.[id] || null;
}

const LESSONS = [
  {
    id: 'intro', title: 'Introduction to SQL', level: 'Beginner', duration: '8 min',
    summary: 'Understand what SQL is and why it powers nearly every data-driven app.',
    topics: ['Databases','SQL syntax','Microsoft SQL Server'],
    intro: 'Structured Query Language (SQL) is the standard language used to define, manipulate, and control data in relational databases. In this lesson you will write your very first SQL statement.',
    taglish: 'Simply put, SQL is the "language" you use to communicate with a database. Think of it this way - you are the boss, the database is the employee, and SQL is your set of instructions. "Hey database, give me all the students who enrolled this year." That is exactly what SQL does!',
    body: `
<h3>What is a Database?</h3>
<p>A <strong>database</strong> is an organized collection of structured data stored electronically. Think of it like a highly organized digital filing cabinet where every piece of data has a specific place and can be retrieved instantly.</p>
<p>In a school setting, the database might contain tables for Students, Courses, Grades, and Faculty - all linked together so you can ask complex questions like "Which students have a grade lower than 2.0 in Database Management?"</p>

<h3>What is a Relational Database?</h3>
<p>A <strong>relational database</strong> stores data in tables (called <em>relations</em>) made up of rows and columns - very similar to a spreadsheet. The key idea is that tables can be <em>related</em> to each other through shared columns called keys.</p>
<ul style="margin:.75rem 0 .75rem 1.5rem;line-height:2">
  <li><strong>Table</strong> - a grid of rows and columns (like a spreadsheet tab)</li>
  <li><strong>Row</strong> - one record of data (one student, one course, etc.)</li>
  <li><strong>Column</strong> - one attribute of that record (FirstName, Grade, etc.)</li>
  <li><strong>Primary Key</strong> - a unique identifier for each row (like StudentID)</li>
  <li><strong>Foreign Key</strong> - a column that points to a primary key in another table</li>
</ul>

<h3>What is Microsoft SQL Server?</h3>
<p>Microsoft SQL Server is one of the most widely used relational database management systems (RDBMS) in enterprise and academic settings. It uses a dialect of SQL called <strong>T-SQL</strong> (Transact-SQL), which adds procedural programming features on top of standard SQL.</p>
<p>SQL Server is the DBMS you will most likely encounter in your BSIT program and in Philippine IT companies, which is why SQLearn focuses on its syntax.</p>

<h3>The Four Core SQL Command Types</h3>
<p>All SQL statements belong to one of four categories:</p>
<ul style="margin:.75rem 0 .75rem 1.5rem;line-height:2">
  <li><strong>DDL</strong> (Data Definition Language) - CREATE, ALTER, DROP - defines the structure</li>
  <li><strong>DML</strong> (Data Manipulation Language) - SELECT, INSERT, UPDATE, DELETE - works with data</li>
  <li><strong>DCL</strong> (Data Control Language) - GRANT, REVOKE - manages permissions</li>
  <li><strong>TCL</strong> (Transaction Control Language) - COMMIT, ROLLBACK - manages transactions</li>
</ul>
<p>In this course we focus on <strong>DML</strong> because that is what you will use every day as a developer.</p>

<h3>SQL Syntax Rules to Remember</h3>
<p>SQL is not case-sensitive for keywords - <code>SELECT</code> and <code>select</code> both work. However, it is a strong convention to write SQL keywords in UPPERCASE and column/table names in their original casing. This makes queries easier to read at a glance.</p>
<p>Statements are typically terminated with a semicolon <code>;</code>. In SQL Server, this is optional for single statements but required in some multi-statement contexts.</p>
<p>Single-line comments start with <code>--</code>, and multi-line comments are wrapped in <code>/* ... */</code>.</p>
    `,
    example: { label: 'Your first query', code: `-- Select a friendly greeting from the database engine\nSELECT 'Hello, SQLearn!' AS greeting;` },
    extraExamples: [
      { label: 'SQL is not case-sensitive for keywords', code: `-- Both of these return the same result:\nSELECT 'Hello' AS greeting;\nselect 'Hello' as greeting;` },
      { label: 'Multi-line comment example', code: `/*\n  This query was written by Maria Santos\n  Date: 2025-08-15\n  Purpose: Fetch all students\n*/\nSELECT * FROM Students;` }
    ],
    exercise: { question: "Write a query that returns the text 'I love SQL' under the column name message.", answer: `SELECT 'I love SQL' AS message;` }
  },
  {
    id: 'creating-tables', title: 'Creating Databases & Tables', level: 'Beginner', duration: '12 min',
    summary: 'Design and build the structure that will hold your data.',
    topics: ['CREATE DATABASE','CREATE TABLE','Data types'],
    intro: 'Before storing data you need a place for it to live. A database is a container for tables, and each table has columns with specific data types.',
    taglish: 'Think of a database as a large cabinet in an office. Each drawer in the cabinet is a TABLE. Inside each drawer are folders (rows), and each folder contains data (columns). So CREATE TABLE is like "make a new drawer in the cabinet." You need to know what kind of information will be stored inside it!',
    body: `
<h3>Planning Your Database</h3>
<p>Before writing a single line of SQL, good developers plan their data structure first. Ask yourself: what information do I need to store? How is that information related? This planning process is called <strong>database design</strong>.</p>
<p>For a school system, you might identify three main entities: Students, Courses, and Grades. Each entity becomes a table. The relationships between them are defined using keys.</p>

<h3>CREATE DATABASE</h3>
<p>The first step is creating a database container. In SQL Server, this is done with <code>CREATE DATABASE</code> followed by the name you choose. Database names should be descriptive and have no spaces (use underscores instead).</p>
<p>After creating the database, you must tell SQL Server to use it with the <code>USE</code> statement - all subsequent commands will apply to that database.</p>

<h3>SQL Server Data Types</h3>
<p>Every column in a table must have a <strong>data type</strong> that defines what kind of values it can store. Choosing the right data type is important for storage efficiency and data integrity.</p>
<ul style="margin:.75rem 0 .75rem 1.5rem;line-height:2">
  <li><code>INT</code> - whole numbers (e.g., StudentID, age, count)</li>
  <li><code>VARCHAR(n)</code> - variable-length text up to n characters (e.g., names, course codes)</li>
  <li><code>CHAR(n)</code> - fixed-length text, always n characters (good for codes like 'M'/'F')</li>
  <li><code>DATE</code> - calendar date in YYYY-MM-DD format</li>
  <li><code>DECIMAL(p,s)</code> - exact decimal numbers (e.g., grades: DECIMAL(3,2) for 1.75)</li>
  <li><code>BIT</code> - boolean true/false stored as 1 or 0</li>
  <li><code>TEXT</code> - large blocks of text (for descriptions, notes)</li>
</ul>

<h3>Constraints - Protecting Your Data</h3>
<p>Constraints are rules attached to columns that prevent bad data from entering the table. They are your first line of defense against data integrity problems.</p>
<ul style="margin:.75rem 0 .75rem 1.5rem;line-height:2">
  <li><strong>PRIMARY KEY</strong> - uniquely identifies each row; cannot be NULL or duplicate</li>
  <li><strong>NOT NULL</strong> - the column must always have a value</li>
  <li><strong>UNIQUE</strong> - all values in the column must be different</li>
  <li><strong>DEFAULT</strong> - provides a fallback value if none is given</li>
  <li><strong>FOREIGN KEY</strong> - links a column to the primary key of another table</li>
  <li><strong>CHECK</strong> - enforces a custom condition (e.g., Grade must be between 1.0 and 5.0)</li>
</ul>

<h3>ALTER TABLE - Modifying Existing Tables</h3>
<p>After creating a table, you may need to change its structure - add a column, change a data type, or drop a constraint. This is done with <code>ALTER TABLE</code>. Be careful in production databases, as altering a table with existing data can cause data loss if not done carefully.</p>

<h3>DROP TABLE - Deleting a Table</h3>
<p><code>DROP TABLE</code> permanently deletes a table and all its data. There is no undo. Always double-check before running this command, and never run it against a production database without a backup.</p>
    `,
    example: { label: 'Create a students table', code: `CREATE DATABASE SchoolDB;\nUSE SchoolDB;\n\nCREATE TABLE Students (\n  StudentID INT PRIMARY KEY,\n  FirstName VARCHAR(50) NOT NULL,\n  LastName VARCHAR(50) NOT NULL,\n  Course VARCHAR(20),\n  EnrollDate DATE\n);` },
    extraExamples: [
      { label: 'Adding a column with ALTER TABLE', code: `-- Add an email column to the existing Students table\nALTER TABLE Students\nADD Email VARCHAR(100);` },
      { label: 'Table with CHECK and DEFAULT constraints', code: `CREATE TABLE Grades (\n  GradeID   INT PRIMARY KEY,\n  StudentID INT NOT NULL,\n  Subject   VARCHAR(100) NOT NULL,\n  Grade     DECIMAL(3,2) NOT NULL\n              CHECK (Grade >= 1.0 AND Grade <= 5.0),\n  Semester  VARCHAR(10) DEFAULT '1st'\n);` },
      { label: 'Adding a FOREIGN KEY relationship', code: `-- Link Grades back to Students\nALTER TABLE Grades\nADD CONSTRAINT fk_student\n  FOREIGN KEY (StudentID)\n  REFERENCES Students(StudentID);` }
    ],
    exercise: { question: 'Create a table named Courses with CourseID (int, primary key) and CourseName (varchar 100).', answer: `CREATE TABLE Courses (\n  CourseID INT PRIMARY KEY,\n  CourseName VARCHAR(100) NOT NULL\n);` }
  },
  {
    id: 'select', title: 'Retrieving Data with SELECT', level: 'Beginner', duration: '10 min',
    summary: 'Pull information out of your tables using the most-used SQL keyword.',
    topics: ['SELECT','WHERE','ORDER BY'],
    intro: 'The SELECT statement is the bread and butter of SQL. It lets you fetch rows and columns, filter by conditions, and order the results.',
    taglish: 'SELECT is like searching for someone in a list. "SELECT * FROM Students" is like saying "Give me ALL the students." When you add WHERE, you are filtering: "Only BSIT students, skip the rest." Then ORDER BY sorts them - just like sorting alphabetically in Excel!',
    body: `
<h3>The SELECT Statement - SQL's Most Used Command</h3>
<p>The <code>SELECT</code> statement retrieves data from one or more tables. It is the command you will write most frequently as a developer or data analyst. A basic SELECT has three parts: the columns you want, the table they come from, and an optional condition to filter rows.</p>
<p>The general syntax is: <code>SELECT columns FROM table WHERE condition ORDER BY column;</code></p>

<h3>Selecting Specific Columns</h3>
<p>Using <code>SELECT *</code> returns every column in the table - convenient but inefficient in large tables. In real applications, always name only the columns you need. This reduces data transfer, improves performance, and makes your query intent clear to other developers.</p>

<h3>Column Aliases with AS</h3>
<p>The <code>AS</code> keyword lets you rename a column in the result set without changing the actual table. This is useful when a column name is too technical, or when you compute a new value and want to give it a readable label. Aliases with spaces must be wrapped in square brackets: <code>[Full Name]</code>.</p>

<h3>The WHERE Clause - Filtering Rows</h3>
<p>WHERE filters rows before they are returned. Only rows that satisfy the condition are included in the result. WHERE supports a rich set of operators:</p>
<ul style="margin:.75rem 0 .75rem 1.5rem;line-height:2">
  <li><code>=</code> - equal to</li>
  <li><code>!=</code> or <code>&lt;&gt;</code> - not equal to</li>
  <li><code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code> - numeric and date comparisons</li>
  <li><code>LIKE</code> - pattern matching (use <code>%</code> as wildcard)</li>
  <li><code>IN (val1, val2)</code> - matches any value in a list</li>
  <li><code>BETWEEN x AND y</code> - range check (inclusive)</li>
  <li><code>IS NULL</code> / <code>IS NOT NULL</code> - check for missing values</li>
  <li><code>AND</code>, <code>OR</code>, <code>NOT</code> - combine multiple conditions</li>
</ul>

<h3>ORDER BY - Sorting Results</h3>
<p>ORDER BY controls the sequence in which rows are returned. By default it sorts in <strong>ascending</strong> (ASC) order. Add <code>DESC</code> for descending. You can sort by multiple columns: <code>ORDER BY LastName ASC, FirstName ASC</code> sorts alphabetically by last name, then first name for ties.</p>

<h3>TOP - Limiting Rows in SQL Server</h3>
<p>SQL Server uses <code>TOP n</code> (placed right after SELECT) to return only the first n rows. Combined with ORDER BY, this is how you find the highest or lowest values: <code>SELECT TOP 5 * FROM Grades ORDER BY Grade ASC</code> returns the five lowest grades.</p>

<h3>DISTINCT - Removing Duplicates</h3>
<p><code>SELECT DISTINCT column</code> removes duplicate values from the result. For example, <code>SELECT DISTINCT Course FROM Students</code> returns each course name only once, no matter how many students are enrolled in it.</p>
    `,
    example: { label: 'Filter and sort', code: `SELECT FirstName, LastName, Course\nFROM Students\nWHERE Course = 'BSIT'\nORDER BY LastName;` },
    extraExamples: [
      { label: 'LIKE, IN, and BETWEEN operators', code: `-- Students whose last name starts with 'S'\nSELECT * FROM Students\nWHERE LastName LIKE 'S%';\n\n-- Students in either BSIT or BSCS\nSELECT * FROM Students\nWHERE Course IN ('BSIT', 'BSCS');\n\n-- Grades between 1.0 and 2.0 (passing)\nSELECT * FROM Grades\nWHERE Grade BETWEEN 1.0 AND 2.0;` },
      { label: 'Column aliases and DISTINCT', code: `-- Rename columns in the result\nSELECT\n  FirstName AS [First Name],\n  LastName  AS [Last Name],\n  Course    AS Program\nFROM Students;\n\n-- List each unique course once\nSELECT DISTINCT Course FROM Students;` },
      { label: 'TOP 3 students by enrollment date', code: `-- Get the three most recently enrolled students\nSELECT TOP 3\n  FirstName, LastName, EnrollDate\nFROM Students\nORDER BY EnrollDate DESC;` }
    ],
    exercise: { question: 'Get all columns of students enrolled after January 1, 2025.', answer: `SELECT * FROM Students WHERE EnrollDate > '2025-01-01';` }
  },
  {
    id: 'insert', title: 'Inserting Records', level: 'Beginner', duration: '7 min',
    summary: 'Add new rows to your tables with INSERT INTO.',
    topics: ['INSERT INTO','VALUES'],
    intro: 'Use INSERT INTO to add new records. You can insert one row, many rows, or even results from another query.',
    taglish: 'INSERT is like enrolling a new student. You are telling the database: "Hey, add a new person to your list." The format is INSERT INTO (where) VALUES (what). The columns and values must match - just like filling out an enrollment form, everything needs to be complete!',
    body: `
<h3>How INSERT INTO Works</h3>
<p>The <code>INSERT INTO</code> statement adds one or more new rows to a table. Every time a student enrolls, a new product is added, or a transaction is made, the application runs an INSERT statement behind the scenes.</p>
<p>The general syntax is: <code>INSERT INTO table_name (col1, col2, ...) VALUES (val1, val2, ...);</code></p>
<p>The columns and values must correspond by position - the first value goes into the first column, the second into the second, and so on.</p>

<h3>Inserting a Single Row</h3>
<p>The most common form of INSERT adds one row at a time by explicitly naming the columns you are filling. Naming columns is a best practice because it makes the query self-documenting and protects you if the table structure changes later (new columns added won't break your query as long as they have default values).</p>

<h3>Inserting Multiple Rows at Once</h3>
<p>SQL Server allows you to insert multiple rows in a single statement by separating each set of values with a comma. This is more efficient than running individual INSERT statements in a loop because it reduces the number of round-trips to the database.</p>

<h3>Omitting Column Names (Use Carefully)</h3>
<p>If you omit the column list, SQL Server expects you to provide values for <em>every</em> column in the exact order they were defined in the table. This is fragile - if a column is added or reordered later, your INSERT will break or insert data into the wrong columns. Only use this shorthand for quick one-off inserts, never in application code.</p>

<h3>INSERT with SELECT (Copying Data)</h3>
<p>You can populate a table with data from another table using <code>INSERT INTO ... SELECT</code>. Instead of VALUES, you write a SELECT query. This is extremely useful for copying filtered subsets of data, archiving records, or seeding a new table.</p>

<h3>NULL Values and Defaults</h3>
<p>If a column has a DEFAULT constraint or is nullable, you can omit it from the INSERT entirely. SQL Server will automatically use the default value or NULL. If you explicitly want to insert NULL, write <code>NULL</code> as the value.</p>

<h3>Identity Columns (Auto-increment)</h3>
<p>In SQL Server, columns defined as <code>IDENTITY(1,1)</code> auto-generate their value - you do not supply it in the INSERT. This is the standard way to create auto-incrementing primary keys like StudentID. You can check the last generated ID using <code>SELECT SCOPE_IDENTITY();</code></p>
    `,
    example: { label: 'Insert a student', code: `INSERT INTO Students (StudentID, FirstName, LastName, Course, EnrollDate)\nVALUES (1, 'Maria', 'Santos', 'BSIT', '2025-08-15');` },
    extraExamples: [
      { label: 'Insert multiple rows at once', code: `-- Add three students in a single statement\nINSERT INTO Students (StudentID, FirstName, LastName, Course, EnrollDate)\nVALUES\n  (2, 'Juan',  'Dela Cruz', 'BSIT', '2025-08-15'),\n  (3, 'Ana',   'Reyes',     'BSCS', '2025-07-20'),\n  (4, 'Carlo', 'Mendoza',   'BSIT', '2025-08-01');` },
      { label: 'INSERT with SELECT - copy BSIT students to archive', code: `-- Copy all BSIT students into an archive table\nINSERT INTO StudentsArchive (StudentID, FirstName, LastName, Course)\nSELECT StudentID, FirstName, LastName, Course\nFROM Students\nWHERE Course = 'BSIT';` },
      { label: 'IDENTITY column - let SQL Server assign the ID', code: `-- If StudentID is IDENTITY(1,1), omit it entirely\nINSERT INTO Students (FirstName, LastName, Course, EnrollDate)\nVALUES ('Liza', 'Garcia', 'BSCS', '2025-09-01');\n\n-- Check the auto-generated ID\nSELECT SCOPE_IDENTITY() AS NewStudentID;` }
    ],
    exercise: { question: 'Insert two students of your choice into the Students table.', answer: `INSERT INTO Students VALUES\n(2, 'Juan', 'Dela Cruz', 'BSIT', '2025-08-15'),\n(3, 'Ana', 'Reyes', 'BSCS', '2025-08-15');` }
  },
  {
    id: 'update', title: 'Updating Data', level: 'Beginner', duration: '8 min',
    summary: 'Modify existing records safely using UPDATE with WHERE.',
    topics: ['UPDATE','SET','WHERE'],
    intro: 'UPDATE changes data already stored in a table. Always pair it with a WHERE clause - without one, every row will be modified!',
    taglish: 'UPDATE is like editing a student\'s information. For example, they switched courses - BSIT to BSCS. But ALWAYS include a WHERE clause! Without WHERE, you will change every single row in the table - like accidentally setting every student\'s course to "BSCS". Be careful!',
    body: `
<h3>How UPDATE Works</h3>
<p>The <code>UPDATE</code> statement modifies existing data in a table. It is used whenever stored information needs to change - a student switches courses, a grade is corrected, or contact details are refreshed.</p>
<p>The general syntax is: <code>UPDATE table SET col1 = val1, col2 = val2 WHERE condition;</code></p>

<h3>The Golden Rule: Always Use WHERE</h3>
<p>This cannot be overstated. An UPDATE without a WHERE clause will modify <em>every single row</em> in the table. In a database with thousands of records, that is a disaster. Before running any UPDATE, ask yourself: "Do I have a WHERE clause? Does it target only the rows I intend to change?"</p>
<p>A safe habit is to <strong>run a SELECT with the same WHERE clause first</strong> to see exactly which rows will be affected before committing the UPDATE.</p>

<h3>Updating Multiple Columns at Once</h3>
<p>You can update several columns in a single UPDATE statement by separating the assignments with commas inside the SET clause. This is more efficient than running multiple separate UPDATE statements because it touches the affected rows only once.</p>

<h3>Updating with Expressions</h3>
<p>The new value in a SET clause does not have to be a literal - it can be an expression that references the column's current value. For example, you could increment a counter column with <code>SET LoginCount = LoginCount + 1</code>. This is called a <strong>self-referencing update</strong> and is very common in practice.</p>

<h3>Updating Multiple Rows at Once</h3>
<p>When the WHERE clause matches multiple rows, all of them are updated simultaneously. For example, updating every student in a specific course to a new status changes all matching students in a single operation. This is efficient, but again - double-check the WHERE condition first.</p>

<h3>UPDATE with a Subquery</h3>
<p>You can use a subquery inside a SET clause or WHERE clause. For example, you could update a student's grade to match the class average, or update all students who appear in another table. This advanced pattern is powerful but requires careful testing.</p>

<h3>Transactions - Your Safety Net</h3>
<p>In production environments, critical UPDATE operations are wrapped in a <strong>transaction</strong>: <code>BEGIN TRANSACTION</code>, run the UPDATE, check the results, then either <code>COMMIT</code> (save) or <code>ROLLBACK</code> (undo). This gives you a safety net against mistakes. Learn this habit early!</p>
    `,
    example: { label: "Change a student's course", code: `UPDATE Students\nSET Course = 'BSCS'\nWHERE StudentID = 1;` },
    extraExamples: [
      { label: 'Update multiple columns in one statement', code: `-- Correct a student's name AND course at the same time\nUPDATE Students\nSET\n  FirstName = 'Maria Clara',\n  Course    = 'BSIT'\nWHERE StudentID = 3;` },
      { label: 'Self-referencing update (increment a value)', code: `-- Mark all BSIT students as enrolled in 2nd semester\n-- (hypothetical SemesterCount column)\nUPDATE Students\nSET SemesterCount = SemesterCount + 1\nWHERE Course = 'BSIT';` },
      { label: 'Safe UPDATE: SELECT first, then UPDATE', code: `-- Step 1: Preview which rows will be affected\nSELECT * FROM Students\nWHERE Course = 'BSIS';\n\n-- Step 2: Only after confirming, run the UPDATE\nUPDATE Students\nSET Course = 'BSIT'\nWHERE Course = 'BSIS';` }
    ],
    exercise: { question: "Update every BSIT student's course to 'BS Information Technology'.", answer: `UPDATE Students SET Course = 'BS Information Technology' WHERE Course = 'BSIT';` }
  },
  {
    id: 'delete', title: 'Deleting Records', level: 'Beginner', duration: '6 min',
    summary: 'Remove rows you no longer need - carefully.',
    topics: ['DELETE','WHERE'],
    intro: 'DELETE removes rows from a table. Just like UPDATE, always include a WHERE clause unless you really intend to wipe the table.',
    taglish: 'DELETE removes rows from the table - and this is serious. There is no undo button in real databases! So ALWAYS include a WHERE clause. "DELETE FROM Students WHERE StudentID = 3" removes only student number 3. But "DELETE FROM Students" with no WHERE? Every single student is gone. Always be careful!',
    body: `
<h3>How DELETE Works</h3>
<p>The <code>DELETE</code> statement permanently removes rows from a table. Once committed, deleted data is gone unless you have a backup or rolled back a transaction. This makes DELETE one of the most dangerous SQL commands - and one that requires the most care.</p>
<p>The general syntax is: <code>DELETE FROM table_name WHERE condition;</code></p>

<h3>The WHERE Clause - Non-Negotiable</h3>
<p>Just like UPDATE, a DELETE without WHERE deletes every row in the table. The table structure (columns, constraints, indexes) remains, but all data is gone. Always write the WHERE clause before the DELETE keyword - physically write it first, then go back and add DELETE FROM at the top.</p>

<h3>DELETE vs TRUNCATE vs DROP</h3>
<p>Three commands can remove data - it is critical to know the difference:</p>
<ul style="margin:.75rem 0 .75rem 1.5rem;line-height:2">
  <li><strong>DELETE FROM table WHERE condition</strong> - removes specific rows; can be rolled back; triggers fire; slower on large tables</li>
  <li><strong>TRUNCATE TABLE table</strong> - removes ALL rows instantly; cannot be rolled back (in most configurations); faster than DELETE; resets IDENTITY counters</li>
  <li><strong>DROP TABLE table</strong> - removes the entire table (structure + data); cannot be undone</li>
</ul>
<p>Use DELETE when you need to remove specific rows. Use TRUNCATE only when you intentionally want to empty an entire table. Never use DROP unless you are certain you no longer need the table at all.</p>

<h3>Deleting with Conditions</h3>
<p>WHERE conditions for DELETE work exactly like WHERE in SELECT. You can use <code>AND</code>, <code>OR</code>, <code>IN</code>, <code>LIKE</code>, <code>IS NULL</code>, and comparison operators. The more specific your condition, the safer your DELETE.</p>

<h3>Foreign Key Constraints and DELETE</h3>
<p>If a table has a FOREIGN KEY constraint, you cannot delete a parent row that is still referenced by child rows. For example, you cannot delete a student who still has grades in the Grades table. You must first delete the child records, or configure the foreign key with <code>ON DELETE CASCADE</code> to automatically delete related rows.</p>

<h3>Safe Deletion Pattern</h3>
<p>Professional developers follow this checklist before any DELETE: (1) Run a SELECT with the same WHERE to preview what will be deleted. (2) Verify the row count matches expectations. (3) If in production, wrap it in a BEGIN TRANSACTION so you can ROLLBACK if something looks wrong. (4) COMMIT only after confirming the results are correct.</p>
    `,
    example: { label: 'Delete one student', code: `DELETE FROM Students\nWHERE StudentID = 3;` },
    extraExamples: [
      { label: 'Delete with multiple conditions', code: `-- Delete BSCS students who enrolled before 2025\nDELETE FROM Students\nWHERE Course = 'BSCS'\n  AND EnrollDate < '2025-01-01';` },
      { label: 'DELETE vs TRUNCATE side by side', code: `-- DELETE: removes specific rows (safe, logged, slow)\nDELETE FROM Grades\nWHERE Semester = '1st' AND Grade > 3.0;\n\n-- TRUNCATE: wipes the ENTIRE table instantly\n-- Only use this when you are 100% sure!\nTRUNCATE TABLE TempImports;` },
      { label: 'Safe deletion with a transaction', code: `BEGIN TRANSACTION;\n\n-- Preview first\nSELECT * FROM Students\nWHERE Course IS NULL;\n\n-- If the preview looks right, delete\nDELETE FROM Students\nWHERE Course IS NULL;\n\n-- Confirm the count, then commit\n-- ROLLBACK; -- ← uncomment to undo if needed\nCOMMIT;` }
    ],
    exercise: { question: 'Delete every student whose course is NULL.', answer: `DELETE FROM Students WHERE Course IS NULL;` }
  },
  {
    id: 'joins', title: 'Combining Tables with JOINs', level: 'Intermediate', duration: '15 min',
    summary: 'Bring related data together from multiple tables.',
    topics: ['INNER JOIN','LEFT JOIN','Foreign keys'],
    intro: 'Real databases split information across many tables. JOINs let you combine those tables on a shared key - usually a foreign key.',
    taglish: 'JOIN is like combining two lists. Imagine you have a list of students and another list of courses. To find out which course each student is enrolled in, you JOIN them using a shared key - the CourseID. INNER JOIN = both sides must match. LEFT JOIN = get everything on the left even if there is no match on the right.',
    body: `
<h3>Why Do We Need JOINs?</h3>
<p>Good database design splits information across multiple tables to avoid repetition - a principle called <strong>normalization</strong>. Instead of storing the full course name inside every student row, you store a short CourseID and keep the full name in a separate Courses table.</p>
<p>The trade-off is that to see a student's full course name, you need to <em>combine</em> (join) the two tables. That is exactly what JOIN does - it links rows from different tables based on a matching column.</p>

<h3>The Concept of Keys in JOINs</h3>
<p>JOINs work by matching values between columns:</p>
<ul style="margin:.75rem 0 .75rem 1.5rem;line-height:2">
  <li>The <strong>Primary Key</strong> in one table (e.g., Courses.CourseID) identifies each unique row</li>
  <li>The <strong>Foreign Key</strong> in another table (e.g., Students.Course) stores a reference to that primary key</li>
  <li>The JOIN condition is written as <code>ON left_table.foreign_key = right_table.primary_key</code></li>
</ul>

<h3>INNER JOIN - Only Matching Rows</h3>
<p>INNER JOIN returns only rows where the join condition is true in <em>both</em> tables. If a student has a CourseID that does not exist in the Courses table, that student is excluded from the result. If a course has no students, it is also excluded.</p>
<p>INNER JOIN is the most common type of JOIN and is what most people mean when they just say "JOIN".</p>

<h3>LEFT JOIN (LEFT OUTER JOIN) - All Left Rows</h3>
<p>LEFT JOIN returns every row from the left (first) table, plus matching rows from the right table. If there is no match in the right table, the right-side columns appear as NULL. This is useful when you want to see all records even if some have no related data.</p>
<p>Example use case: list all students, and show their grade if they have one, or NULL if they do not.</p>

<h3>RIGHT JOIN - All Right Rows</h3>
<p>RIGHT JOIN is the mirror image of LEFT JOIN - it keeps all rows from the right table. In practice, most developers rewrite RIGHT JOINs as LEFT JOINs by swapping the table order, since LEFT JOINs are easier to read left-to-right.</p>

<h3>Table Aliases in JOINs</h3>
<p>When writing JOINs, you almost always assign short aliases to table names (<code>Students s</code>, <code>Courses c</code>). These aliases are then used to qualify column names - <code>s.FirstName</code>, <code>c.CourseName</code> - which is essential when both tables have a column with the same name (like both having an <code>ID</code> column).</p>

<h3>Joining More Than Two Tables</h3>
<p>You can chain multiple JOINs to combine three or more tables. Each JOIN adds another table to the result. For example: Students JOIN Grades JOIN Courses would let you show each student's full name, the subject they took, their grade, and the full course name - all in one query.</p>
    `,
    example: { label: 'Students with their courses', code: `SELECT s.FirstName, s.LastName, c.CourseName\nFROM Students s\nINNER JOIN Courses c ON s.Course = c.CourseID;` },
    extraExamples: [
      { label: 'LEFT JOIN - show all courses even with no students', code: `-- LEFT JOIN: all courses appear, even if no students enrolled\nSELECT\n  c.CourseName,\n  s.FirstName,\n  s.LastName\nFROM Courses c\nLEFT JOIN Students s ON c.CourseID = s.Course\nORDER BY c.CourseName;` },
      { label: 'Three-table JOIN - student, grade, and course', code: `-- Combine Students, Grades, and Courses in one query\nSELECT\n  s.FirstName,\n  s.LastName,\n  g.Subject,\n  g.Grade,\n  c.CourseName\nFROM Students s\nINNER JOIN Grades g  ON s.StudentID = g.StudentID\nINNER JOIN Courses c ON s.Course    = c.CourseID\nORDER BY s.LastName;` },
      { label: 'Find students with NO grades (NULL check after LEFT JOIN)', code: `-- Students who have not received any grade yet\nSELECT s.FirstName, s.LastName\nFROM Students s\nLEFT JOIN Grades g ON s.StudentID = g.StudentID\nWHERE g.GradeID IS NULL;` }
    ],
    exercise: { question: 'List every course and the students enrolled in it (include courses with no students).', answer: `SELECT c.CourseName, s.FirstName, s.LastName\nFROM Courses c\nLEFT JOIN Students s ON c.CourseID = s.Course;` }
  },
  {
    id: 'aggregations', title: 'Aggregating Data', level: 'Intermediate', duration: '12 min',
    summary: 'Summarize information with COUNT, SUM, AVG, GROUP BY.',
    topics: ['GROUP BY','Aggregate functions','HAVING'],
    intro: 'Aggregate functions condense many rows into a single value - perfect for reports, dashboards, and analytics.',
    taglish: 'Aggregation is like making a summary report. "How many students are in each course?" - COUNT. "What is the average grade?" - AVG. GROUP BY is used to group them before counting or averaging. Then HAVING is like WHERE but for groups - "Show only courses with more than 10 students."',
    example: { label: 'Students per course', code: `SELECT Course, COUNT(*) AS Total\nFROM Students\nGROUP BY Course\nORDER BY Total DESC;` },
    exercise: { question: 'Find courses with more than 10 students.', answer: `SELECT Course, COUNT(*) AS Total\nFROM Students\nGROUP BY Course\nHAVING COUNT(*) > 10;` },
    body: `
<h3>What Are Aggregate Functions?</h3>
<p>Aggregate functions perform a calculation on a set of rows and return a single summary value. They are essential for building reports, dashboards, and analytics queries.</p>
<p>The five core aggregate functions in Microsoft SQL Server are:</p>
<ul style="margin:.75rem 0 .75rem 1.5rem;line-height:2">
  <li><code>COUNT()</code> - counts the number of rows</li>
  <li><code>SUM()</code> - adds up numeric values</li>
  <li><code>AVG()</code> - calculates the average of numeric values</li>
  <li><code>MIN()</code> - returns the lowest value in the set</li>
  <li><code>MAX()</code> - returns the highest value in the set</li>
</ul>
<h3>GROUP BY - The Heart of Aggregation</h3>
<p>Aggregate functions become truly powerful when combined with <code>GROUP BY</code>. Instead of returning one value for the entire table, <code>GROUP BY</code> divides rows into groups and applies the aggregate to each group separately.</p>
<p>The syntax pattern is always the same: <code>SELECT group_column, AGGREGATE(column) FROM table GROUP BY group_column</code>.</p>
<h3>Using COUNT()</h3>
<p><code>COUNT(*)</code> counts every row in a group, including rows with NULL values. <code>COUNT(column_name)</code> counts only rows where that column is NOT NULL - a subtle but important difference.</p>
<h3>Using SUM() and AVG()</h3>
<p><code>SUM()</code> and <code>AVG()</code> work only on numeric columns. If a column contains NULL, those rows are excluded from the calculation automatically.</p>
<h3>Filtering Groups with HAVING</h3>
<p>The <code>WHERE</code> clause filters individual rows before grouping. But what if you want to filter groups after aggregation? That is what <code>HAVING</code> is for. Think of <code>HAVING</code> as a <code>WHERE</code> clause that runs after <code>GROUP BY</code>.</p>
<p>Rule of thumb: <code>WHERE</code> filters rows, <code>HAVING</code> filters groups.</p>
<h3>Execution Order</h3>
<p>SQL executes clauses in this order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. Understanding this order explains why you cannot use a column alias from SELECT inside a HAVING clause.</p>
<h3>Multiple Aggregates in One Query</h3>
<p>You can compute several aggregates at once - for example, counting students per course while also computing the average grade. Each aggregate appears as a separate column in your SELECT list.</p>
    `
  }
];

const lessonsContainer = document.getElementById('lessons-grid');
if (lessonsContainer) {
  let activeLevel = 'all';
  let activeTopic = 'all';
  let searchQuery = '';

  function renderLessonsGrid() {
    const searchEl = document.getElementById('lesson-search');
    searchQuery = searchEl ? searchEl.value.trim().toLowerCase() : '';

    const filtered = LESSONS.filter((l, i) => {
      const levelOk = activeLevel === 'all' || l.level === activeLevel;
      const topicOk = activeTopic === 'all' || l.topics.some(t => t.toLowerCase().includes(activeTopic.toLowerCase()));
      const searchOk = !searchQuery ||
        l.title.toLowerCase().includes(searchQuery) ||
        l.summary.toLowerCase().includes(searchQuery) ||
        l.topics.some(t => t.toLowerCase().includes(searchQuery));
      return levelOk && topicOk && searchOk;
    });

    const countEl = document.getElementById('lessons-count');
    if (countEl) {
      countEl.textContent = filtered.length === LESSONS.length
        ? `Showing all ${LESSONS.length} lessons`
        : `Showing ${filtered.length} of ${LESSONS.length} lessons`;
    }

    lessonsContainer.innerHTML = filtered.length === 0
      ? '<div class="search-no-results">No lessons match your search or filter. Try a different keyword.</div>'
      : filtered.map((l) => {
          const i = LESSONS.indexOf(l);
          const done = getLessonProgress(l.id);
          return `
          <article class="card lesson-card reveal" data-id="${l.id}">
            <div class="meta">
              <span class="chip ${l.level === 'Intermediate' ? 'intermediate' : ''}">${l.level}</span>
              <span style="font-size:.8rem;color:var(--muted)">Lesson ${i + 1} &bull; ${l.duration}</span>
              ${done ? '<span class="chip" style="background:#d4f5e2;color:#1a6640">Done</span>' : ''}
            </div>
            <h3>${l.title}</h3>
            <p>${l.summary}</p>
            <div style="display:flex;flex-wrap:wrap;gap:.3rem;margin:.75rem 0">
              ${l.topics.map(t => `<span style="font-size:.72rem;padding:.2rem .5rem;border-radius:4px;background:var(--overlay);border:1px solid var(--border);color:var(--muted)">${t}</span>`).join('')}
            </div>
            <button class="open-btn" data-open="${l.id}" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600;">Open lesson 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            </button>
          </article>`;
        }).join('');

    if (window.__sqlRevealObserve) window.__sqlRevealObserve();
  }

  renderLessonsGrid();

  
  const searchEl = document.getElementById('lesson-search');
  if (searchEl) searchEl.addEventListener('input', renderLessonsGrid);

  
  document.querySelectorAll('#level-filter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#level-filter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLevel = btn.dataset.level;
      renderLessonsGrid();
    });
  });

  
  document.querySelectorAll('#topic-filter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#topic-filter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTopic = btn.dataset.topic;
      renderLessonsGrid();
    });
  });

  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    if (open) openLesson(open.dataset.open);
    if (e.target.matches('.lesson-modal') || e.target.closest('[data-close-modal]')) {
      document.querySelector('.lesson-modal')?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

function openLesson(id) {
  const l = LESSONS.find((x) => x.id === id);
  if (!l) return;
  const prefs = getPrefs();
  markLessonDone(id);
  let modal = document.querySelector('.lesson-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'lesson-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="panel" role="dialog" aria-modal="true">
      <button class="close" data-close-modal aria-label="Close">x</button>
      <span class="chip ${l.level === 'Intermediate' ? 'intermediate' : ''}">${l.level} &bull; ${l.duration}</span>
      <h2 class="mt-2">${l.title}</h2>
      <div class="topics">${l.topics.map((t) => `<span class="chip" style="background:var(--bg);border:1px solid var(--border);color:var(--muted);font-weight:500">${t}</span>`).join('')}</div>
      <p class="intro">${l.intro}</p>
      ${l.taglish && prefs.taglish ? `
        <div class="taglish-box">
          <div class="taglish-label">Explanation</div>
          <p>${l.taglish}</p>
        </div>` : ''}
      ${l.body ? `<div class="lesson-body" style="margin-top:1.5rem">${l.body}</div>` : ''}
      ${prefs.videos ? makeVideoSection(l.id) : ''}
      ${makeCodeBlock(l.example.code, l.example.label)}
      ${l.extraExamples ? l.extraExamples.map(ex => makeCodeBlock(ex.code, ex.label)).join('') : ''}
      ${l.exercise ? `
        <h4 style="margin-top:1.5rem">Try it yourself</h4>
        <div class="exercise">
          <p>${l.exercise.question}</p>
          <details>
            <summary>Show answer</summary>
            ${makeCodeBlock(l.exercise.answer, 'Solution')}
          </details>
        </div>` : ''}
      <div style="margin-top:1.5rem;display:flex;gap:.75rem;flex-wrap:wrap;">
        <a href="editor.html" class="btn btn-primary btn-sm" style="font-size:.85rem">Try in SQL Editor →</a>
        <a href="practice.html" class="btn btn-outline btn-sm" style="font-size:.85rem">Practice Exercises</a>
      </div>
    </div>`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.lesson-modal') || e.target.closest('[data-close-modal]')) {
    document.body.style.overflow = '';
  }
}, true);

document.querySelectorAll('[data-code-block]').forEach((el) => {
  const code = el.dataset.code ? decodeURIComponent(el.dataset.code) : el.textContent;
  const label = el.dataset.label || '';
  el.innerHTML = makeCodeBlock(code, label);
});

const contactForm = document.getElementById('contact-form');
if (contactForm) contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name =
    document.getElementById('contact-name')?.value.trim() ||
    document.querySelector('[name="name"]')?.value.trim() ||
    '';

  const email =
    document.getElementById('contact-email')?.value.trim() ||
    document.querySelector('[name="email"]')?.value.trim() ||
    '';

  const subject =
    document.getElementById('contact-subject')?.value.trim() ||
    document.querySelector('[name="subject"]')?.value.trim() ||
    'General Inquiry';

  const message =
    document.getElementById('contact-message')?.value.trim() ||
    document.querySelector('[name="message"]')?.value.trim() ||
    '';

  if (!name || !email || !message) {
    alert('Please complete the required fields.');
    return;
  }

  const res = await supabaseSaveContactMessage(name, email, subject, message);

  if (res.ok) {
    const successEl = document.getElementById('contact-success');
    if (successEl) successEl.style.display = 'block';
    contactForm.reset();
  } else {
    alert(res.msg || 'Failed to send message.');
  }
});

document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

const editorPage = document.getElementById('sql-editor');
if (editorPage) initEditor();

function initEditor() {
  
  const DB = {
    Students: [
      { StudentID: 1, FirstName: 'Maria', LastName: 'Santos', Course: 'BSIT', EnrollDate: '2025-08-15' },
      { StudentID: 2, FirstName: 'Juan', LastName: 'Dela Cruz', Course: 'BSIT', EnrollDate: '2025-08-15' },
      { StudentID: 3, FirstName: 'Ana', LastName: 'Reyes', Course: 'BSCS', EnrollDate: '2025-07-20' },
      { StudentID: 4, FirstName: 'Carlo', LastName: 'Mendoza', Course: 'BSIT', EnrollDate: '2025-08-01' },
      { StudentID: 5, FirstName: 'Liza', LastName: 'Garcia', Course: 'BSCS', EnrollDate: '2025-09-01' },
      { StudentID: 6, FirstName: 'Ramon', LastName: 'Cruz', Course: 'BSIS', EnrollDate: '2025-08-10' },
      { StudentID: 7, FirstName: 'Joy', LastName: 'Villanueva', Course: 'BSIT', EnrollDate: '2025-07-30' },
      { StudentID: 8, FirstName: 'Mark', LastName: 'Aguilar', Course: 'BSCS', EnrollDate: '2025-08-22' },
    ],
    Courses: [
      { CourseID: 'BSIT', CourseName: 'BS Information Technology', Units: 148 },
      { CourseID: 'BSCS', CourseName: 'BS Computer Science', Units: 150 },
      { CourseID: 'BSIS', CourseName: 'BS Information Systems', Units: 145 },
      { CourseID: 'ACT', CourseName: 'Associate in Computer Technology', Units: 80 },
    ],
    Grades: [
      { GradeID: 1, StudentID: 1, Subject: 'Database Management', Grade: 1.5, Semester: '1st' },
      { GradeID: 2, StudentID: 1, Subject: 'Web Development', Grade: 1.75, Semester: '1st' },
      { GradeID: 3, StudentID: 2, Subject: 'Database Management', Grade: 2.0, Semester: '1st' },
      { GradeID: 4, StudentID: 3, Subject: 'Database Management', Grade: 1.25, Semester: '1st' },
      { GradeID: 5, StudentID: 4, Subject: 'Web Development', Grade: 2.25, Semester: '1st' },
      { GradeID: 6, StudentID: 5, Subject: 'Database Management', Grade: 1.0, Semester: '1st' },
    ]
  };

  
  function executeSQL(sql) {
    const q = sql.trim().replace(/\s+/g, ' ');
    const upper = q.toUpperCase();

    
    if (upper.startsWith('SELECT')) return execSelect(q, DB);

    
    if (upper.startsWith('INSERT')) return execInsert(q, DB);

    
    if (upper.startsWith('UPDATE')) return execUpdate(q, DB);

    
    if (upper.startsWith('DELETE')) return execDelete(q, DB);

    
    if (upper.startsWith('CREATE TABLE')) return { msg: '✓ Table created (simulated in-memory).' };

    
    if (upper.startsWith('DROP TABLE')) {
      const m = q.match(/DROP TABLE\s+(\w+)/i);
      if (m && DB[m[1]]) { delete DB[m[1]]; return { msg: `✓ Table ${m[1]} dropped.` }; }
    }

    
    if (upper === 'SHOW TABLES' || upper === 'SHOW TABLES;') {
      return { rows: Object.keys(DB).map(t => ({ TableName: t })) };
    }

    throw new Error(`Unsupported statement: ${q.split(' ')[0].toUpperCase()}. Supported: SELECT, INSERT, UPDATE, DELETE, SHOW TABLES`);
  }

  function execSelect(q, db) {
    
    const litMatch = q.match(/^SELECT\s+'([^']*)'\s+AS\s+(\w+)\s*;?$/i);
    if (litMatch) return { rows: [{ [litMatch[2]]: litMatch[1] }] };

    // FROM <table>
    const fromMatch = q.match(/FROM\s+(\w+)/i);
    if (!fromMatch) throw new Error('Missing FROM clause');
    const tableName = fromMatch[1];
    if (!db[tableName]) throw new Error(`Table '${tableName}' does not exist. Available: ${Object.keys(db).join(', ')}`);

    let rows = JSON.parse(JSON.stringify(db[tableName]));

    // JOIN
    const joinMatch = q.match(/(INNER|LEFT|RIGHT)?\s*JOIN\s+(\w+)\s+ON\s+(\w+\.\w+)\s*=\s*(\w+\.\w+)/i);
    if (joinMatch) {
      const joinType = (joinMatch[1] || 'INNER').toUpperCase();
      const joinTable = joinMatch[2];
      if (!db[joinTable]) throw new Error(`Join table '${joinTable}' does not exist`);
      const [la, lc] = joinMatch[3].split('.');
      const [ra, rc] = joinMatch[4].split('.');
      const joinRows = db[joinTable];
      const joined = [];
      rows.forEach(r => {
        const leftVal = r[lc] ?? r[la === tableName ? lc : rc];
        const match = joinRows.find(j => j[rc] === leftVal || j[lc] === leftVal);
        if (match) {
          joined.push({ ...r, ...match });
        } else if (joinType === 'LEFT') {
          const nullRow = {};
          Object.keys(joinRows[0] || {}).forEach(k => nullRow[k] = null);
          joined.push({ ...r, ...nullRow });
        }
      });
      rows = joined;
    }

    // WHERE
    const whereMatch = q.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+HAVING|\s*;?\s*$)/i);
    if (whereMatch) {
      const cond = whereMatch[1].trim();
      rows = rows.filter(r => evalCondition(cond, r));
    }

    // GROUP BY + aggregates
    const groupMatch = q.match(/GROUP\s+BY\s+(\w+)/i);
    if (groupMatch) {
      const groupCol = groupMatch[1];
      const groups = {};
      rows.forEach(r => {
        const key = r[groupCol];
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });
      rows = Object.entries(groups).map(([key, grpRows]) => {
        const out = { [groupCol]: key };
        // resolve aggregates from SELECT clause
        const selStr = q.match(/SELECT\s+(.*?)\s+FROM/i)?.[1] || '*';
        const aggMatches = [...selStr.matchAll(/(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*\*?\s*(\w+)?\s*\)\s*(?:AS\s+(\w+))?/gi)];
        aggMatches.forEach(m => {
          const fn = m[1].toUpperCase();
          const col = m[2];
          const alias = m[3] || `${fn}(${col || '*'})`;
          if (fn === 'COUNT') out[alias] = grpRows.length;
          else if (fn === 'SUM') out[alias] = grpRows.reduce((s, r) => s + (Number(r[col]) || 0), 0);
          else if (fn === 'AVG') out[alias] = +(grpRows.reduce((s, r) => s + (Number(r[col]) || 0), 0) / grpRows.length).toFixed(2);
          else if (fn === 'MIN') out[alias] = Math.min(...grpRows.map(r => Number(r[col])));
          else if (fn === 'MAX') out[alias] = Math.max(...grpRows.map(r => Number(r[col])));
        });
        return out;
      });
    }

    // HAVING
    const havingMatch = q.match(/HAVING\s+(.+?)(?:\s+ORDER\s+BY|\s*;?\s*$)/i);
    if (havingMatch) {
      const cond = havingMatch[1].trim();
      rows = rows.filter(r => evalCondition(cond, r));
    }

    // ORDER BY
    const orderMatch = q.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i);
    if (orderMatch) {
      const col = orderMatch[1];
      const dir = (orderMatch[2] || 'ASC').toUpperCase();
      rows.sort((a, b) => {
        const av = a[col], bv = b[col];
        if (av == null) return 1; if (bv == null) return -1;
        return dir === 'ASC' ? (av > bv ? 1 : av < bv ? -1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0);
      });
    }

    // SELECT columns
    const selStr = q.match(/SELECT\s+(.*?)\s+FROM/i)?.[1]?.trim();
    if (selStr && selStr !== '*') {
      const cols = selStr.split(',').map(s => s.trim());
      rows = rows.map(r => {
        const out = {};
        cols.forEach(c => {
          const aliasM = c.match(/(\w+(?:\(.*?\))?)\s+AS\s+(\w+)/i);
          if (aliasM) out[aliasM[2]] = r[aliasM[2]] ?? r[aliasM[1]] ?? null;
          else out[c] = r[c] ?? null;
        });
        return out;
      });
    }

    return { rows };
  }

  function execInsert(q, db) {
    const m = q.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (!m) throw new Error('Invalid INSERT syntax. Use: INSERT INTO table (cols) VALUES (vals)');
    const table = m[1];
    if (!db[table]) throw new Error(`Table '${table}' does not exist`);
    const cols = m[2].split(',').map(s => s.trim());
    const vals = m[3].split(',').map(s => {
      const v = s.trim().replace(/^'|'$/g, '');
      return isNaN(v) || v === '' ? v : Number(v);
    });
    const row = {};
    cols.forEach((c, i) => row[c] = vals[i]);
    db[table].push(row);
    return { msg: `✓ 1 row inserted into ${table}.` };
  }

  function execUpdate(q, db) {
    const m = q.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?(?:\s*;?\s*)$/i);
    if (!m) throw new Error('Invalid UPDATE syntax');
    const table = m[1];
    if (!db[table]) throw new Error(`Table '${table}' does not exist`);
    const setParts = m[2].split(',').map(s => {
      const [k, v] = s.split('=').map(x => x.trim());
      return { k, v: v.replace(/^'|'$/g, '') };
    });
    let count = 0;
    db[table].forEach(row => {
      if (!m[3] || evalCondition(m[3], row)) {
        setParts.forEach(({ k, v }) => row[k] = isNaN(v) ? v : Number(v));
        count++;
      }
    });
    return { msg: `✓ ${count} row(s) updated in ${table}.` };
  }

  function execDelete(q, db) {
    const m = q.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s*;?\s*)$/i);
    if (!m) throw new Error('Invalid DELETE syntax');
    const table = m[1];
    if (!db[table]) throw new Error(`Table '${table}' does not exist`);
    const before = db[table].length;
    if (m[2]) db[table] = db[table].filter(row => !evalCondition(m[2], row));
    else db[table] = [];
    return { msg: `✓ ${before - db[table].length} row(s) deleted from ${table}.` };
  }

  function evalCondition(cond, row) {
    // Handle IS NULL / IS NOT NULL
    const isNullM = cond.match(/(\w+)\s+IS\s+(NOT\s+)?NULL/i);
    if (isNullM) {
      const val = row[isNullM[1]];
      return isNullM[2] ? val != null : val == null;
    }
    // Handle AND / OR (simple, left-to-right)
    const andParts = cond.split(/\s+AND\s+/i);
    if (andParts.length > 1) return andParts.every(p => evalCondition(p.trim(), row));
    const orParts = cond.split(/\s+OR\s+/i);
    if (orParts.length > 1) return orParts.some(p => evalCondition(p.trim(), row));

    // Comparison operators
    const ops = ['>=', '<=', '!=', '<>', '>', '<', '='];
    for (const op of ops) {
      const idx = cond.indexOf(op);
      if (idx === -1) continue;
      const left = cond.slice(0, idx).trim();
      const right = cond.slice(idx + op.length).trim().replace(/^'|'$/g, '');
      const lv = row[left];
      const rv = isNaN(right) || right === '' ? right : Number(right);
      if (op === '=' || op === '==') return String(lv) === String(rv) || lv == rv;
      if (op === '!=' || op === '<>') return lv != rv;
      if (op === '>') return lv > rv;
      if (op === '<') return lv < rv;
      if (op === '>=') return lv >= rv;
      if (op === '<=') return lv <= rv;
    }
    return true;
  }

  // UI
  const runBtn = document.getElementById('run-btn');
  const clearBtn = document.getElementById('clear-btn');
  const resultsEl = document.getElementById('results-content');
  const metaEl = document.getElementById('results-meta');

  if (runBtn) {
    runBtn.addEventListener('click', runQuery);
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => { editorPage.value = ''; editorPage.focus(); });
  }
  editorPage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runQuery(); }
    if (e.key === 'Tab') { e.preventDefault(); const s = editorPage.selectionStart; const end = editorPage.selectionEnd; editorPage.value = editorPage.value.substring(0, s) + '  ' + editorPage.value.substring(end); editorPage.selectionStart = editorPage.selectionEnd = s + 2; }
  });

  function runQuery() {
    const sql = editorPage.value.trim();
    if (!sql) return;
    try {
      const start = performance.now();
      const result = executeSQL(sql);
      const elapsed = (performance.now() - start).toFixed(1);
      renderResult(result, elapsed);
    } catch (err) {
      renderError(err.message, sql);
    }
  }

  function renderResult(result, elapsed) {
    if (result.msg) {
      metaEl.textContent = '';
      resultsEl.innerHTML = `<div class="results-empty" style="color:var(--primary);font-weight:600">${result.msg}</div>`;
      return;
    }
    const rows = result.rows || [];
    if (rows.length === 0) {
      metaEl.textContent = '0 rows';
      resultsEl.innerHTML = '<div class="results-empty">No results returned.</div>';
      return;
    }
    const cols = Object.keys(rows[0]);
    metaEl.textContent = `${rows.length} row${rows.length !== 1 ? 's' : ''} · ${elapsed}ms`;
    const thead = `<tr>${cols.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`;
    const tbody = rows.map(r => `<tr>${cols.map(c => `<td>${r[c] == null ? '<span style="color:var(--muted);font-style:italic">NULL</span>' : escapeHtml(String(r[c]))}</td>`).join('')}</tr>`).join('');
    resultsEl.innerHTML = `<table class="results-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  }

  function getSQLSuggestion(sql, errorMsg) {
    const raw = sql.trim();
    const up  = raw.toUpperCase().replace(/\s+/g, ' ');
    const suggestions = [];

    // ── Typo detection: common keyword misspellings ─────────────────
    const TYPOS = [
      [/\bSELCT\b/i,    'SELECT',   'Did you mean SELECT?'],
      [/\bSELECT\b.*\bFROM\b/i, null, null], // valid, skip
      [/\bFOM\b/i,      'FROM',     'Did you mean FROM?'],
      [/\bFROm\b(?!.*FROM)/i, null, null],
      [/\bWERE\b/i,     'WHERE',    'Did you mean WHERE? (not WERE)'],
      [/\bWHERE\b.*\bWHERE\b/i, null, 'You have two WHERE clauses — use AND to combine conditions instead.'],
      [/\bINSERT\s+(?!INTO)/i, 'INSERT INTO', 'Missing INTO — the correct syntax is INSERT INTO tableName.'],
      [/\bINSERT\s+IN\b/i,     'INSERT INTO', 'Did you mean INSERT INTO? (not INSERT IN)'],
      [/\bDELETE\s+\w+\s+WHERE/i, null, 'DELETE syntax should be: DELETE FROM tableName WHERE …'],
      [/\bUPDAT\b/i,    'UPDATE',   'Did you mean UPDATE?'],
      [/\bDELETE\s+FROM\s+\w+\s*;?$/i, null, '⚠ No WHERE clause — this will delete ALL rows! Add a WHERE condition to target specific rows.'],
      [/\bUPDATE\s+\w+\s+SET\b(?!.*WHERE)/i, null, '⚠ No WHERE clause — this will update ALL rows! Add a WHERE condition to be safe.'],
      [/\bSELECT\s+\*\s+\w+/i, null, 'Missing FROM — try: SELECT * FROM tableName'],
      [/\bORDER\s+(?!BY)/i, 'ORDER BY', 'Did you mean ORDER BY? (not just ORDER)'],
      [/\bGROUP\s+(?!BY)/i, 'GROUP BY', 'Did you mean GROUP BY? (not just GROUP)'],
      [/\bINNER\s+(?!JOIN)/i, 'INNER JOIN', 'Did you mean INNER JOIN?'],
      [/\bLEFT\s+(?!JOIN)/i,  'LEFT JOIN',  'Did you mean LEFT JOIN?'],
      [/\bJOIN\b(?!.*\bON\b)/i, null, 'JOIN is missing an ON clause — try: JOIN tableName ON table1.col = table2.col'],
      [/\bHAVING\b(?!.*\bGROUP\s+BY\b)/i, null, 'HAVING is used after GROUP BY — make sure you have a GROUP BY clause first.'],
      [/\bCOUNT\s*\(\s*\)\s*/i, null, 'COUNT() needs an argument — use COUNT(*) to count all rows, or COUNT(columnName).'],
      [/SELCT|SLECT|SELECCT|SEELCT/i, 'SELECT', 'Looks like a typo — did you mean SELECT?'],
      [/WHER\b/i, 'WHERE', 'Typo detected — did you mean WHERE?'],
      [/VALES\b|VALUSE\b/i, 'VALUES', 'Did you mean VALUES?'],
      [/INSER\b/i, 'INSERT', 'Did you mean INSERT INTO?'],
    ];

    for (const [pattern, , hint] of TYPOS) {
      if (hint && pattern.test(raw)) {
        suggestions.push(hint);
      }
    }

    // ── Missing FROM clause ─────────────────────────────────────────
    if (/Missing FROM clause/i.test(errorMsg)) {
      const colMatch = raw.match(/SELECT\s+.+/i);
      suggestions.push('You\'re missing a FROM clause. Try: SELECT … FROM tableName');
    }

    
    const noTableMatch = errorMsg.match(/Table '(\w+)' does not exist/i);
    if (noTableMatch) {
      const tried = noTableMatch[1];
      const available = ['Students', 'Courses', 'Grades'];
      
      const closest = available.reduce((best, name) => {
        const dist = fuzzyDist(tried.toLowerCase(), name.toLowerCase());
        return dist < best.dist ? { name, dist } : best;
      }, { name: null, dist: Infinity });
      if (closest.dist <= 3) {
        suggestions.push(`Did you mean the "${closest.name}" table? Available tables: ${available.join(', ')}.`);
      } else {
        suggestions.push(`"${tried}" is not a valid table. Available tables: ${available.join(', ')}.`);
      }
    }

    
    if (/Unsupported statement/i.test(errorMsg)) {
      const first = raw.split(' ')[0].toUpperCase();
      const supported = { 'GET': 'SELECT', 'FETCH': 'SELECT', 'REMOVE': 'DELETE', 'MODIFY': 'UPDATE', 'ADD': 'INSERT INTO', 'APPEND': 'INSERT INTO', 'SHOW': 'SHOW TABLES' };
      if (supported[first]) {
        suggestions.push(`"${first}" is not a SQL command — did you mean ${supported[first]}?`);
      } else {
        suggestions.push(`"${first}" is not supported. Supported commands: SELECT, INSERT INTO, UPDATE, DELETE, SHOW TABLES.`);
      }
    }

    
    if (/Invalid INSERT/i.test(errorMsg)) {
      if (!/INTO/i.test(raw))        suggestions.push('Missing INTO — correct syntax: INSERT INTO tableName (col1, col2) VALUES (val1, val2)');
      else if (!/VALUES/i.test(raw)) suggestions.push('Missing VALUES keyword — correct syntax: INSERT INTO tableName (columns) VALUES (values)');
      else if (!/\(/i.test(raw))     suggestions.push('Missing parentheses — wrap your column list and values in parentheses: (col1, col2)');
    }

    
    if (/Invalid UPDATE/i.test(errorMsg)) {
      if (!/SET/i.test(raw))   suggestions.push('Missing SET keyword — correct syntax: UPDATE tableName SET column = value WHERE condition');
      if (!/WHERE/i.test(raw)) suggestions.push('⚠ No WHERE clause — without it, ALL rows will be updated!');
    }

    
    if (/Invalid DELETE/i.test(errorMsg)) {
      if (!/FROM/i.test(raw))  suggestions.push('Missing FROM — correct syntax: DELETE FROM tableName WHERE condition');
    }

    
    if (/[""]/.test(raw)) {
      suggestions.push('SQL strings use single quotes, not double quotes — try \'BSIT\' instead of "BSIT".');
    }
    
    const quoteCount = (raw.match(/'/g) || []).length;
    if (quoteCount % 2 !== 0) {
      suggestions.push('You have an unmatched single quote (\') in your query — check that all string values are properly closed.');
    }

    
    if (/JOIN/i.test(raw) && !/\bON\b/i.test(raw)) {
      suggestions.push('Your JOIN is missing an ON clause — specify how the tables are linked: JOIN tableName ON table1.col = table2.col');
    }

    
    return [...new Set(suggestions)];
  }

  

  function fuzzyDist(a, b) {
    if (a === b) return 0;
    let dist = Math.abs(a.length - b.length);
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) if (a[i] !== b[i]) dist++;
    return dist;
  }

  function renderError(msg, sql) {
    metaEl.textContent = 'Error';
    const hints = sql ? getSQLSuggestion(sql, msg) : [];
    const hintHtml = hints.length
      ? `<div class="sql-error-hints">
           <div class="sql-error-hints-label">
             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
             Suggestion${hints.length > 1 ? 's' : ''}
           </div>
           ${hints.map(h => `<div class="sql-error-hint-item">${escapeHtml(h)}</div>`).join('')}
         </div>`
      : '';
    resultsEl.innerHTML = `<div class="results-error">⚠ ${escapeHtml(msg)}${hintHtml}</div>`;
  }

  
  document.querySelectorAll('.quick-q-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editorPage.value = btn.dataset.q;
      editorPage.focus();
    });
  });

  
  document.querySelectorAll('.table-item').forEach(item => {
    item.addEventListener('click', () => item.classList.toggle('expanded'));
  });
}

const quizContainer = document.getElementById('quiz-container');

const ALL_QUESTIONS = [
  { id: 1, difficulty: 'easy', topic: 'SELECT', question: 'Which SQL statement is used to retrieve data from a database?', options: ['GET', 'FETCH', 'SELECT', 'RETRIEVE'], correct: 2, explanation: 'SELECT is the command used to retrieve data from a database. It is the most commonly used SQL command!' },
  { id: 2, difficulty: 'easy', topic: 'SELECT', question: 'What does SELECT * FROM Students mean?', options: ['Select the first row from Students', 'Select all columns from the Students table', 'Select only the star column', 'Delete all from Students'], correct: 1, explanation: 'The asterisk (*) in SQL means "all columns." So SELECT * FROM Students = retrieve all columns of all rows in the Students table.' },
  { id: 3, difficulty: 'easy', topic: 'WHERE', question: 'Which clause is used to filter records in SQL?', options: ['FILTER', 'HAVING', 'WHERE', 'CONDITION'], correct: 2, explanation: 'The WHERE clause filters records. Think of it like a search filter - "give me only the rows that meet my condition."' },
  { id: 4, difficulty: 'easy', topic: 'INSERT', question: 'Which command adds new rows to a table?', options: ['ADD INTO', 'INSERT INTO', 'PUT INTO', 'APPEND INTO'], correct: 1, explanation: 'INSERT INTO is the correct syntax for adding a new row to a table. It is always followed by the table name and VALUES.' },
  { id: 5, difficulty: 'easy', topic: 'Basics', question: 'What does SQL stand for?', options: ['Simple Query Language', 'Structured Query Language', 'Standard Query Logic', 'Sequential Query List'], correct: 1, explanation: 'SQL stands for Structured Query Language. "Structured" because it has specific syntax and grammar rules.' },
  { id: 6, difficulty: 'easy', topic: 'ORDER BY', question: 'Which clause is used to sort the results of a query?', options: ['SORT BY', 'ORDER BY', 'ARRANGE BY', 'GROUP BY'], correct: 1, explanation: 'ORDER BY is used to sort results. By default it sorts ASC (ascending / A-Z / 1-2-3). Add DESC for reverse order.' },
  { id: 7, difficulty: 'medium', topic: 'UPDATE', question: 'What is the danger of using UPDATE without a WHERE clause?', options: ['The query will not run', 'Only the first row will be updated', 'ALL rows in the table will be updated', 'The table will be deleted'], correct: 2, explanation: 'This is very dangerous! Without WHERE, SQL will update ALL rows in the table. Always include a WHERE clause when using UPDATE!' },
  { id: 8, difficulty: 'medium', topic: 'JOIN', question: 'What does INNER JOIN return?', options: ['All rows from both tables', 'Only rows that match in both tables', 'All rows from the left table only', 'Only rows from the right table'], correct: 1, explanation: 'INNER JOIN returns ONLY the rows that have matching values in both tables. Think of a Venn diagram - only the overlapping middle portion is returned.' },
  { id: 9, difficulty: 'medium', topic: 'Aggregates', question: 'Which function counts the number of rows in a result?', options: ['SUM()', 'TOTAL()', 'COUNT()', 'NUMBER()'], correct: 2, explanation: 'COUNT() is the function for counting the number of rows. COUNT(*) = all rows; COUNT(column) = only rows where that column is NOT NULL.' },
  { id: 10, difficulty: 'medium', topic: 'GROUP BY', question: 'The GROUP BY clause is used together with which type of functions?', options: ['String functions', 'Date functions', 'Aggregate functions', 'Math functions'], correct: 2, explanation: 'GROUP BY is always used together with aggregate functions (COUNT, SUM, AVG, etc.) to compute values per group.' },
  { id: 11, difficulty: 'medium', topic: 'SELECT', question: 'Which keyword removes duplicate rows from SELECT results?', options: ['UNIQUE', 'DISTINCT', 'DIFFERENT', 'NODUPE'], correct: 1, explanation: 'SELECT DISTINCT is used to remove duplicate rows from the result. For example: SELECT DISTINCT Course FROM Students - returns each unique course only once.' },
  { id: 12, difficulty: 'medium', topic: 'DELETE', question: 'What is the effect of DELETE FROM Students with no WHERE clause?', options: ['Deletes the Students table structure', 'Deletes only the first row', 'Deletes ALL rows in Students', 'Does nothing'], correct: 2, explanation: 'Without WHERE, all rows in the table are deleted. The table structure remains but there is no data left. Be very careful!' },
  { id: 13, difficulty: 'hard', topic: 'JOIN', question: 'What is the difference between INNER JOIN and LEFT JOIN?', options: ['They are identical', 'LEFT JOIN includes all rows from the left table even without a match', 'INNER JOIN includes unmatched rows', 'LEFT JOIN only returns left table columns'], correct: 1, explanation: 'LEFT JOIN = all rows from the LEFT table appear in the result, even if there is no matching row in the right table (NULLs will appear). INNER JOIN = only matching rows.' },
  { id: 14, difficulty: 'hard', topic: 'GROUP BY', question: 'Which clause filters groups after GROUP BY (not individual rows)?', options: ['WHERE', 'FILTER', 'HAVING', 'CONDITION'], correct: 2, explanation: 'HAVING is used to filter groups (after GROUP BY). WHERE filters individual rows before grouping. Remember: WHERE → before grouping, HAVING → after grouping.' },
  { id: 15, difficulty: 'hard', topic: 'Primary Key', question: 'What is the purpose of a PRIMARY KEY in a table?', options: ['It allows NULL values', 'It uniquely identifies each row and prevents duplicates', 'It links two tables together', 'It speeds up DELETE operations only'], correct: 1, explanation: 'A PRIMARY KEY is a column (or set of columns) that uniquely identifies each row. It cannot have duplicates and cannot be NULL - like an ID number for every record.' },

  
  { id: 16, difficulty: 'easy', topic: 'Basics', question: 'SQL commands are divided into categories. Which category does SELECT belong to?', options: ['DDL (Data Definition Language)', 'DML (Data Manipulation Language)', 'DCL (Data Control Language)', 'TCL (Transaction Control Language)'], correct: 1, explanation: 'SELECT belongs to DML - Data Manipulation Language. DML is used to read or modify data (SELECT, INSERT, UPDATE, DELETE).' },
  { id: 17, difficulty: 'easy', topic: 'Basics', question: 'Which SQL statement is used to CREATE a new table?', options: ['NEW TABLE', 'CREATE TABLE', 'ADD TABLE', 'MAKE TABLE'], correct: 1, explanation: 'CREATE TABLE is the syntax for making a new table. It is followed by the table name and the column definitions inside parentheses.' },
  { id: 18, difficulty: 'easy', topic: 'SELECT', question: 'How do you select only the FirstName and LastName columns from a Students table?', options: ['SELECT ALL FROM Students', 'SELECT * FROM Students', 'SELECT FirstName, LastName FROM Students', 'GET FirstName, LastName FROM Students'], correct: 2, explanation: 'To select specific columns, list the column names separated by commas after SELECT. You do not always need to retrieve everything (*).' },
  { id: 19, difficulty: 'easy', topic: 'WHERE', question: 'Which operator is used in a WHERE clause to check if a value is NOT equal?', options: ['!=', '<>', 'Both != and <>', 'NOT='], correct: 2, explanation: 'In SQL, both != and <> mean "not equal." Both are valid. For example: WHERE Course != \'BSIT\' or WHERE Course <> \'BSIT\'.' },
  { id: 20, difficulty: 'easy', topic: 'NULL', question: 'Which keyword is used to check if a column value is NULL?', options: ['= NULL', 'IS NULL', 'EQUALS NULL', 'HAS NULL'], correct: 1, explanation: 'You cannot use = NULL in SQL - you must use IS NULL. For example: WHERE Email IS NULL. For the opposite, use IS NOT NULL.' },
  { id: 21, difficulty: 'easy', topic: 'ORDER BY', question: 'How do you sort results in descending order?', options: ['ORDER BY column ASC', 'ORDER BY column DESC', 'SORT BY column DOWN', 'ORDER column REVERSE'], correct: 1, explanation: 'Use the DESC keyword after the column name in the ORDER BY clause. For example: ORDER BY LastName DESC - results will be sorted from Z to A.' },
  { id: 22, difficulty: 'easy', topic: 'INSERT', question: 'What is the correct syntax to insert a new student with ID 10, name "Juan", course "BSIT"?', options: ["INSERT Students VALUES (10, 'Juan', 'BSIT')", "INSERT INTO Students VALUES (10, 'Juan', 'BSIT')", "ADD INTO Students (10, 'Juan', 'BSIT')", "PUT INTO Students VALUES (10, 'Juan', 'BSIT')"], correct: 1, explanation: 'The correct syntax is INSERT INTO [table] VALUES (...). Do not forget to write INTO after INSERT - this is a common mistake for beginners!' },
  { id: 23, difficulty: 'easy', topic: 'Basics', question: 'How do you write a single-line comment in SQL?', options: ['// This is a comment', '/* This is a comment */', '-- This is a comment', '# This is a comment'], correct: 2, explanation: 'In SQL, a single-line comment starts with --. All text after -- on the same line is treated as a comment and is not executed.' },
  { id: 24, difficulty: 'easy', topic: 'SELECT', question: 'What does the DISTINCT keyword do in a SELECT statement?', options: ['Sorts the results alphabetically', 'Removes duplicate rows from results', 'Selects only the first row', 'Filters NULL values'], correct: 1, explanation: 'DISTINCT removes duplicate rows from the result set. For example: SELECT DISTINCT Course FROM Students - each course name appears only once.' },
  { id: 25, difficulty: 'easy', topic: 'Basics', question: 'Which of the following is a valid SQL data type for storing text?', options: ['TEXT_VALUE', 'STRING', 'VARCHAR', 'WORD'], correct: 2, explanation: 'VARCHAR (Variable Character) is the most common data type for text in SQL Server. The maximum length follows in parentheses - for example VARCHAR(100).' },

  
  { id: 26, difficulty: 'medium', topic: 'WHERE', question: 'Which operator is used to search for a pattern in a column?', options: ['MATCH', 'LIKE', 'SIMILAR', 'CONTAINS'], correct: 1, explanation: 'The LIKE operator is used for pattern matching. It is used with % (any characters) and _ (single character). For example: WHERE LastName LIKE \'S%\' - all names starting with S.' },
  { id: 27, difficulty: 'medium', topic: 'WHERE', question: 'What does the BETWEEN operator do?', options: ['Selects values outside a range', 'Selects values within an inclusive range', 'Selects exactly two values', 'Combines two WHERE conditions'], correct: 1, explanation: 'BETWEEN selects values within a range, inclusive of both endpoints. For example: WHERE Grade BETWEEN 1.0 AND 3.0 - includes 1.0 and 3.0.' },
  { id: 28, difficulty: 'medium', topic: 'WHERE', question: 'Which operator lets you specify multiple values in a WHERE clause?', options: ['BETWEEN', 'LIKE', 'IN', 'AND'], correct: 2, explanation: 'The IN operator lets you specify multiple possible values. For example: WHERE Course IN (\'BSIT\', \'BSCS\', \'BSIS\') - shorter than writing multiple OR conditions.' },
  { id: 29, difficulty: 'medium', topic: 'Aggregates', question: 'Which aggregate function returns the total sum of a numeric column?', options: ['TOTAL()', 'ADD()', 'SUM()', 'PLUS()'], correct: 2, explanation: 'SUM() is used to get the total of numeric values in a column. For example: SELECT SUM(Units) FROM Courses - returns the total units across all courses.' },
  { id: 30, difficulty: 'medium', topic: 'Aggregates', question: 'Which aggregate function returns the average value of a numeric column?', options: ['MEAN()', 'AVERAGE()', 'AVG()', 'MID()'], correct: 2, explanation: 'AVG() is the SQL function for calculating the average (arithmetic mean) of values in a column. For example: SELECT AVG(Grade) FROM Grades.' },
  { id: 31, difficulty: 'medium', topic: 'UPDATE', question: 'What is the correct syntax to update the Course of the student with StudentID = 5?', options: ["UPDATE Students SET Course = 'BSCS' WHERE StudentID = 5", "MODIFY Students Course = 'BSCS' WHERE StudentID = 5", "UPDATE Students WHERE StudentID = 5 SET Course = 'BSCS'", "CHANGE Students SET Course = 'BSCS' FOR StudentID = 5"], correct: 0, explanation: 'The correct syntax is: UPDATE [table] SET [column = value] WHERE [condition]. It is important to have UPDATE, SET, and WHERE in the right order.' },
  { id: 32, difficulty: 'medium', topic: 'DELETE', question: 'Which statement permanently removes rows from a table?', options: ['REMOVE', 'ERASE', 'DELETE', 'DROP'], correct: 2, explanation: 'DELETE removes rows (data) from a table. DROP removes the entire table structure. That is a big difference - be careful!' },
  { id: 33, difficulty: 'medium', topic: 'JOIN', question: 'In a JOIN, what does the ON keyword specify?', options: ['The table to select from', 'The condition linking the two tables', 'The columns to display', 'The sort order'], correct: 1, explanation: 'The ON keyword in a JOIN defines the condition that connects the two tables - usually matching a primary key to a foreign key. For example: ON Students.Course = Courses.CourseID.' },
  { id: 34, difficulty: 'medium', topic: 'Aliases', question: 'What is the purpose of using an alias (AS) in SQL?', options: ['It permanently renames a column', 'It gives a temporary name to a column or table in the query', 'It creates a new table', 'It hides a column from results'], correct: 1, explanation: 'An alias (AS) gives a temporary name to a column or table for readability. For example: COUNT(*) AS TotalStudents.' },
  { id: 35, difficulty: 'medium', topic: 'GROUP BY', question: 'If you GROUP BY Course and use COUNT(*), what does each row in the result represent?', options: ['Each student', 'Each row in the original table', 'The count of all rows in the table', 'Each unique course and how many students are in it'], correct: 3, explanation: 'When you GROUP BY Course and use COUNT(*), each row in the result represents one unique Course and the number of students enrolled in it.' },
  { id: 36, difficulty: 'medium', topic: 'Constraints', question: 'What does the NOT NULL constraint do?', options: ['Prevents duplicate values', 'Ensures the column must always have a value', 'Links to another table', 'Limits the number of characters'], correct: 1, explanation: 'The NOT NULL constraint ensures the column always has a value - NULL cannot be inserted. Used for required fields like a name or email.' },
  { id: 37, difficulty: 'medium', topic: 'SELECT', question: 'What does TOP do in SQL Server? e.g., SELECT TOP 5 * FROM Students', options: ['Returns results in ascending order', 'Returns only the first 5 rows', 'Returns only rows where ID is under 5', 'Sorts by the top 5 values'], correct: 1, explanation: 'TOP in SQL Server returns a specified number of rows from the beginning of the result set. SELECT TOP 5 * FROM Students = retrieves only the first 5 rows.' },
  { id: 38, difficulty: 'medium', topic: 'WHERE', question: 'Which logical operator returns true only if BOTH conditions are true?', options: ['OR', 'AND', 'NOT', 'XOR'], correct: 1, explanation: 'The AND operator returns true only when BOTH conditions are true. OR returns true when AT LEAST ONE condition is true. Always remember their truth tables!' },

  
  { id: 39, difficulty: 'hard', topic: 'JOIN', question: 'You have a Students table and a Grades table. Which JOIN returns ALL students even if they have no grades yet?', options: ['INNER JOIN Grades', 'RIGHT JOIN Students', 'LEFT JOIN Grades ON Students.StudentID = Grades.StudentID', 'FULL JOIN Grades'], correct: 2, explanation: 'LEFT JOIN from Students to Grades returns all students - even those with no matching grade yet. Students without grades will show NULL in the grade columns.' },
  { id: 40, difficulty: 'hard', topic: 'GROUP BY', question: 'What is the correct order of clauses in a full SELECT statement?', options: ['SELECT → FROM → GROUP BY → WHERE → HAVING → ORDER BY', 'SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY', 'SELECT → WHERE → FROM → HAVING → GROUP BY → ORDER BY', 'FROM → SELECT → WHERE → GROUP BY → ORDER BY → HAVING'], correct: 1, explanation: 'The correct order is: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY. Remember: WHERE comes before GROUP BY, and HAVING comes after. This is a classic exam question!' },
  { id: 41, difficulty: 'hard', topic: 'Subquery', question: 'What is a subquery?', options: ['A query inside another query', 'A backup query if the main one fails', 'A stored procedure', 'A query that runs on a second database'], correct: 0, explanation: 'A subquery (or inner query) is a SELECT statement nested inside another SQL statement. For example: SELECT * FROM Students WHERE StudentID IN (SELECT StudentID FROM Grades WHERE Grade < 3.0).' },
  { id: 42, difficulty: 'hard', topic: 'DDL', question: 'What is the difference between DROP TABLE and TRUNCATE TABLE?', options: ['They are the same', 'DROP removes data only; TRUNCATE removes the table structure', 'DROP removes the table and its structure; TRUNCATE removes all rows but keeps the structure', 'TRUNCATE is not a valid SQL command'], correct: 2, explanation: 'DROP TABLE removes the entire table - including the structure, data, and constraints. TRUNCATE TABLE removes all rows but keeps the table structure intact.' },
  { id: 43, difficulty: 'hard', topic: 'Foreign Key', question: 'What is the purpose of a FOREIGN KEY?', options: ['It encrypts the column data', 'It uniquely identifies a row within its own table', 'It enforces a link between data in two tables', 'It automatically increments values'], correct: 2, explanation: 'A FOREIGN KEY is a column that points to the PRIMARY KEY of another table. It enforces referential integrity - you cannot insert a value that does not exist in the referenced table.' },
  { id: 44, difficulty: 'hard', topic: 'Aggregates', question: 'What is the difference between WHERE and HAVING when filtering aggregate results?', options: ['No difference - they can be used interchangeably', 'WHERE filters rows before grouping; HAVING filters groups after grouping', 'HAVING filters rows before grouping; WHERE filters after', 'WHERE works only with JOINs'], correct: 1, explanation: 'Important to remember: WHERE filters individual rows BEFORE grouping (before GROUP BY). HAVING filters groups AFTER GROUP BY. WHERE cannot be used with aggregate functions.' },
  { id: 45, difficulty: 'hard', topic: 'JOIN', question: 'What result does a FULL OUTER JOIN produce?', options: ['Only matching rows from both tables', 'All rows from the left table and matching rows from the right', 'All rows from both tables, with NULLs where there is no match', 'Only rows that do not match in either table'], correct: 2, explanation: 'FULL OUTER JOIN combines LEFT JOIN and RIGHT JOIN - it shows all rows from both tables. Where there is no match in one table, NULL appears in the corresponding columns.' },
  { id: 46, difficulty: 'hard', topic: 'Index', question: 'What is the main benefit of creating an INDEX on a column?', options: ['It prevents duplicate values', 'It speeds up data retrieval (SELECT queries)', 'It automatically sorts inserted data', 'It restricts who can read the column'], correct: 1, explanation: 'An INDEX speeds up data retrieval - like a book index, SQL does not need to scan the entire table to find a row. Trade-off: INSERT/UPDATE/DELETE become slightly slower because the index must also be updated.' },
  { id: 47, difficulty: 'hard', topic: 'DDL', question: 'Which statement is used to add a new column to an existing table?', options: ['UPDATE TABLE Students ADD Email VARCHAR(100)', 'MODIFY TABLE Students ADD Email VARCHAR(100)', 'ALTER TABLE Students ADD Email VARCHAR(100)', 'CHANGE TABLE Students ADD Email VARCHAR(100)'], correct: 2, explanation: 'ALTER TABLE is used to modify the structure of an existing table - add a column (ADD), change a data type (ALTER COLUMN), or remove a column (DROP COLUMN).' },
  { id: 48, difficulty: 'hard', topic: 'Subquery', question: 'Which keyword is used in a WHERE clause to check if a value exists in a subquery result?', options: ['CONTAINS', 'EXISTS', 'IN', 'Both EXISTS and IN can be used for this'], correct: 3, explanation: 'Both IN and EXISTS can check whether a matching value exists in a subquery. IN is simpler for basic checks; EXISTS is more efficient for large datasets because it stops as soon as it finds the first match.' },
  { id: 49, difficulty: 'hard', topic: 'Constraints', question: 'What does the UNIQUE constraint do?', options: ['Ensures the column cannot be NULL', 'Ensures all values in the column are different', 'Sets a default value', 'Links to a foreign table'], correct: 1, explanation: 'The UNIQUE constraint ensures all values in the column are distinct (no duplicates). Similar to PRIMARY KEY, but it can allow NULL values, and a table can have multiple UNIQUE columns.' },
  { id: 50, difficulty: 'hard', topic: 'Normalization', question: 'What is the main goal of database normalization?', options: ['To make queries run faster at all times', 'To reduce data redundancy and improve data integrity', 'To create more tables', 'To encrypt the database'], correct: 1, explanation: 'Normalization is the process of organizing a database to reduce redundancy (repeated data) and improve data integrity. This is why one large table is sometimes split into several smaller related tables.' }
];

const SESSION_SIZE = 10; 

if (quizContainer) initQuiz();

function pickSession(diff) {
  const pool = diff === 'all' ? [...ALL_QUESTIONS] : ALL_QUESTIONS.filter(q => q.difficulty === diff);
  
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(SESSION_SIZE, pool.length));
}

function initQuiz() {
  let currentQ = 0;
  let score = 0;
  let wrong = 0;
  let answered = false;
  let activeDiff = 'all';
  let sessionNum = 1;
  let questions = pickSession(activeDiff);
  let sessionAnswers = [];

  
  let speedMode = false;
  const SPEED_SECONDS = 30;
  let timerInterval = null;
  let timerRemaining = SPEED_SECONDS;

  const qEl = document.getElementById('q-text');
  const optEl = document.getElementById('q-options');
  const fbEl = document.getElementById('q-feedback');
  const nextBtn = document.getElementById('next-btn');
  const progressFill = document.getElementById('quiz-progress-fill');
  const qNumEl = document.getElementById('q-number');
  const diffBadge = document.getElementById('q-difficulty');
  const scoreNumEl = document.getElementById('score-num');
  const scoreCircle = document.getElementById('score-circle');
  const correctEl = document.getElementById('score-correct');
  const wrongEl = document.getElementById('score-wrong');
  const remainEl = document.getElementById('score-remain');

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDiff = btn.dataset.diff;
      startNewSession();
    });
  });

  
  const speedToggle = document.getElementById('speed-round-toggle');
  if (speedToggle) {
    speedToggle.addEventListener('click', () => {
      speedMode = !speedMode;
      speedToggle.classList.toggle('active', speedMode);
      speedToggle.setAttribute('aria-pressed', speedMode);
      startNewSession();
    });
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function startTimer(onExpire) {
    stopTimer();
    timerRemaining = SPEED_SECONDS;
    updateTimerUI();
    timerInterval = setInterval(() => {
      timerRemaining--;
      updateTimerUI();
      if (timerRemaining <= 0) {
        stopTimer();
        onExpire();
      }
    }, 1000);
  }

  function updateTimerUI() {
    const bar  = document.getElementById('speed-timer-bar');
    const num  = document.getElementById('speed-timer-num');
    if (!bar || !num) return;
    const pct = (timerRemaining / SPEED_SECONDS) * 100;
    bar.style.width = pct + '%';
    num.textContent = timerRemaining;
    
    const hue = Math.round(pct * 1.2); 
    bar.style.background = `hsl(${hue}, 72%, 45%)`;
    num.style.color = timerRemaining <= 8 ? '#e53e3e' : 'var(--fg)';
  }

  function startNewSession() {
    stopTimer();
    questions = pickSession(activeDiff);
    currentQ = 0; score = 0; wrong = 0; answered = false; sessionAnswers = [];
    
    quizContainer.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" id="quiz-progress-fill" style="width:0%"></div>
        </div>
        ${speedMode ? `
        <div class="speed-timer-wrap">
          <div class="speed-timer-track">
            <div class="speed-timer-bar" id="speed-timer-bar" style="width:100%"></div>
          </div>
          <span class="speed-timer-num" id="speed-timer-num">${SPEED_SECONDS}</span>
        </div>` : ''}
        <div class="quiz-meta">
          <span class="quiz-number" id="q-number">Question 1 of ${questions.length}</span>
          <span class="difficulty-badge easy" id="q-difficulty">Easy</span>
          ${speedMode ? '<span class="speed-badge">⚡ Speed Round</span>' : ''}
        </div>
        <div class="quiz-question" id="q-text">Loading question...</div>
        <div class="quiz-options" id="q-options"></div>
        <div class="quiz-feedback" id="q-feedback"></div>
        <div class="quiz-actions">
          <button class="btn btn-primary" id="next-btn" style="display:none">Next Question →</button>
        </div>
      </div>`;
    bindQuizDOM();
    loadQuestion();
    updateScore();
  }

  function bindQuizDOM() {
    Object.assign(window, {}); 
  }

  loadQuestion();

  
  quizContainer.addEventListener('click', (e) => {
    const nb = e.target.closest('#next-btn');
    if (!nb) return;
    currentQ++;
    loadQuestion();
  });

  function loadQuestion() {
    const pf = document.getElementById('quiz-progress-fill');
    const qn = document.getElementById('q-number');
    const db = document.getElementById('q-difficulty');
    const qt = document.getElementById('q-text');
    const qo = document.getElementById('q-options');
    const qf = document.getElementById('q-feedback');
    const nb = document.getElementById('next-btn');

    if (currentQ >= questions.length) {
      stopTimer();
      showFinal();
      return;
    }
    answered = false;
    if (qf) qf.classList.remove('show', 'correct-fb', 'wrong-fb');
    if (nb) nb.style.display = 'none';
    const q = questions[currentQ];
    if (qn) qn.textContent = `Question ${currentQ + 1} of ${questions.length}`;
    if (db) { db.textContent = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1); db.className = 'difficulty-badge ' + q.difficulty; }
    if (pf) pf.style.width = `${(currentQ / questions.length) * 100}%`;
    if (qt) qt.textContent = q.question;

    if (qo) {
      qo.innerHTML = q.options.map((o, i) => `
        <button class="quiz-option" data-idx="${i}">
          <span class="opt-letter">${String.fromCharCode(65+i)}</span>
          <span>${escapeHtml(o)}</span>
        </button>`).join('');

      const handleAnswer = (idx) => {
        if (answered) return;
        answered = true;
        stopTimer();
        const correct = questions[currentQ].correct;
        const fb = document.getElementById('q-feedback');
        const nb2 = document.getElementById('next-btn');
        qo.querySelectorAll('.quiz-option').forEach((b, i) => {
          b.disabled = true;
          if (i === correct) b.classList.add('correct');
          if (i === idx && idx !== correct) b.classList.add('wrong');
          if (i === idx) b.classList.add('selected');
        });
        const wasCorrect = idx === correct;
        if (wasCorrect) { score++; fb.classList.add('correct-fb'); fb.innerHTML = `<strong>Correct!</strong> ${escapeHtml(questions[currentQ].explanation)}`; }
        else {
          wrong++;
          const timeoutMsg = idx === -1 ? '<strong>Time\'s up!</strong> ' : '<strong>Wrong!</strong> ';
          fb.classList.add('wrong-fb');
          fb.innerHTML = timeoutMsg + escapeHtml(questions[currentQ].explanation);
        }
        fb.classList.add('show');
        sessionAnswers.push({
          question:    questions[currentQ].question,
          options:     questions[currentQ].options,
          correct:     correct,
          chosen:      idx,
          wasCorrect,
          explanation: questions[currentQ].explanation,
          topic:       questions[currentQ].topic,
          difficulty:  questions[currentQ].difficulty,
          timedOut:    idx === -1,
        });
        if (nb2) nb2.style.display = 'flex';
        updateScore();
      };

      qo.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.idx)));
      });

      
      if (speedMode) {
        startTimer(() => {
          
          handleAnswer(-1);
        });
      }
    }
    updateScore();
  }

  function updateScore() {
    const total = currentQ + (answered ? 1 : 0);
    const pct = total > 0 ? Math.round(score / total * 100) : 0;
    if (scoreNumEl) scoreNumEl.textContent = pct + '%';
    if (correctEl) correctEl.textContent = score;
    if (wrongEl) wrongEl.textContent = wrong;
    if (remainEl) remainEl.textContent = questions.length - currentQ - (answered ? 1 : 0);
    if (scoreCircle) {
      const circumference = 2 * Math.PI * 40;
      const dash = (pct / 100) * circumference;
      scoreCircle.style.strokeDasharray = `${dash} ${circumference}`;
    }
    saveLessonScore('quiz', score, Math.max(total, 1));
  }

  function showFinal() {
    const pf = document.getElementById('quiz-progress-fill');
    if (pf) pf.style.width = '100%';
    const pct = questions.length > 0 ? Math.round(score / questions.length * 100) : 0;
    saveQuizAttempt(score, questions.length, activeDiff);
    sessionNum++;
    const emoji = pct >= 90 ? '' : pct >= 75 ? '' : pct >= 50 ? '' : '';
    const remark = pct >= 90 ? 'Excellent!' : pct >= 75 ? 'Great Job!' : pct >= 50 ? 'Okay, keep practicing!' : 'Study more and try again!';
    const diffLabel = activeDiff === 'all' ? 'All difficulties' : activeDiff.charAt(0).toUpperCase() + activeDiff.slice(1);
    const modeLabel = speedMode ? ' · ⚡ Speed Round' : '';
    quizContainer.innerHTML = `
      <div class="quiz-card" style="text-align:center;padding:3rem 2rem">
        <div style="font-size:3rem;margin-bottom:1rem">${emoji}</div>
        <h2 style="font-size:2rem;margin-bottom:.5rem">${remark}</h2>
        <p style="color:var(--muted);margin-bottom:.5rem">Session ${sessionNum - 1} · ${diffLabel}${modeLabel}</p>
        <p style="color:var(--muted);margin-bottom:2rem">You scored <strong>${score}</strong> out of <strong>${questions.length}</strong> &nbsp;(${pct}%)</p>
        <p style="font-size:.85rem;color:var(--muted);margin-bottom:1.5rem">Each session draws 10 new random questions from the pool of 50 - so every attempt is different!</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" id="new-session-btn">Beat your score →</button>
          <button class="btn btn-outline" id="review-btn">Review Answers</button>
          <a href="dashboard.html" class="btn btn-outline">View Dashboard</a>
        </div>
      </div>`;
    document.getElementById('new-session-btn').addEventListener('click', startNewSession);
    document.getElementById('review-btn').addEventListener('click', showReview);
    
    if (scoreNumEl) scoreNumEl.textContent = '0%';
    if (correctEl) correctEl.textContent = '0';
    if (wrongEl) wrongEl.textContent = '0';
    if (remainEl) remainEl.textContent = SESSION_SIZE;
    if (scoreCircle) scoreCircle.style.strokeDasharray = '0 251.3';
  }

  
  function showReview() {
    const pct = questions.length > 0 ? Math.round(score / questions.length * 100) : 0;
    const correctCount  = sessionAnswers.filter(a => a.wasCorrect).length;
    const wrongCount    = sessionAnswers.filter(a => !a.wasCorrect).length;

    const itemsHtml = sessionAnswers.map((a, i) => {
      const statusClass = a.wasCorrect ? 'review-correct' : 'review-wrong';
      const statusLabel = a.wasCorrect
        ? `<span class="review-status-badge correct-badge"> Correct</span>`
        : (a.timedOut
            ? `<span class="review-status-badge timeout-badge">⏱ Timed Out</span>`
            : `<span class="review-status-badge wrong-badge"> Wrong</span>`);

      const optionsHtml = a.options.map((opt, oi) => {
        let cls = 'review-opt';
        if (oi === a.correct) cls += ' review-opt-correct';
        if (oi === a.chosen && !a.wasCorrect) cls += ' review-opt-chosen-wrong';
        const prefix = oi === a.correct
          ? `<span class="review-opt-icon">✓</span>`
          : (oi === a.chosen && !a.wasCorrect ? `<span class="review-opt-icon wrong-icon">✕</span>` : `<span class="review-opt-icon empty-icon">${String.fromCharCode(65+oi)}</span>`);
        return `<div class="${cls}">${prefix}<span>${escapeHtml(opt)}</span></div>`;
      }).join('');

      return `
        <div class="review-item ${statusClass}">
          <div class="review-item-header">
            <div class="review-q-meta">
              <span class="chip">${escapeHtml(a.topic)}</span>
              <span class="difficulty-badge ${a.difficulty}">${a.difficulty.charAt(0).toUpperCase()+a.difficulty.slice(1)}</span>
              <span class="review-q-num">Q${i+1}</span>
            </div>
            ${statusLabel}
          </div>
          <div class="review-question">${escapeHtml(a.question)}</div>
          <div class="review-options">${optionsHtml}</div>
          <div class="review-explanation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            ${escapeHtml(a.explanation)}
          </div>
        </div>`;
    }).join('');

    quizContainer.innerHTML = `
      <div class="quiz-card review-panel">
        <div class="review-header">
          <div class="review-summary">
            <div class="review-summary-score">${pct}%</div>
            <div class="review-summary-detail">
              <strong>${correctCount}</strong> correct &nbsp;·&nbsp; <strong>${wrongCount}</strong> wrong &nbsp;·&nbsp; ${sessionAnswers.length} questions
            </div>
          </div>
          <h2 class="review-title">Answer Review</h2>
          <p class="review-sub">Go through each question to understand what you got right — and what to study next.</p>
        </div>
        <div class="review-list">${itemsHtml}</div>
        <div class="review-footer">
          <button class="btn btn-primary" id="review-retry-btn">Try Another Session →</button>
          <a href="dashboard.html" class="btn btn-outline">View Dashboard</a>
          <a href="lessons.html" class="btn btn-outline">Review Lessons</a>
        </div>
      </div>`;

    document.getElementById('review-retry-btn').addEventListener('click', startNewSession);
  }

}

const dashboardEl = document.getElementById('dashboard-root');
if (dashboardEl) initDashboard();

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins  < 2)  return 'Just now';
  if (mins  < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days  < 7)  return `${days} day${days !== 1 ? 's' : ''} ago`;
  return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
}

function initDashboard() {
  const user = getCurrentUser();
  const prog = getProgress();
  const doneLessons = prog?.lessons ? Object.keys(prog.lessons).length : 0;
  const total = LESSONS.length;
  const pct = Math.round(doneLessons / total * 100);

  
  const overallFill = document.getElementById('overall-fill');
  const overallPct = document.getElementById('overall-pct');
  const overallCount = document.getElementById('overall-count');
  if (overallFill) overallFill.style.width = pct + '%';
  if (overallPct) overallPct.textContent = pct + '%';
  if (overallCount) overallCount.textContent = `${doneLessons} / ${total} lessons`;

  
  const lessonList = document.getElementById('lesson-progress-list');
  if (lessonList) {
    lessonList.innerHTML = LESSONS.map((l, i) => {
      const done = prog?.lessons?.[l.id];
      const qs = prog?.quizScores?.[l.id];
      let statusClass = 'locked', statusIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
      if (done) { statusClass = 'done'; statusIcon = '✓'; }
      else if (i === doneLessons) { statusClass = 'in-progress'; statusIcon = '→'; }
      const completedAgo = done?.ts ? timeAgo(done.ts) : null;
      return `
      <div class="lp-item">
        <div class="lp-status ${statusClass}">${statusIcon}</div>
        <div class="lp-info">
          <h4>${l.title}</h4>
          <div class="lp-meta">Lesson ${i+1} · ${l.level} · ${l.duration}</div>
          ${completedAgo ? `<div class="lp-timestamp">Completed ${completedAgo}</div>` : ''}
        </div>
        <div class="lp-score">
          ${done ? `<span class="score-val">Done</span>` : `<span style="color:var(--muted);font-size:.85rem">${i < doneLessons ? 'Skipped' : 'Locked'}</span>`}
        </div>
      </div>`;
    }).join('');
  }

  
  const streakEl = document.getElementById('streak-num');
  if (streakEl) streakEl.textContent = doneLessons;

  
  const history = getQuizHistory();
  const totalQuizzesEl = document.getElementById('dash-total-quizzes');
  const bestScoreEl = document.getElementById('dash-best-score');
  if (totalQuizzesEl) totalQuizzesEl.textContent = history.length;
  if (bestScoreEl) {
    const best = getBestQuizScore();
    bestScoreEl.textContent = best ? best.pct + '%' : '-';
  }

  
  const achieveEls = document.querySelectorAll('.achievement[data-unlock]');
  achieveEls.forEach(el => {
    const threshold = parseInt(el.dataset.unlock);
    if (doneLessons >= threshold) el.classList.remove('locked');
  });
}

const practiceRoot = document.getElementById('practice-root');

const PRACTICE_CHALLENGES = [
  {
    id: 'p1', topic: 'SELECT Basics', title: 'Get All Students',
    desc: 'Retrieve all columns and all rows from the Students table.',
    schema: 'Students(StudentID, FirstName, LastName, Course, EnrollDate)',
    hint: 'Use SELECT * to get all columns.',
    answer: (r) => r.rows && r.rows.length >= 5,
    answerSQL: 'SELECT * FROM Students;'
  },
  {
    id: 'p2', topic: 'SELECT Basics', title: 'BSIT Students Only',
    desc: "Retrieve the FirstName and LastName of all students whose Course is 'BSIT'.",
    schema: 'Students(StudentID, FirstName, LastName, Course, EnrollDate)',
    hint: "Use WHERE Course = 'BSIT' and select only the two columns needed.",
    answer: (r) => r.rows && r.rows.length > 0 && r.rows[0].hasOwnProperty('FirstName'),
    answerSQL: "SELECT FirstName, LastName FROM Students WHERE Course = 'BSIT';"
  },
  {
    id: 'p3', topic: 'SELECT Basics', title: 'Sort by Last Name',
    desc: 'Get all students, sorted alphabetically by LastName.',
    schema: 'Students(StudentID, FirstName, LastName, Course, EnrollDate)',
    hint: 'Use ORDER BY LastName - default is ASC.',
    answer: (r) => r.rows && r.rows.length > 1,
    answerSQL: 'SELECT * FROM Students ORDER BY LastName;'
  },
  {
    id: 'p4', topic: 'Aggregation', title: 'Count per Course',
    desc: 'Show each Course and the number of students enrolled in it.',
    schema: 'Students(StudentID, FirstName, LastName, Course, EnrollDate)',
    hint: 'Use COUNT(*) and GROUP BY Course.',
    answer: (r) => r.rows && r.rows.some(row => Object.keys(row).some(k => k.toLowerCase().includes('count') || k === 'Total')),
    answerSQL: 'SELECT Course, COUNT(*) AS Total FROM Students GROUP BY Course;'
  },
  {
    id: 'p5', topic: 'JOIN', title: 'Students with Course Names',
    desc: 'Show FirstName, LastName, and CourseName by joining Students and Courses.',
    schema: 'Students(StudentID, FirstName, LastName, Course, EnrollDate)\nCourses(CourseID, CourseName, Units)',
    hint: "Use INNER JOIN Courses ON Students.Course = Courses.CourseID",
    answer: (r) => r.rows && r.rows.length > 0 && r.rows[0].hasOwnProperty('CourseName'),
    answerSQL: 'SELECT FirstName, LastName, CourseName FROM Students INNER JOIN Courses ON Students.Course = Courses.CourseID;'
  }
];

if (practiceRoot) initPractice();

function initPractice() {
  let activeIdx = 0;
  const navList = document.getElementById('practice-nav-list');
  const challengeEl = document.getElementById('practice-challenge-area');

  const donePractice = getPracticeDone();

  if (navList) {
    navList.innerHTML = PRACTICE_CHALLENGES.map((c, i) => `
      <div class="practice-nav-item ${i === 0 ? 'active' : ''}" data-cidx="${i}">
        <span>${c.title}</span>
        <span class="done-count" id="pnav-${i}" style="display:${donePractice[i] ? '' : 'none'}">✓</span>
      </div>`).join('');
    navList.querySelectorAll('.practice-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        navList.querySelectorAll('.practice-nav-item').forEach(x => x.classList.remove('active'));
        item.classList.add('active');
        activeIdx = parseInt(item.dataset.cidx);
        renderChallenge(activeIdx);
      });
    });
  }

  renderChallenge(0);

  function renderChallenge(idx) {
    const c = PRACTICE_CHALLENGES[idx];
    if (!challengeEl) return;
    challengeEl.innerHTML = `
      <div class="challenge-header">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
          <span class="chip">${c.topic}</span>
          <span style="font-size:.82rem;color:var(--muted)">Challenge ${idx+1} of ${PRACTICE_CHALLENGES.length}</span>
        </div>
        <div class="challenge-title">${c.title}</div>
        <div class="challenge-desc">${c.desc}</div>
        <div class="code-label" style="margin-bottom:.35rem">Table Schema</div>
        <div class="schema-preview">${c.schema}</div>
      </div>
      <textarea class="challenge-editor" id="prac-editor-${idx}" placeholder="-- Write your SQL query here..." spellcheck="false"></textarea>
      <div class="challenge-actions">
        <button class="btn btn-primary btn-sm" onclick="runChallenge(${idx})">Run Query</button>
        <button class="hint-btn" onclick="toggleHint(${idx})">Show Hint</button>
        <button class="btn btn-outline btn-sm" onclick="showAnswer(${idx})" style="font-size:.82rem">See Answer</button>
      </div>
      <div class="hint-box" id="hint-${idx}">${c.hint}</div>
      <div class="feedback-box" id="pfb-${idx}"></div>
      <div id="practice-results-${idx}" style="margin-top:1rem"></div>`;
  }

  window.runChallenge = function(idx) {
    const c = PRACTICE_CHALLENGES[idx];
    const editor = document.getElementById(`prac-editor-${idx}`);
    const fb = document.getElementById(`pfb-${idx}`);
    const resultEl = document.getElementById(`practice-results-${idx}`);
    if (!editor || !fb) return;
    const sql = editor.value.trim();
    if (!sql) { fb.className = 'feedback-box show fail'; fb.innerHTML = '⚠ Please write a query first!'; return; }

    
    const miniDB = {
      Students: [
        { StudentID:1, FirstName:'Maria', LastName:'Santos', Course:'BSIT', EnrollDate:'2025-08-15' },
        { StudentID:2, FirstName:'Juan', LastName:'Dela Cruz', Course:'BSIT', EnrollDate:'2025-08-15' },
        { StudentID:3, FirstName:'Ana', LastName:'Reyes', Course:'BSCS', EnrollDate:'2025-07-20' },
        { StudentID:4, FirstName:'Carlo', LastName:'Mendoza', Course:'BSIT', EnrollDate:'2025-08-01' },
        { StudentID:5, FirstName:'Liza', LastName:'Garcia', Course:'BSCS', EnrollDate:'2025-09-01' },
      ],
      Courses: [
        { CourseID:'BSIT', CourseName:'BS Information Technology', Units:148 },
        { CourseID:'BSCS', CourseName:'BS Computer Science', Units:150 },
        { CourseID:'BSIS', CourseName:'BS Information Systems', Units:145 },
      ]
    };

    try {
      
      
      const script = document.getElementById('sql-editor');
      let result;
      
      result = executeSQLStandalone(sql, miniDB);
      
      if (c.answer(result)) {
        fb.className = 'feedback-box show pass';
        fb.innerHTML = '✓ Correct! Great job! Your query returned the expected results.';
        const navDone = document.getElementById(`pnav-${idx}`);
        if (navDone) navDone.style.display = '';
        markPracticeDone(idx);
        if (typeof supabaseSavePracticeAttempt === 'function') {
          supabaseSavePracticeAttempt(c.id || idx, sql, true);
        }
      } else {
        fb.className = 'feedback-box show fail';
        fb.innerHTML = '✗ Not quite right yet. Try again! Check that your SELECT columns and WHERE condition are complete.';
        if (typeof supabaseSavePracticeAttempt === 'function') {
          supabaseSavePracticeAttempt(c.id || idx, sql, false);
        }
      }
      
      if (result.rows) {
        const cols = Object.keys(result.rows[0] || {});
        if (cols.length) {
          const thead = `<tr>${cols.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`;
          const tbody = result.rows.map(r => `<tr>${cols.map(c => `<td>${r[c] == null ? 'NULL' : escapeHtml(String(r[c]))}</td>`).join('')}</tr>`).join('');
          resultEl.innerHTML = `<div style="overflow-x:auto"><table class="results-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
        }
      } else {
        resultEl.innerHTML = `<div style="padding:.75rem;color:var(--primary);font-size:.9rem">${result.msg || ''}</div>`;
      }
    } catch(err) {
      fb.className = 'feedback-box show fail';
      fb.innerHTML = `⚠ Error: ${escapeHtml(err.message)}`;
    }
  };

  window.toggleHint = function(idx) {
    const h = document.getElementById(`hint-${idx}`);
    if (h) h.classList.toggle('show');
  };

  window.showAnswer = function(idx) {
    const c = PRACTICE_CHALLENGES[idx];
    const editor = document.getElementById(`prac-editor-${idx}`);
    if (editor) editor.value = c.answerSQL;
  };
}

function executeSQLStandalone(sql, db) {
  const q = sql.trim().replace(/\s+/g, ' ');
  const upper = q.toUpperCase();
  if (!upper.startsWith('SELECT')) throw new Error('Only SELECT queries supported in practice mode.');
  return execSelectStandalone(q, db);
}

function execSelectStandalone(q, db) {
  const litMatch = q.match(/^SELECT\s+'([^']*)'\s+AS\s+(\w+)\s*;?$/i);
  if (litMatch) return { rows: [{ [litMatch[2]]: litMatch[1] }] };
  const fromMatch = q.match(/FROM\s+(\w+)/i);
  if (!fromMatch) throw new Error('Missing FROM clause');
  const tableName = fromMatch[1];
  if (!db[tableName]) throw new Error(`Table '${tableName}' does not exist`);
  let rows = JSON.parse(JSON.stringify(db[tableName]));
  const joinMatch = q.match(/(INNER|LEFT)?\s*JOIN\s+(\w+)\s+ON\s+(\w+\.\w+)\s*=\s*(\w+\.\w+)/i);
  if (joinMatch) {
    const joinType = (joinMatch[1] || 'INNER').toUpperCase();
    const joinTable = joinMatch[2];
    if (!db[joinTable]) throw new Error(`Join table '${joinTable}' does not exist`);
    const [,lc] = joinMatch[3].split('.');
    const [,rc] = joinMatch[4].split('.');
    const joinRows = db[joinTable];
    const joined = [];
    rows.forEach(r => {
      const leftVal = r[lc];
      const match = joinRows.find(j => j[rc] === leftVal || j[lc] === leftVal);
      if (match) joined.push({ ...r, ...match });
      else if (joinType === 'LEFT') {
        const nullRow = {}; Object.keys(joinRows[0]||{}).forEach(k => nullRow[k]=null);
        joined.push({ ...r, ...nullRow });
      }
    });
    rows = joined;
  }
  const whereMatch = q.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+HAVING|\s*;?\s*$)/i);
  if (whereMatch) {
    rows = rows.filter(r => evalCondStandalone(whereMatch[1].trim(), r));
  }
  const groupMatch = q.match(/GROUP\s+BY\s+(\w+)/i);
  if (groupMatch) {
    const groupCol = groupMatch[1];
    const groups = {};
    rows.forEach(r => { const k = r[groupCol]; if (!groups[k]) groups[k]=[]; groups[k].push(r); });
    const selStr2 = q.match(/SELECT\s+(.*?)\s+FROM/i)?.[1]||'*';
    rows = Object.entries(groups).map(([key, grpRows]) => {
      const out = { [groupCol]: key };
      [...selStr2.matchAll(/(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*\*?\s*(\w+)?\s*\)\s*(?:AS\s+(\w+))?/gi)].forEach(m => {
        const fn=m[1].toUpperCase(), col=m[2], alias=m[3]||`${fn}(${col||'*'})`;
        if(fn==='COUNT') out[alias]=grpRows.length;
        else if(fn==='SUM') out[alias]=grpRows.reduce((s,r)=>s+(Number(r[col])||0),0);
        else if(fn==='AVG') out[alias]=+(grpRows.reduce((s,r)=>s+(Number(r[col])||0),0)/grpRows.length).toFixed(2);
      });
      return out;
    });
  }
  const orderMatch = q.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i);
  if (orderMatch) {
    const col=orderMatch[1], dir=(orderMatch[2]||'ASC').toUpperCase();
    rows.sort((a,b)=>{const av=a[col],bv=b[col];return dir==='ASC'?(av>bv?1:av<bv?-1:0):(av<bv?1:av>bv?-1:0);});
  }
  const selStr = q.match(/SELECT\s+(.*?)\s+FROM/i)?.[1]?.trim();
  if (selStr && selStr !== '*') {
    const cols = selStr.split(',').map(s => s.trim());
    rows = rows.map(r => {
      const out={};
      cols.forEach(c => {
        const am=c.match(/(\w+(?:\(.*?\))?)\s+AS\s+(\w+)/i);
        if(am) out[am[2]]=r[am[2]]??r[am[1]]??null;
        else out[c]=r[c]??null;
      });
      return out;
    });
  }
  return { rows };
}

function evalCondStandalone(cond, row) {
  const isNullM = cond.match(/(\w+)\s+IS\s+(NOT\s+)?NULL/i);
  if (isNullM) { const v=row[isNullM[1]]; return isNullM[2] ? v!=null : v==null; }
  const andP = cond.split(/\s+AND\s+/i);
  if (andP.length>1) return andP.every(p=>evalCondStandalone(p.trim(),row));
  const orP = cond.split(/\s+OR\s+/i);
  if (orP.length>1) return orP.some(p=>evalCondStandalone(p.trim(),row));
  for (const op of ['>=','<=','!=','<>','>','<','=']) {
    const idx=cond.indexOf(op); if(idx===-1) continue;
    const left=cond.slice(0,idx).trim(), right=cond.slice(idx+op.length).trim().replace(/^'|'$/g,'');
    const lv=row[left], rv=isNaN(right)||right===''?right:Number(right);
    if(op==='='||op==='==') return String(lv)===String(rv)||lv==rv;
    if(op==='!='||op==='<>') return lv!=rv;
    if(op==='>') return lv>rv; if(op==='<') return lv<rv;
    if(op==='>=') return lv>=rv; if(op==='<=') return lv<=rv;
  }
  return true;
}
// ============================================================
// LEGAL MODAL (Privacy Policy & Terms & Conditions)
// Opens as a pop-up instead of navigating to a separate page
// ============================================================

const PRIVACY_CONTENT = `
<div class="legal-modal-header">
  <span class="legal-modal-eyebrow">Legal</span>
  <h2>Privacy <span style="color:var(--primary)">Policy</span></h2>
  <p class="legal-modal-sub">We value your privacy and are committed to protecting any personal information collected from users.</p>
</div>
<div class="legal-modal-body">
  <div class="lm-section">
    <p>Welcome to SQLearn. We value your privacy and are committed to protecting any personal information collected from users.</p>
  </div>
  <div class="lm-section">
    <h3>Information We Collect</h3>
    <p>Our website may collect basic information such as:</p>
    <ul>
      <li>Name</li>
      <li>Email address</li>
      <li>User activity within the website</li>
    </ul>
  </div>
  <div class="lm-section">
    <h3>How We Use the Information</h3>
    <p>The collected information may be used to:</p>
    <ul>
      <li>Improve user experience</li>
      <li>Provide website services and features</li>
      <li>Respond to inquiries and concerns</li>
      <li>Maintain website security</li>
    </ul>
  </div>
  <div class="lm-section">
    <h3>Data Protection</h3>
    <p>We take appropriate measures to protect user information from unauthorized access, misuse, or disclosure.</p>
  </div>
  <div class="lm-section">
    <h3>Third-Party Services</h3>
    <p>Our website may use third-party tools or services that may collect information according to their own privacy policies.</p>
  </div>
  <div class="lm-section">
    <h3>User Rights</h3>
    <p>Users may request to update, correct, or delete their personal information by contacting the website administrator.</p>
  </div>
  <div class="lm-section">
    <h3>Changes to This Policy</h3>
    <p>This Privacy Policy may be updated from time to time. Any changes will be posted on this page.</p>
  </div>
  <div class="lm-section">
    <h3>Contact Us</h3>
    <p>If you have any questions regarding this Privacy Policy, please contact us at:</p>
    <ul>
      <li>Email: <a href="mailto:sqlearn.ph@gmail.com" style="color:var(--primary)">sqlearn.ph@gmail.com</a></li>
      <li>Contact Number: +63 968-351-6725</li>
    </ul>
  </div>
</div>`;

const TERMS_CONTENT = `
<div class="legal-modal-header">
  <span class="legal-modal-eyebrow">Legal</span>
  <h2>Terms &amp; <span style="color:var(--primary)">Conditions</span></h2>
  <p class="legal-modal-sub">By accessing and using this website, you agree to comply with the following Terms and Conditions.</p>
</div>
<div class="legal-modal-body">
  <div class="lm-section">
    <p>Welcome to SQLearn. By accessing and using this website, you agree to comply with the following Terms and Conditions.</p>
  </div>
  <div class="lm-section">
    <h3>Use of the Website</h3>
    <p>Users are expected to use the website responsibly and only for lawful purposes. Any misuse, unauthorized access, or harmful activity is strictly prohibited.</p>
  </div>
  <div class="lm-section">
    <h3>User Responsibilities</h3>
    <p>Users must provide accurate information when required and are responsible for maintaining the confidentiality of their accounts and personal data.</p>
  </div>
  <div class="lm-section">
    <h3>Intellectual Property</h3>
    <p>All content, materials, and features found on this website are the property of the website owners unless otherwise stated. Unauthorized copying, distribution, or modification is prohibited.</p>
  </div>
  <div class="lm-section">
    <h3>Limitation of Liability</h3>
    <p>The website owners are not responsible for any damages, data loss, or issues resulting from the use or inability to use the website.</p>
  </div>
  <div class="lm-section">
    <h3>Third-Party Links</h3>
    <p>This website may contain links to third-party websites. We are not responsible for the content, policies, or practices of these external sites.</p>
  </div>
  <div class="lm-section">
    <h3>Changes to the Terms</h3>
    <p>We reserve the right to update or modify these Terms and Conditions at any time. Changes will take effect immediately once posted on the website.</p>
  </div>
  <div class="lm-section">
    <h3>Termination</h3>
    <p>We reserve the right to suspend or terminate access to users who violate these Terms and Conditions.</p>
  </div>
  <div class="lm-section">
    <h3>Contact Information</h3>
    <p>For any questions or concerns regarding these Terms and Conditions, please contact us at:</p>
    <ul>
      <li>Email: <a href="mailto:sqlearn.ph@gmail.com" style="color:var(--primary)">sqlearn.ph@gmail.com</a></li>
      <li>Contact Number: +63 968-351-6725</li>
    </ul>
  </div>
</div>`;

function injectLegalModal() {
  if (document.getElementById('legal-modal')) return;
  const modal = document.createElement('div');
  modal.className = 'legal-modal';
  modal.id = 'legal-modal';
  modal.innerHTML = `
    <div class="legal-modal-panel" role="dialog" aria-modal="true">
      <button class="legal-modal-close" id="legal-modal-close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="legal-modal-scroll" id="legal-modal-scroll">
        <div class="legal-modal-content" id="legal-modal-content"></div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('legal-modal-close').addEventListener('click', closeLegalModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeLegalModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeLegalModal();
  });

  // TOC smooth scroll within modal
  modal.addEventListener('click', (e) => {
    const link = e.target.closest('.lm-toc-link');
    if (!link) return;
    e.preventDefault();
    const target = link.getAttribute('href');
    const el = modal.querySelector(target);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function openLegalModal(type) {
  injectLegalModal();
  const content = document.getElementById('legal-modal-content');
  const scroll = document.getElementById('legal-modal-scroll');
  content.innerHTML = type === 'privacy' ? PRIVACY_CONTENT : TERMS_CONTENT;
  scroll.scrollTop = 0;
  document.getElementById('legal-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLegalModal() {
  document.getElementById('legal-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Intercept footer links for privacy.html and terms.html
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href="privacy.html"], a[href="terms.html"]');
  if (!link) return;
  e.preventDefault();
  openLegalModal(link.getAttribute('href') === 'privacy.html' ? 'privacy' : 'terms');
});