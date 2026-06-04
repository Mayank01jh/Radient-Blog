const API = "https://radient-blog-api.onrender.com";
/* app.js — Radient Blog */

// ── NAV: active link on scroll ───────────────────────────────────────────────
(function initNavHighlight() {
  const sections = document.querySelectorAll('section[id], main[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { threshold: 0.45 }
  );
  sections.forEach((sec) => observer.observe(sec));
})();

// ── POSTS GRID ───────────────────────────────────────────────────────────────
async function loadPosts() {
  const grid = document.getElementById('posts-grid');
  try {
    const response = await fetch(`${API}/posts/`);
    const posts    = await response.json();

    grid.innerHTML = '';

    if (!posts.length) {
      grid.innerHTML = '<p style="color:var(--text-muted)">No posts yet. Be the first to write!</p>';
      return;
    }

    posts.forEach(post => {
      const date = new Date(post.created_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });

      // Check if logged-in user is the author
      let isAuthor = false;
      const token  = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub === post.author_id) isAuthor = true;
        } catch(e) {}
      }

      const ownerActions = isAuthor ? `
        <button class="delete-btn" onclick="deletePost('${post.id}')">🗑 Delete</button>
        <button class="delete-btn" onclick="openEditModal('${post.id}', \`${post.title.replace(/`/g,"'")}\`, '${post.tag}', \`${post.body.replace(/`/g,"'")}\`)">✏ Edit</button>
      ` : '';

      grid.innerHTML += `
        <article class="post-card" onclick="openReader('${post.id}')" style="cursor:pointer;">
          <div class="post-meta">
            <span class="post-tag">${post.tag}</span>
            <span class="post-date">${date}</span>
          </div>
          <h3 class="post-title">${post.title}</h3>
          <p class="post-excerpt">${post.body.slice(0, 160)}…</p>
          <div class="post-card-footer">
            <span class="post-read-cta">Read →</span>
            <div class="post-owner-actions" onclick="event.stopPropagation()">
              ${ownerActions}
            </div>
          </div>
        </article>
      `;
    });
  } catch(e) {
    grid.innerHTML = '<p style="color:var(--text-muted)">Could not load posts.</p>';
  }
}

loadPosts();

// ── WRITE FORM ───────────────────────────────────────────────────────────────
(function initForm() {
  const form     = document.getElementById('post-form');
  const statusEl = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      statusEl.textContent = '⚠ Please log in before publishing.';
      statusEl.style.color = '#c0775a';
      return;
    }

    const title = document.getElementById('post-title-input').value.trim();
    const tag   = document.getElementById('post-tag-input').value;
    const body  = document.getElementById('post-body-input').value.trim();

    if (!title || !tag || !body) {
      statusEl.textContent = 'Please fill in all fields.';
      statusEl.style.color = '#c0775a';
      return;
    }

    const res = await fetch(`${API}/posts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, tag, body })
    });

    if (res.ok) {
      statusEl.style.color  = '#a07850';
      statusEl.textContent  = '✓ Post published!';
      form.reset();
      loadPosts();
      setTimeout(() => {
        document.getElementById('posts').scrollIntoView({ behavior: 'smooth' });
        statusEl.textContent = '';
      }, 1200);
    } else {
      const err = await res.json();
      statusEl.textContent = `✗ ${err.detail || 'Failed to publish.'}`;
      statusEl.style.color = '#c0775a';
    }
  });
})();

// ── POST CARDS: entrance animation ───────────────────────────────────────────
(function animateCards() {
  const cards = document.querySelectorAll('.post-card');
  cards.forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(16px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity    = '1';
      card.style.transform  = 'translateY(0)';
    }, 80 + i * 70);
  });
})();

// ── AUTH ─────────────────────────────────────────────────────────────────────
function openAuthModal()  { document.getElementById('auth-modal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }

function switchTab(tab) {
  document.getElementById('login-form').style.display    = tab === 'login'    ? 'flex' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'flex' : 'none';
  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const status   = document.getElementById('login-status');

  const res  = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.access_token);
    document.getElementById('auth-btn').style.display   = 'none';
    document.getElementById('logout-btn').style.display = '';
    closeAuthModal();
    loadPosts(); // re-render to show author controls
  } else {
    status.textContent = `❌ ${data.detail}`;
    status.style.color = '#c0775a';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email    = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const status   = document.getElementById('register-status');

  const res  = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();

  if (res.ok) {
    status.style.color = '#a07850';
    status.textContent = '✅ Account created! Now log in.';
    switchTab('login');
  } else {
    status.textContent = `❌ ${data.detail}`;
    status.style.color = '#c0775a';
  }
}

function logout() {
  localStorage.removeItem('token');
  document.getElementById('auth-btn').style.display   = '';
  document.getElementById('logout-btn').style.display = 'none';
  loadPosts(); // re-render without author controls
}

// Restore login state on page load
(function restoreAuth() {
  if (localStorage.getItem('token')) {
    document.getElementById('auth-btn').style.display   = 'none';
    document.getElementById('logout-btn').style.display = '';
  }
})();

// ── DELETE / EDIT POST ────────────────────────────────────────────────────────
async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  const token = localStorage.getItem('token');
  if (!token) { alert('⚠ Please log in to delete posts.'); return; }

  const res = await fetch(`${API}/posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (res.ok) { loadPosts(); }
  else { const err = await res.json(); alert(`❌ ${err.detail}`); }
}

function openEditModal(id, title, tag, body) {
  document.getElementById('edit-id').value    = id;
  document.getElementById('edit-title').value = title;
  document.getElementById('edit-tag').value   = tag;
  document.getElementById('edit-body').value  = body;
  document.getElementById('edit-modal').style.display = 'flex';
}
function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

async function updatePost(e) {
  e.preventDefault();
  const id    = document.getElementById('edit-id').value;
  const token = localStorage.getItem('token');
  const res   = await fetch(`${API}/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      title: document.getElementById('edit-title').value,
      tag:   document.getElementById('edit-tag').value,
      body:  document.getElementById('edit-body').value
    })
  });
  if (res.ok) { closeEditModal(); loadPosts(); }
  else { alert('✗ Failed to update post.'); }
}

// ── SEARCH / FILTER ──────────────────────────────────────────────────────────
function filterPosts() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const cards = document.querySelectorAll('.post-card');
  cards.forEach(card => {
    const title = card.querySelector('.post-title')?.textContent.toLowerCase()  || '';
    const tag   = card.querySelector('.post-tag')?.textContent.toLowerCase()    || '';
    const body  = card.querySelector('.post-excerpt')?.textContent.toLowerCase()|| '';
    card.style.display = (title.includes(query) || tag.includes(query) || body.includes(query)) ? '' : 'none';
  });
}

// ── DARK MODE ────────────────────────────────────────────────────────────────
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('dark-toggle').textContent = isDark ? '☀️' : '🌙';
}
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.textContent = '☀️';
  });
}

// ── IMMERSIVE READER ─────────────────────────────────────────────────────────
const readerOverlay = document.getElementById('reader-overlay');
const readerArticle = document.getElementById('reader-article');

// Reading progress on scroll
readerArticle?.addEventListener('scroll', () => {
  const { scrollTop, scrollHeight, clientHeight } = readerArticle;
  const pct = scrollHeight - clientHeight > 0
    ? (scrollTop / (scrollHeight - clientHeight)) * 100
    : 100;
  document.getElementById('reader-progress').style.width = pct + '%';

  // Time left (avg 200 wpm, update every scroll)
  const totalWords    = (document.getElementById('reader-body')?.textContent || '').split(/\s+/).length;
  const wordsRead     = Math.round((pct / 100) * totalWords);
  const wordsLeft     = Math.max(0, totalWords - wordsRead);
  const minsLeft      = Math.ceil(wordsLeft / 200);
  const timeEl        = document.getElementById('reader-time-left');
  if (timeEl) timeEl.textContent = pct < 99 ? `${minsLeft} min left` : 'Done ✓';
});

async function openReader(postId) {
  // Reset state
  readerOverlay.classList.remove('open');
  document.getElementById('reader-title').textContent  = '';
  document.getElementById('reader-tag').textContent    = '';
  document.getElementById('reader-date').textContent   = '';
  document.getElementById('reader-byline').textContent = '';
  document.getElementById('reader-body').textContent   = '';
  document.getElementById('reader-progress').style.width = '0%';
  document.getElementById('reader-time-left').textContent = '';
  readerArticle.scrollTop = 0;

  // Open overlay with loading spinner
  document.body.style.overflow = 'hidden';
  readerOverlay.classList.add('open');
  document.getElementById('reader-body').innerHTML =
    '<div class="reader-loading"><div class="reader-spinner"></div><p>Loading…</p></div>';

  try {
    const res  = await fetch(`${API}/posts/${postId}`);
    if (!res.ok) throw new Error('Not found');
    const post = await res.json();

    const date = new Date(post.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const wordCount = post.body.split(/\s+/).length;
    const readMins  = Math.max(1, Math.ceil(wordCount / 200));

    document.getElementById('reader-tag').textContent    = post.tag;
    document.getElementById('reader-date').textContent   = date;
    document.getElementById('reader-title').textContent  = post.title;
    document.getElementById('reader-byline').textContent = `${readMins} min read · ${date}`;
    document.getElementById('reader-time-left').textContent = `${readMins} min left`;

    // Render body — split paragraphs on double newlines, wrap each in <p>
    const bodyEl = document.getElementById('reader-body');
    bodyEl.innerHTML = '';
    const paragraphs = post.body.split(/\n\n+/);
    paragraphs.forEach(para => {
      const p = document.createElement('p');
      p.textContent = para.trim();
      if (p.textContent) bodyEl.appendChild(p);
    });
    // If no double newlines, just render single lines
    if (!paragraphs.length || (paragraphs.length === 1 && paragraphs[0] === post.body)) {
      bodyEl.innerHTML = '';
      post.body.split('\n').forEach(line => {
        if (line.trim()) {
          const p = document.createElement('p');
          p.textContent = line.trim();
          bodyEl.appendChild(p);
        }
      });
    }

    readerArticle.scrollTop = 0;
  } catch(err) {
    document.getElementById('reader-body').innerHTML =
      '<p style="color:var(--text-muted); text-align:center;">✗ Could not load this post.</p>';
  }
}

function closeReader() {
  readerOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeReader();
    closeAuthModal();
    closeEditModal();
  }
});
