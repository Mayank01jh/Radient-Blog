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
            link.classList.toggle(
              'active',
              link.getAttribute('href') === `#${id}`
            );
          });
        }
      });
    },
    { threshold: 0.45 }
  );

  sections.forEach((sec) => observer.observe(sec));
})();
async function loadPosts() {
    const grid = document.getElementById('posts-grid');

    // Call GET /posts/
    const response = await fetch(`${API}/posts/`);
    const posts = await response.json();  // convert response to JS array

    grid.innerHTML = '';  // clear hardcoded cards

    posts.forEach(post => {
        const date = new Date(post.created_at).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });

        // Determine if logged-in user is the author
        let isAuthor = false;
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.sub === post.author_id) {
                    isAuthor = true;
                }
            } catch(e) {}
        }

        // Build card HTML
        grid.innerHTML += `
            <article class="post-card">
                <div class="post-meta">
                    <span class="post-tag">${post.tag}</span>
                    <span class="post-date">${date}</span>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-excerpt">${post.body.slice(0, 160)}…</p>
               <div style="display:flex; gap:10px; align-items:center; margin-top:4px; flex-wrap:wrap">
    <a href="#" class="post-link" onclick="openPost('${post.id}'); return false;">Read →</a>
    ${isAuthor ? `
        <button class="delete-btn" onclick="deletePost('${post.id}')">🗑 Delete</button>
        <button class="delete-btn" onclick="openEditModal('${post.id}', \`${post.title.replace(/`/g, "'")}\`, '${post.tag}', \`${post.body.replace(/`/g, "'")}\`)">✏ Edit</button>
    ` : ''}
</div>

            </article>
        `;

    });
}

// Call it when page loads
loadPosts();


// ── WRITE FORM: submit handler ───────────────────────────────────────────────
(function initForm() {
  const form      = document.getElementById('post-form');
  const statusEl  = document.getElementById('form-status');
  const grid      = document.getElementById('posts-grid');

  if (!form) return;

form.addEventListener('submit', async function (e) {
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, tag, body })
    });

    if (res.ok) {
      statusEl.style.color = '#a07850';
      statusEl.textContent = '✓ Post published!';
      form.reset();
      loadPosts();   // refresh grid from real DB
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

function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();

// ── POST CARDS: subtle entrance animation on load ────────────────────────────
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

// ── AUTH: login and save JWT token ──────────────────────────────────────────
async function login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('token', data.access_token);
        alert('✅ Logged in! You can now publish posts.');
    } else {
        alert(`❌ Login failed: ${data.detail}`);
    }
}

// ── AUTH: register new user ──────────────────────────────────────────────────
async function register(username, email, password) {
    const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (res.ok) {
        alert('✅ Registered! Now log in.');
    } else {
        alert(`❌ ${data.detail}`);
    }
}
// ── MODAL CONTROLS ───────────────────────────────────────────────────────────
function openAuthModal() {
  document.getElementById('auth-modal').style.display = 'flex';
}
function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}
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
    document.getElementById('auth-btn').textContent = '✓ Logged in';
    closeAuthModal();
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

// ── DELETE POST (protected) ───────────────────────────────────────────────
async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('⚠ Please log in to delete posts.');
    return;
  }

  const res = await fetch(`${API}/posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (res.ok) {
    alert('✓ Post deleted.');
    loadPosts();  // refresh list
  } else {
    const err = await res.json();
    alert(`❌ ${err.detail}`);
  }
}

// ── EDIT POST ────────────────────────────────────────────────────────────────
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
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: document.getElementById('edit-title').value,
      tag:   document.getElementById('edit-tag').value,
      body:  document.getElementById('edit-body').value
    })
  });
  if (res.ok) {
    closeEditModal();
    loadPosts();
  } else {
    alert('✗ Failed to update post.');
  }
}

// ── SEARCH / FILTER ──────────────────────────────────────────────────────────
function filterPosts() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const cards = document.querySelectorAll('.post-card');

  cards.forEach(card => {
    const title = card.querySelector('.post-title')?.textContent.toLowerCase() || '';
    const tag   = card.querySelector('.post-tag')?.textContent.toLowerCase() || '';
    const body  = card.querySelector('.post-excerpt')?.textContent.toLowerCase() || '';
    const match = title.includes(query) || tag.includes(query) || body.includes(query);
    card.style.display = match ? '' : 'none';
  });
}
// ── DARK MODE ────────────────────────────────────────────────────────────────
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('dark-toggle').textContent = isDark ? '☀️' : '🌙';
}

// Apply saved preference on load
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.textContent = '☀️';
  });
}

// ── PROFILE ──────────────────────────────────────────────────────────────────
let currentUsername = null;   // cached after first /auth/me

async function loadProfile() {
  const token = localStorage.getItem('token');
  if (!token) { alert('Please log in first.'); return; }

  const res  = await fetch(`${API}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (res.ok) {
    currentUsername = data.username;
    document.getElementById('profile-username').textContent = data.username;
    document.getElementById('profile-email').textContent    = data.email;
    document.getElementById('profile-bio-text').textContent = data.bio || 'No bio yet.';
    document.getElementById('profile-bio-input').value      = data.bio || '';
    
    const grid = document.getElementById('my-posts-grid');
    grid.innerHTML = '';
    data.posts.forEach(post => {
      const date = new Date(post.created_at).toLocaleDateString('en-US');
      grid.innerHTML += `
        <article class="post-card" style="padding:16px;">
          <h3 class="post-title" style="font-size:1.1rem">${post.title}</h3>
          <div class="post-meta" style="margin-bottom:8px;">${post.tag} · ${date}</div>
          <button class="delete-btn" onclick="deletePost('${post.id}')" style="margin:0;">🗑 Delete</button>
        </article>
      `;
    });
    document.getElementById('profile').style.display = 'block';
    document.getElementById('profile').scrollIntoView({ behavior: 'smooth' });
  } else {
    localStorage.removeItem('token');
    alert('Session expired. Please log in again.');
    document.getElementById('auth-btn').textContent = 'Log in';
  }
}

async function updateProfile(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) return;
  const bio = document.getElementById('profile-bio-input').value;
  
  const res = await fetch(`${API}/auth/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ bio })
  });
  
  if (res.ok) {
    const data = await res.json();
    document.getElementById('profile-bio-text').textContent = data.bio || 'No bio yet.';
    alert('Profile updated!');
  } else {
    alert('Failed to update profile.');
  }
}

// ── CHAT ─────────────────────────────────────────────────────────────────────
let chatSocket = null;

function setStatusBar(connected) {
  const dot  = document.querySelector('.chat-status-dot');
  const text = document.getElementById('chat-status-text');
  if (!dot || !text) return;
  dot.style.background = connected ? '#a0c878' : '#c0775a';
  text.textContent     = connected ? 'Connected · Town Square' : 'Disconnected';
}

function appendBubble(username, text, isMine) {
  const win = document.getElementById('chat-window');
  // Remove the welcome placeholder on first real message
  const placeholder = win.querySelector('.chat-empty');
  if (placeholder) placeholder.remove();

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isMine ? 'mine' : 'theirs'}`;
  bubble.innerHTML = `<strong>${username}</strong>${text}`;
  win.appendChild(bubble);
  win.scrollTop = win.scrollHeight;
}

function initChat() {
  document.getElementById('chat').style.display = 'block';
  document.getElementById('chat').scrollIntoView({ behavior: 'smooth' });
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('chat-window').innerHTML =
      '<p class="chat-empty">Please log in to join the chat.</p>';
    setStatusBar(false);
    return;
  }

  if (chatSocket && chatSocket.readyState === WebSocket.OPEN) return; // already connected

  const wsUrl = API.replace(/^http/, 'ws') + '/chat/ws';
  chatSocket = new WebSocket(wsUrl);

  chatSocket.onopen = () => setStatusBar(true);
  chatSocket.onclose = () => setStatusBar(false);

  chatSocket.onmessage = function(event) {
    try {
      const msg   = JSON.parse(event.data);
      const isMine = msg.username === currentUsername;
      appendBubble(msg.username, msg.text, isMine);
    } catch(e) {}
  };
}

async function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text || !chatSocket || chatSocket.readyState !== WebSocket.OPEN) return;

  // Ensure username is fetched
  if (!currentUsername) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const r = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok) currentUsername = d.username;
      } catch(e) {}
    }
  }

  const username = currentUsername || 'Anonymous';
  chatSocket.send(JSON.stringify({ username, text }));
  // Render own bubble immediately (echo)
  appendBubble(username, text, true);
  input.value = '';
}

function logout() {
  localStorage.removeItem('token');
  currentUsername = null;
  document.getElementById('auth-btn').textContent = 'Log in';
  document.getElementById('profile').style.display = 'none';
}

// ── READ POST MODAL ───────────────────────────────────────────────────────────
async function openPost(postId) {
  const modal    = document.getElementById('read-modal');
  const bodyEl   = document.getElementById('read-modal-body');
  const titleEl  = document.getElementById('read-modal-title');
  const tagEl    = document.getElementById('read-modal-tag');
  const dateEl   = document.getElementById('read-modal-date');
  const authorEl = document.getElementById('read-modal-author');

  // Show modal immediately with a loading state
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  titleEl.textContent  = '';
  tagEl.textContent    = '';
  dateEl.textContent   = '';
  authorEl.textContent = '';
  bodyEl.className     = 'read-modal-body loading';
  bodyEl.textContent   = 'Loading…';

  try {
    const res  = await fetch(`${API}/posts/${postId}`);
    if (!res.ok) throw new Error('Not found');
    const post = await res.json();

    const date = new Date(post.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    titleEl.textContent  = post.title;
    tagEl.textContent    = post.tag;
    dateEl.textContent   = date;
    authorEl.textContent = `Published on ${date}`;
    bodyEl.className     = 'read-modal-body';
    bodyEl.textContent   = post.body;   // pre-wrap keeps line breaks
    bodyEl.scrollTop     = 0;
  } catch (err) {
    bodyEl.className   = 'read-modal-body loading';
    bodyEl.textContent = '✗ Could not load post.';
  }
}

function closeReadModal() {
  document.getElementById('read-modal').style.display = 'none';
  document.body.style.overflow = '';
}

// Close when clicking the dark backdrop (not the box itself)
function handleReadModalClick(e) {
  if (e.target === document.getElementById('read-modal')) {
    closeReadModal();
  }
}

// Also close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeReadModal();
    closeAuthModal();
    closeEditModal();
  }
});
