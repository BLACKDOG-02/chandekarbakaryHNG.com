// ===== Load business info and cake menu from the /data folder =====
// Edit data/business.json and data/cakes.json — this file does not need to change.

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

function renderBusinessInfo(business) {
  document.querySelectorAll('[data-business="name"]').forEach(el => el.textContent = business.name);
  document.querySelectorAll('[data-business="tagline"]').forEach(el => el.textContent = business.tagline);
  document.querySelectorAll('[data-business="intro"]').forEach(el => el.textContent = business.intro);
  document.querySelectorAll('[data-business="address"]').forEach(el => el.textContent = business.address);
  document.querySelectorAll('[data-business="hours"]').forEach(el => el.textContent = business.hours);
  document.querySelectorAll('[data-business="email"]').forEach(el => el.textContent = business.email);
  document.querySelectorAll('[data-business="phone"]').forEach(el => el.textContent = business.phone);
  document.querySelectorAll('[data-business="year-name"]').forEach(el => {
    el.textContent = `© ${new Date().getFullYear()} ${business.name}`;
  });

  const form = document.getElementById('enquiry-form');
  if (form && business.formspree_endpoint) {
    form.setAttribute('action', business.formspree_endpoint);
  }

  const flavorSelect = document.getElementById('flavor');
  return business;
}

function cakeCardHTML(cake) {
  // Falls back to a plain placeholder block if the photo file isn't there yet.
  const imgPath = `images/cakes/${cake.image}`;
  return `
    <div class="cake-card reveal">
      <div class="icon-wrap">
        <img src="${imgPath}" alt="${cake.name}"
             onerror="this.replaceWith(Object.assign(document.createElement('div'), {
                className: 'icon-wrap-fallback',
                textContent: '${cake.name.replace(/'/g, "\\'")}',
                style: 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--blush);color:var(--plum);font-family:Fraunces,serif;font-size:0.95rem;text-align:center;padding:10px;'
             }))">
      </div>
      <h3>${cake.name}</h3>
      <p class="flavor">${cake.description}</p>
      <div class="meta">
        <span class="price">${cake.price}</span>
        <span class="serves">${cake.serves}</span>
      </div>
    </div>
  `;
}

async function renderCakes() {
  const grid = document.getElementById('cake-grid');
  if (!grid) return;
  try {
    const cakes = await loadJSON('data/cakes.json');
    grid.innerHTML = cakes.map(cakeCardHTML).join('');

    // Also populate the "preferred cake" dropdown on the contact form
    const flavorSelect = document.getElementById('flavor');
    if (flavorSelect) {
      flavorSelect.innerHTML = cakes.map(c => `<option>${c.name}</option>`).join('')
        + '<option>Not sure yet</option>';
    }

    observeReveals();
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--ink-soft)">Couldn't load the menu right now — check data/cakes.json.</p>`;
    console.error(err);
  }
}

// ===== Scroll reveal animation =====
function observeReveals() {
  const revealEls = document.querySelectorAll('.reveal:not(.in)');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14 });
  revealEls.forEach(el => io.observe(el));
}

// ===== Contact form submission (via Formspree) =====
function setupForm() {
  const form = document.getElementById('enquiry-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const statusEl = document.getElementById('form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const action = form.getAttribute('action');

    if (!action || action.includes('YOUR_FORM_ID')) {
      statusEl.textContent = 'Form isn\'t connected yet — add your Formspree endpoint in data/business.json.';
      statusEl.className = 'form-status error';
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = 'Sending…';
    statusEl.className = 'form-status';

    try {
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      if (res.ok) {
        statusEl.textContent = 'Thanks — your enquiry is in. We\'ll be in touch soon.';
        statusEl.className = 'form-status success';
        form.reset();
      } else {
        statusEl.textContent = 'Something went wrong sending that — please try again.';
        statusEl.className = 'form-status error';
      }
    } catch (err) {
      statusEl.textContent = 'Something went wrong sending that — please try again.';
      statusEl.className = 'form-status error';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const business = await loadJSON('data/business.json');
    renderBusinessInfo(business);
  } catch (err) {
    console.error(err);
  }
  await renderCakes();
  setupForm();
  observeReveals();
});
