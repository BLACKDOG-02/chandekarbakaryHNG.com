// ===== Chandekar Bakery — live site renderer =====
// Pulls content from /data (edited via /admin) and renders it here.
// You should not need to edit this file again after setup —
// all content changes happen through the /admin panel.

const REPO_OWNER = "BLACKDOG-02";
const REPO_NAME = "chandekarbakaryHNG.com";
const REPO_BRANCH = "main";

async function loadJSON(path) {
  const res = await fetch(path + "?_=" + Date.now()); // cache-bust so edits show up fast
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

// Folder collections (categories, products, festivals) create one file per
// entry with an unpredictable filename, so we list the folder via GitHub's
// public API, then fetch each file's raw contents.
async function loadFolder(folderPath) {
  const listUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folderPath}?ref=${REPO_BRANCH}`;
  const listRes = await fetch(listUrl);
  if (!listRes.ok) return [];
  const files = await listRes.json();
  if (!Array.isArray(files)) return [];

  const jsonFiles = files.filter(f => f.name.endsWith(".json"));
  const entries = await Promise.all(
    jsonFiles.map(async f => {
      try {
        const raw = await fetch(f.download_url + "?_=" + Date.now());
        const data = await raw.json();
        return { ...data, _slug: f.name.replace(/\.json$/, "") };
      } catch {
        return null;
      }
    })
  );
  return entries.filter(Boolean);
}

// ===== Theme (colors, font, shape) =====
function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;

  if (theme.primary_color) {
    root.style.setProperty("--plum", theme.primary_color);
    root.style.setProperty("--plum-dark", shadeColor(theme.primary_color, -12));
  }
  if (theme.secondary_color) root.style.setProperty("--gold", theme.secondary_color);
  if (theme.background_color) {
    root.style.setProperty("--ivory", theme.background_color);
    root.style.setProperty("--ivory-2", shadeColor(theme.background_color, -3));
  }
  if (theme.text_color) root.style.setProperty("--ink", theme.text_color);

  // Font family + corner shape aren't wired as CSS variables in the base
  // stylesheet, so we inject a small override block for them.
  const radius = theme.border_radius || "22px";
  const font = theme.font_family || "Fraunces";

  const styleTag = document.createElement("style");
  styleTag.id = "theme-overrides";
  styleTag.textContent = `
    h1, h2, h3, em, .logo, .price { font-family: '${font}', serif; }
    .cake-card, .process-inner, .phil-figure, .contact-box,
    .gallery-grid .g, .float-tag { border-radius: ${radius}; }
    button, .btn { border-radius: min(${radius}, 100px); }
  `;
  const existing = document.getElementById("theme-overrides");
  if (existing) existing.remove();
  document.head.appendChild(styleTag);

  // Load the font from Google Fonts if it's not the default already linked
  if (font && font !== "Fraunces") {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;500;600&display=swap`;
    document.head.appendChild(link);
  }
}

// Simple hex color shader for auto-generating a darker "hover" shade
function shadeColor(hex, percent) {
  try {
    let [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
    r = Math.max(0, Math.min(255, Math.round(r * (1 + percent / 100))));
    g = Math.max(0, Math.min(255, Math.round(g * (1 + percent / 100))));
    b = Math.max(0, Math.min(255, Math.round(b * (1 + percent / 100))));
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return hex;
  }
}

// ===== Business info (unchanged from before) =====
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

  const form = document.getElementById("enquiry-form");
  if (form && business.formspree_endpoint) {
    form.setAttribute("action", business.formspree_endpoint);
  }
}

// ===== Festival offer logic =====
// Returns the active offer (with computed discounted price) for a product,
// or null if no offer applies right now.
function getActiveOffer(product, festivals) {
  if (!product.offer || !product.offer.festival || !product.offer.discount_percent) return null;

  const festival = festivals.find(f => f._slug === product.offer.festival);
  if (!festival) return null;

  const now = new Date();
  const start = new Date(festival.start_date);
  const end = new Date(festival.end_date);
  if (now < start || now > end) return null;

  const discounted = product.price * (1 - product.offer.discount_percent / 100);
  return {
    festivalName: festival.name,
    discountPercent: product.offer.discount_percent,
    discountedPrice: discounted
  };
}

function formatPrice(n) {
  return `₹${Number(n).toFixed(0)}`;
}

// ===== Product card =====
function productCardHTML(product, festivals) {
  const imgPath = product.image && product.image.startsWith("http")
    ? product.image
    : (product.image || "").replace(/^\/?/, "/");

  const offer = getActiveOffer(product, festivals);

  const priceHTML = offer
    ? `<span class="price">
         <span style="text-decoration:line-through;opacity:0.55;font-size:0.85em;margin-right:6px;">${formatPrice(product.price)}</span>
         ${formatPrice(offer.discountedPrice)}
       </span>
       <span style="display:block;font-size:0.7rem;color:var(--gold);font-weight:600;margin-top:2px;">
         ${offer.discountPercent}% off · ${offer.festivalName}
       </span>`
    : `<span class="price">${formatPrice(product.price)}</span>`;

  return `
    <div class="cake-card reveal" data-category="${product.category || ""}">
      <div class="icon-wrap">
        <img src="${imgPath}" alt="${product.title}"
             onerror="this.replaceWith(Object.assign(document.createElement('div'), {
                className: 'icon-wrap-fallback',
                textContent: '${(product.title || "").replace(/'/g, "\\'")}',
                style: 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--blush);color:var(--plum);font-family:Fraunces,serif;font-size:0.95rem;text-align:center;padding:10px;'
             }))">
      </div>
      <h3>${product.title}</h3>
      <p class="flavor">${product.description || ""}</p>
      <div class="meta">
        ${priceHTML}
      </div>
    </div>
  `;
}

// ===== Category filter bar =====
function renderCategoryFilters(categories, onSelect) {
  const grid = document.getElementById("cake-grid");
  if (!grid) return;

  let bar = document.getElementById("category-filters");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "category-filters";
    bar.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;margin-bottom:32px;";
    grid.parentNode.insertBefore(bar, grid);
  }

  const buttons = [{ title: "All", _slug: "" }, ...categories];

  bar.innerHTML = buttons.map(cat => `
    <button type="button" class="category-filter-btn" data-cat="${cat._slug}"
      style="padding:10px 20px;border-radius:100px;border:1.5px solid var(--line);
             background:var(--ivory-2);color:var(--ink);font-size:0.85rem;font-weight:600;
             cursor:pointer;">
      ${cat.title}
    </button>
  `).join("");

  bar.querySelectorAll(".category-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      bar.querySelectorAll(".category-filter-btn").forEach(b => {
        b.style.background = "var(--ivory-2)";
        b.style.color = "var(--ink)";
      });
      btn.style.background = "var(--plum)";
      btn.style.color = "var(--ivory)";
      onSelect(btn.dataset.cat);
    });
  });

  // Mark "All" active by default
  const allBtn = bar.querySelector('[data-cat=""]');
  if (allBtn) {
    allBtn.style.background = "var(--plum)";
    allBtn.style.color = "var(--ivory)";
  }
}

function filterProducts(category) {
  document.querySelectorAll("#cake-grid .cake-card").forEach(card => {
    const matches = !category || card.dataset.category === category;
    card.style.display = matches ? "" : "none";
  });
}

// ===== Main render =====
async function renderShop() {
  const grid = document.getElementById("cake-grid");
  if (!grid) return;

  try {
    const [categories, products, festivals] = await Promise.all([
      loadFolder("data/categories"),
      loadFolder("data/products"),
      loadFolder("data/festivals")
    ]);

    if (products.length === 0) {
      grid.innerHTML = `<p style="color:var(--ink-soft)">No items yet — add your first cake or pastry from /admin.</p>`;
      return;
    }

    grid.innerHTML = products.map(p => productCardHTML(p, festivals)).join("");

    renderCategoryFilters(categories, (cat) => filterProducts(cat));

    // Populate the "preferred cake" dropdown on the contact form
    const flavorSelect = document.getElementById("flavor");
    if (flavorSelect) {
      flavorSelect.innerHTML = products.map(p => `<option>${p.title}</option>`).join("")
        + "<option>Not sure yet</option>";
    }

    observeReveals();
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--ink-soft)">Couldn't load the menu right now — please refresh in a moment.</p>`;
    console.error(err);
  }
}

// ===== Scroll reveal animation =====
function observeReveals() {
  const revealEls = document.querySelectorAll(".reveal:not(.in)");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14 });
  revealEls.forEach(el => io.observe(el));
}

// ===== Contact form submission (via Formspree) =====
function setupForm() {
  const form = document.getElementById("enquiry-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const statusEl = document.getElementById("form-status");
    const submitBtn = form.querySelector('button[type="submit"]');
    const action = form.getAttribute("action");

    if (!action || action.includes("YOUR_FORM_ID")) {
      statusEl.textContent = "Form isn't connected yet — add your Formspree endpoint in data/business.json.";
      statusEl.className = "form-status error";
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = "Sending…";
    statusEl.className = "form-status";

    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      });
      if (res.ok) {
        statusEl.textContent = "Thanks — your enquiry is in. We'll be in touch soon.";
        statusEl.className = "form-status success";
        form.reset();
      } else {
        statusEl.textContent = "Something went wrong sending that — please try again.";
        statusEl.className = "form-status error";
      }
    } catch (err) {
      statusEl.textContent = "Something went wrong sending that — please try again.";
      statusEl.className = "form-status error";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const theme = await loadJSON("data/theme.json");
    applyTheme(theme);
  } catch (err) {
    console.error("Theme load failed:", err);
  }

  try {
    const business = await loadJSON("data/business.json");
    renderBusinessInfo(business);
  } catch (err) {
    console.error("Business info load failed:", err);
  }

  await renderShop();
  setupForm();
  observeReveals();
});
