# Chandekar Bakery — Website

A custom celebration cake site. You can edit the menu, photos, and business
details without touching any code — just edit two files.

## Project layout

```
index.html              → page structure (rarely needs editing)
css/style.css            → all visual styling
js/main.js                → loads the JSON files and renders the page
data/cakes.json          → EDIT THIS to add/change/remove cakes
data/business.json       → EDIT THIS to change name, address, hours, contact
images/cakes/            → put your cake photos here
.github/workflows/       → auto-deploys the site to GitHub Pages
```


## How to add or edit a cake

Open `data/cakes.json`. Each cake looks like this:

```json
{
  "name": "Fig & Brown Butter",
  "description": "Brown-butter sponge, roasted fig compote, mascarpone frosting, torn pistachio.",
  "price": "$86",
  "serves": "Serves 10–12",
  "image": "fig-brown-butter.jpg"
}
```

- To **add a cake**, copy one of the blocks (including the `{ }` and comma) and edit the values.
- To **remove a cake**, delete its whole block.
- To **reorder cakes**, move the blocks up or down in the file.

Save the file — the site updates automatically, no other changes needed.

## How to add a photo

1. Drop your image file into `images/cakes/` (JPG or PNG, ideally square-ish, under 1MB works best for load speed).
2. In `data/cakes.json`, set `"image"` to that exact filename, e.g. `"image": "fig-brown-butter.jpg"`.

If a photo is missing, the site automatically shows a placeholder with the cake's name instead of a broken image — so it's safe to add cakes before you have photos ready.

## How to update business info

Open `data/business.json` and edit:

```json
{
  "name": "Chandekar Bakery",
  "tagline": "Cake, considered from crumb to crest.",
  "intro": "One sentence describing the bakery, shown under the headline.",
  "address": "Your studio address",
  "hours": "Tue–Sat, 9am–4pm",
  "email": "hello@chandekarbakary.com",
  "phone": "Your phone number",
  "formspree_endpoint": "https://formspree.io/f/YOUR_FORM_ID"
}
```

These values automatically fill in the name/logo, contact section, and footer.

## Connecting the contact form (Formspree)

The enquiry form doesn't send anywhere until you connect it:

1. Go to [formspree.io](https://formspree.io) and create a free account.
2. Create a new form — it gives you an endpoint URL like `https://formspree.io/f/abcd1234`.
3. Paste that into `"formspree_endpoint"` in `data/business.json`.
4. Confirm your email the first time someone submits the form (Formspree sends a one-time verification).

## Previewing locally

You can't just double-click `index.html` — the browser blocks JSON loading from local files.
Instead, run a tiny local server from this folder:

```bash
# Python (usually already installed on Mac/Linux)
python3 -m http.server 8000

# then open:
http://localhost:8000
```

Or use the "Live Server" extension in VS Code.

## Deploying (GitHub Pages)

This repo includes `.github/workflows/deploy.yml`, which automatically publishes
the site every time you push to the `main` branch.

One-time setup after creating the repo on GitHub:
1. Go to the repo's **Settings → Pages**.
2. Under "Build and deployment", set **Source** to **GitHub Actions**.
3. Push any change to `main` — the site will build and go live at
   `https://<your-username>.github.io/<repo-name>/`.

## Custom domain

Once live on GitHub Pages, you can point your own domain (e.g. `chandekarbakary.com`)
at it under **Settings → Pages → Custom domain**.
