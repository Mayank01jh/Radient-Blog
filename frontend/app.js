const API = "https://radient-blog-api.onrender.com";
/* app.js — Radient Blog */

// NAV: active link on scroll
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
    <a href="#" class="post-link">Read →</a>
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
async function loadProfile() {
  const token = localStorage.getItem('token');
  if (!token) { alert('Please log in first.'); return; }

  const res  = await fetch(`${API}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();

  document.getElementById('profile-username').textContent = data.username;
  document.getElementById('profile-email').textContent    = data.email;

  const grid = document.getElementById('my-posts-grid');
  grid.innerHTML = '';
  data.posts.forEach(post => {
    const date = new Date(post.created_at).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    grid.innerHTML += `
      <article class="post-card">
        <div class="post-meta">
          <span class="post-tag">${post.tag}</span>
          <span class="post-date">${date}</span>
        </div>
        <h3 class="post-title">${post.title}</h3>
        <p class="post-excerpt">${post.body.slice(0, 160)}…</p>
      </article>
    `;
  });

  document.getElementById('profile').style.display = 'block';
  document.getElementById('profile').scrollIntoView({ behavior: 'smooth' });
}

function logout() {
  localStorage.removeItem('token');
  document.getElementById('auth-btn').textContent = 'Log in';
  document.getElementById('profile').style.display = 'none';
}
