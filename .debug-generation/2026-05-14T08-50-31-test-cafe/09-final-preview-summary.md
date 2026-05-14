# Final Preview Summary

- Trace ID: 2026-05-14T08-50-31-test-cafe
- Business: Test Cafe
- Section order: hero -> gallery -> features -> testimonials -> faq -> cta -> contact
- Rendered section count: 7
- Gallery count: 1
- Testimonial count: 1
- Fallback usage: no
- Parse repairs: 7
- Missing sections: none
- Renderer warnings: none
- Errors logged: 0

## Rendered HTML Snapshot

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Premium website for Test Cafe—Cafe services with modern design and seamless booking." />
  <title>Test Cafe | Preview</title>
  <style>
:root {
  --bg: #FDFBF7;
  --surface: #FFFFFF;
  --primary: #2A2522;
  --accent: #C05E44;
  --text: #3E3834;
  --muted: #A8A09B;
  --outline: #E8E3DF;
  --radius: lg;
  --heading-font: Fraunces, ui-serif, Georgia, serif;
  --body-font: Inter, Inter, ui-sans-serif, system-ui;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--body-font);
  color: var(--text);
  background: radial-gradient(circle at 18% 12%, rgba(124,58,237,.18), transparent 32%), radial-gradient(circle at 88% 70%, rgba(16,185,129,.14), transparent 28%), var(--bg);
  line-height: 1.65;
  letter-spacing: .006em;
  min-height: 100vh;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(to right, color-mix(in srgb, var(--outline) 20%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--outline) 20%, transparent) 1px, transparent 1px);
  background-size: 52px 52px;
  opacity: .08;
}
a { color: inherit; text-decoration: none; }
img { display: block; width: 100%; max-width: 100%; }
.site-shell {
  width: min(1240px, calc(100% - 40px));
  margin: 0 auto;
  padding: 28px 0 128px;
  position: relative;
  z-index: 1;
}
.site-header {
  position: sticky;
  top: 14px;
  z-index: 40;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 16px 22px;
  border-radius: 20px;
  border: 1px solid var(--outline);
  background: color-mix(in srgb, var(--surface) 62%, transparent);
  backdrop-filter: blur(18px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, .08);
  transition: all .3s cubic-bezier(.4, 0, .2, 1);
}
.site-header:hover {
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  box-shadow: 0 12px 48px rgba(0, 0, 0, .12);
}
.brandmark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: -.008em;
  font-size: 1.02rem;
  transition: transform .2s ease;
}
.brandmark:hover { transform: translateX(2px); }
.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--primary) 22%, transparent);
  transition: transform .3s ease;
}
.brandmark:hover .brand-dot { transform: scale(1.15); }
.top-nav {
  display: flex;
  justify-content: center;
  gap: 28px;
  flex-wrap: wrap;
}
.top-nav a {
  color: var(--muted);
  font-size: .92rem;
  font-weight: 500;
  letter-spacing: .01em;
  transition: color .2s ease, transform .2s ease;
  position: relative;
}
.top-nav a::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  transition: width .3s ease;
}
.top-nav a:hover::after { width: 100%; }
.top-nav a:hover { color: var(--text); transform: translateY(-1px); }
.site-section {
  margin-top: 88px;
  margin-bottom: 88px;
  animation: fadeInUp .7s ease-out backwards;
}
.site-section:nth-child(even) { background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 4%, transparent) 0%, color-mix(in srgb, var(--primary) 3%, transparent) 100%); padding: 48px 0; margin-left: -40px; margin-right: -40px; padding-left: 40px; padding-right: 40px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
.section-heading { margin-bottom: clamp(28px, 3vw, 48px); }
.section-heading h2 { max-width: 16ch; font-size: clamp(2rem, 4.2vw, 3.4rem); font-weight: 700; line-height: 1.1; letter-spacing: -.02em; }
.eyebrow {
  text-transform: uppercase;
  letter-spacing: .28em;
  font-weight: 700;
  font-size: .68rem;
  color: color-mix(in srgb, var(--accent) 78%, var(--text));
  margin-bottom: 14px;
  display: block;
}
.section-heading h2,
.hero h1,
.final-cta-card h2 {
  font-family: var(--heading-font);
  letter-spacing: -.025em;
  line-height: 1.08;
  margin: 0;
}
.hero {
  display: grid;
  gap: clamp(40px, 6vw, 64px);
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  align-items: center;
  padding: clamp(20px, 3vw, 48px) 0;
}
.hero h1 { font-size: clamp(3.2rem, 9vw, 6.4rem); margin-bottom: 24px; font-weight: 800; line-height: 1.08; }
.hero p { font-size: clamp(1.08rem, 2.2vw, 1.55rem); color: var(--muted); max-width: 62ch; margin: 0 0 28px; line-height: 1.55; }
.hero-copy { position: relative; z-index: 2; }
.hero-stats {
  margin-top: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.hero-stats span {
  font-size: .74rem;
  letter-spacing: .15em;
  text-transform: uppercase;
  font-weight: 600;
  border: 1.5px solid var(--outline);
  border-radius: 999px;
  padding: 8px 16px;
  color: var(--muted);
  transition: all .3s ease;
  background: color-mix(in srgb, var(--surface) 40%, transparent);
}
.hero-stats span:hover { border-color: var(--accent); color: var(--text); background: color-mix(in srgb, var(--accent) 12%, transparent); }
.hero-media {
  overflow: hidden;
  border-radius: calc(var(--radius) + 8px);
  border: 1.5px solid var(--outline);
  box-shadow: 0 32px 96px rgba(0, 0, 0, .18), inset 0 1px 0 rgba(255, 255, 255, .1);
  position: relative;
  aspect-ratio: 4 / 3;
}
.hero-media img { object-fit: cover; width: 100%; height: 100%; transition: transform .6s cubic-bezier(.4, 0, .2, 1); }
.hero:hover .hero-media img { transform: scale(1.04); }
.hero-immersive {
  position: relative;
  min-height: 76vh;
  border-radius: calc(var(--radius) + 12px);
  overflow: hidden;
  margin-left: -40px;
  margin-right: -40px;
  width: calc(100% + 80px);
}
.immersive-media {
  position: absolute;
  inset: 0;
  border: none;
  box-shadow: none;
}
.immersive-media img { height: 100%; object-fit: cover; }
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, rgba(0,0,0,.68) 8%, rgba(0,0,0,.22) 62%, rgba(0,0,0,.48) 100%);
}
.hero-copy-overlay {
  position: relative;
  align-self: end;
  padding: clamp(32px, 6vw, 56px);
  z-index: 3;
  color: white;
}
.hero-copy-overlay h1 { color: white; }
.hero-copy-overlay .eyebrow { color: rgba(255, 255, 255, .85); }
.hero-copy-overlay p { color: rgba(255, 255, 255, .8); }
.pill-row, .cta-row { display: flex; flex-wrap: wrap; gap: 14px; }
.feature-grid, .testimonial-grid { display: flex; flex-wrap: wrap; gap: 16px; }
.pill {
  border: 1.5px solid var(--outline);
  border-radius: 999px;
  padding: 10px 18px;
  font-size: .92rem;
  font-weight: 500;
  color: var(--muted);
  background: color-mix(in srgb, var(--surface) 35%, transparent);
  transition: all .2s ease;
}
.pill:hover { border-color: var(--accent); color: var(--text); background: color-mix(in srgb, var(--accent) 12%, transparent); }
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  border-radius: 999px;
  border: 1.5px solid var(--outline);
  padding: 0 24px;
  font-weight: 600;
  font-size: .98rem;
  letter-spacing: .01em;
  transition: all .3s cubic-bezier(.4, 0, .2, 1);
  position: relative;
  overflow: hidden;
}
.button::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,.1) 100%);
  opacity: 0;
  transition: opacity .3s ease;
  pointer-events: none;
}
.button:hover::before { opacity: 1; }
.button:hover { transform: translateY(-3px); }
.button-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 65%, var(--accent) 35%));
  box-shadow: 0 16px 48px color-mix(in srgb, var(--primary) 42%, transparent), inset 0 1px 0 rgba(255, 255, 255, .15);
  border: none;
}
.button-primary:hover {
  box-shadow: 0 22px 64px color-mix(in srgb, var(--primary) 48%, transparent), inset 0 1px 0 rgba(255, 255, 255, .2);
}
.button-secondary {
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  color: var(--text);
  border: 1.5px solid var(--outline);
}
.button-secondary:hover {
  background: color-mix(in srgb, var(--surface) 85%, transparent);
  border-color: var(--accent);
}
.feature-grid-cards {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}
.feature-grid-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 18px;
}
.feature-card {
  grid-column: span 6;
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  border: 1.5px solid var(--outline);
  border-radius: calc(var(--radius) + 2px);
  padding: 32px;
  position: relative;
  backdrop-filter: blur(18px);
  transition: all .4s cubic-bezier(.4, 0, .2, 1);
  overflow: hidden;
}
.feature-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, .1) 100%);
  opacity: 0;
  transition: opacity .4s ease;
  pointer-events: none;
}
.feature-card:hover {
  border-color: var(--accent);
  box-shadow: 0 16px 56px color-mix(in srgb, var(--accent) 18%, transparent), 0 0 0 1px inset rgba(255, 255, 255, .1);
  transform: translateY(-4px);
}
.feature-card:hover::before { opacity: 1; }
.feature-grid-list .feature-card { grid-column: span 1; }
.feature-index {
  display: inline-flex;
  font-size: .72rem;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
  font-weight: 700;
}
.feature-card h3 { margin: 0 0 12px; font-size: clamp(1.4rem, 2.4vw, 1.7rem); font-family: var(--heading-font); font-weight: 700; line-height: 1.2; }
.feature-card p { margin: 0; color: var(--muted); font-size: 1.02rem; line-height: 1.6; }
.feature-card:nth-child(2n) { transform: translateY(20px); }
.feature-card:nth-child(3n) { margin-top: 8px; }
.feature-card:hover { transform: translateY(-4px); }
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}
.gallery-item {
  overflow: hidden;
  border-radius: calc(var(--radius) + 4px);
  border: 1.5px solid var(--outline);
  min-height: 240px;
  position: relative;
  background: var(--surface);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .08);
  transition: all .4s cubic-bezier(.4, 0, .2, 1);
}
.gallery-item img {
  height: 100%;
  object-fit: cover;
  transition: transform .7s cubic-bezier(.4, 0, .2, 1);
  width: 100%;
}
.gallery-item:hover {
  box-shadow: 0 18px 52px rgba(0, 0, 0, .14);
  border-color: var(--accent);
}
.gallery-item:hover img { transform: scale(1.08); }
.gallery-item-1 { grid-column: span 7; min-height: 380px; }
.gallery-item-2 { grid-column: span 5; min-height: 380px; }
.gallery-item-3 { grid-column: span 5; min-height: 280px; }
.gallery-item-4 { grid-column: span 7; min-height: 280px; }
.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}
.testimonial-card {
  grid-column: span 4;
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  border: 1.5px solid var(--outline);
  border-radius: calc(var(--radius) + 2px);
  padding: 28px;
  position: relative;
  backdrop-filter: blur(18px);
  transition: all .4s cubic-bezier(.4, 0, .2, 1);
  overflow: hidden;
}
.testimonial-card::before {
  content: '"';
  position: absolute;
  top: -8px;
  right: 12px;
  font-size: 8rem;
  color: color-mix(in srgb, var(--accent) 12%, transparent);
  font-family: Georgia, serif;
  line-height: 1;
}
.testimonial-card:hover {
  border-color: var(--accent);
  box-shadow: 0 16px 52px color-mix(in srgb, var(--accent) 22%, transparent), 0 0 0 1px inset rgba(255, 255, 255, .1);
  transform: translateY(-6px);
}
.testimonial-card:nth-child(2n) { transform: translateY(16px); }
.testimonial-card:hover { transform: translateY(-6px); }
.testimonial-card p { margin: 0 0 
```

## WordPress Blocks Snapshot

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WordPress Block Output</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; line-height: 1.5; padding: 24px; color: #111827; background: #f8fafc; }
    h1, h2, h3 { margin-bottom: 0.5rem; }
    section { margin-bottom: 2rem; padding: 1rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow: auto; }
    .meta { color: #475569; }
  </style>
</head>
<body>
  <h1>WordPress Content Trace</h1>
  <p class="meta">Business: Test Cafe | Category: Cafe | Pages: 6</p>
  <section>
    <h2>Generated Gutenberg Blocks</h2>
    <pre>&lt;!-- wp:navigation {&quot;layout&quot;:{&quot;type&quot;:&quot;flex&quot;,&quot;justifyContent&quot;:&quot;center&quot;}} --&gt;
&lt;nav class=&quot;wp-block-navigation&quot;&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/&quot;&gt;Home&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/about/&quot;&gt;About&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/services/&quot;&gt;Signature Dishes &amp;amp; Experiences&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/gallery/&quot;&gt;Dining Room &amp;amp; Detail&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/faq/&quot;&gt;Dining Questions&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/contact/&quot;&gt;Visit Test Cafe&lt;/a&gt;&lt;/nav&gt;
&lt;!-- /wp:navigation --&gt;

&lt;!-- wp:html --&gt;

&lt;section class=&quot;wp-section wp-hero wp-hero--split&quot; id=&quot;top&quot; data-layout=&quot;hero-immersive&quot;&gt;
	&lt;div class=&quot;wp-hero__content&quot;&gt;
		&lt;p class=&quot;wp-hero__badge&quot;&gt;San Francisco&lt;/p&gt;
		&lt;h1&gt;Morning Rituals, Elevated.&lt;/h1&gt;
		&lt;p&gt;Artisanal espresso and house-baked pastries served in a sunlit sanctuary on Main Street.&lt;/p&gt;
		&lt;div class=&quot;wp-hero__actions&quot;&gt;
			&lt;a class=&quot;wp-button wp-button--primary&quot; href=&quot;#contact&quot;&gt;Order Ahead&lt;/a&gt;
			&lt;a class=&quot;wp-button wp-button--secondary&quot; href=&quot;#about&quot;&gt;View Seasonal Menu&lt;/a&gt;
		&lt;/div&gt;
	&lt;/div&gt;
	
&lt;/section&gt;
&lt;!-- /wp:html --&gt;

&lt;!-- wp:html --&gt;

&lt;section class=&quot;wp-section wp-features wp-features--bento&quot; id=&quot;services&quot; data-layout=&quot;feature-grid&quot;&gt;
	&lt;header class=&quot;wp-section__header&quot;&gt;
		&lt;p class=&quot;wp-section__eyebrow&quot;&gt;Services&lt;/p&gt;
		&lt;h2&gt;The Craft Behind the Cup&lt;/h2&gt;
	&lt;/header&gt;
	&lt;div class=&quot;wp-features__grid wp-features__grid--bento&quot;&gt;
		
		&lt;article class=&quot;wp-feature wp-feature--card wp-feature--lead&quot;&gt;
			&lt;span class=&quot;wp-feature__index&quot;&gt;01&lt;/span&gt;
			&lt;h3&gt;Single-Origin Roasts&lt;/h3&gt;
			&lt;p&gt;Partnering directly with farmers, our beans are roasted light to preserve their distinct, origin-specific tasting notes.&lt;/p&gt;
		&lt;/article&gt;
		&lt;article class=&quot;wp-feature wp-feature--card wp-feature--support&quot;&gt;
			&lt;span class=&quot;wp-feature__index&quot;&gt;02&lt;/span&gt;
			&lt;h3&gt;House-Made Pastries&lt;/h3&gt;
			&lt;p&gt;Laminated doughs and seasonal tarts, baked fresh in our kitchen every morning before the sun comes up.&lt;/p&gt;
		&lt;/article&gt;
		&lt;article class=&quot;wp-feature wp-feature--card wp-feature--support&quot;&gt;
			&lt;span class=&quot;wp-feature__index&quot;&gt;03&lt;/span&gt;
			&lt;h3&gt;Botanical Infusions&lt;/h3&gt;
			&lt;p&gt;A curated selection of loose-leaf craft teas and delicate, house-steeped floral syrups.&lt;/p&gt;
		&lt;/article&gt;
		&lt;article class=&quot;wp-feature wp-feature--card wp-feature--support&quot;&gt;
			&lt;span class=&quot;wp-feature__index&quot;&gt;04&lt;/span&gt;
			&lt;h3&gt;Quiet Workspaces&lt;/h3&gt;
			&lt;p&gt;Thoughtfully zoned areas featuring generous oak tables, high-speed Wi-Fi, and integrated outlets for deep work.&lt;/p&gt;
		&lt;/article&gt;
	&lt;/div&gt;
&lt;/section&gt;
&lt;!-- /wp:html --&gt;

&lt;!-- wp:html --&gt;

&lt;section class=&quot;wp-section wp-testimonials wp-testimonials--cards&quot; id=&quot;testimonials&quot; data-layout=&quot;testimonial-carousel&quot;&gt;
	&lt;header class=&quot;wp-section__header&quot;&gt;
		&lt;p class=&quot;wp-section__eyebrow&quot;&gt;Testimonials&lt;/p&gt;
		&lt;h2&gt;Conversations Over Coffee&lt;/h2&gt;
	&lt;/header&gt;
	&lt;div class=&quot;wp-testimonials__grid&quot;&gt;
		
		&lt;article class=&quot;wp-testimonial wp-testimonial--card&quot;&gt;
			&lt;blockquote&gt;&lt;p&gt;The cortado here rivals anything I&amp;#39;ve had in Italy. The handmade terracotta mugs and minimalist aesthetic make every visit a joy.&lt;/p&gt;&lt;/blockquote&gt;
			&lt;footer&gt;&lt;strong&gt;Julian R.&lt;/strong&gt;&lt;span&gt;Local Architect&lt;/span&gt;&lt;/footer&gt;
		&lt;/article&gt;
		&lt;article class=&quot;wp-testimonial wp-testimonial--card&quot;&gt;
			&lt;blockquote&gt;&lt;p&gt;My daily sanctuary. The staff genuinely remembers my order, and the ambient noise is perfectly calibrated for morning focus.&lt;/p&gt;&lt;/blockquote&gt;
			&lt;footer&gt;&lt;strong&gt;Sarah M.&lt;/strong&gt;&lt;span&gt;Writer &amp;amp; Editor&lt;/span&gt;&lt;/footer&gt;
		&lt;/article&gt;
		&lt;article class=&quot;wp-testimonial wp-testimonial--card&quot;&gt;
			&lt;blockquote&gt;&lt;p&gt;Finally, a cafe in the neighborhood that balances exceptional, nerdy espresso standards with warm, unpretentious hospitality.&lt;/p&gt;&lt;/blockquote&gt;
			&lt;footer&gt;&lt;strong&gt;Marcus T.&lt;/strong&gt;&lt;span&gt;Returning Guest&lt;/span&gt;&lt;/footer&gt;
		&lt;/article&gt;
	&lt;/div&gt;
&lt;/section&gt;
&lt;!-- /wp:html --&gt;

&lt;!-- wp:html --&gt;

&lt;section class=&quot;wp-section wp-faq&quot; id=&quot;faq&quot; data-layout=&quot;faq-accordion&quot;&gt;
	&lt;header class=&quot;wp-section__header&quot;&gt;
		&lt;p class=&quot;wp-section__eyebrow&quot;&gt;FAQ&lt;/p&gt;
		&lt;h2&gt;Common Inquiries&lt;/h2&gt;
	&lt;/header&gt;
	&lt;div class=&quot;wp-faq__list&quot;&gt;
		
		&lt;details class=&quot;wp-faq__item&quot;&gt;
			&lt;summary&gt;Do you roast your own coffee?&lt;/summary&gt;
			&lt;p&gt;We partner with a close-knit group of local artisanal roasters and feature a rotating single-origin guest bean on espresso every month.&lt;/p&gt;
		&lt;/details&gt;
		&lt;details class=&quot;wp-faq__item&quot;&gt;
			&lt;summary&gt;Are there vegan pastry options?&lt;/summary&gt;
			&lt;p&gt;Yes, our daily bakery selection always includes at least two plant-based goods, including our signature citrus olive oil loaf.&lt;/p&gt;
		&lt;/details&gt;
		&lt;details class=&quot;wp-faq__item&quot;&gt;
			&lt;summary&gt;Is the cafe suitable for remote work?&lt;/summary&gt;
			&lt;p&gt;Laptops are welcome at our communal oak tables and the window bar. We intentionally keep our intimate booths device-free to encourage conversation.&lt;/p&gt;
		&lt;/details&gt;
		&lt;details class=&quot;wp-faq__item&quot;&gt;
			&lt;summary&gt;Can I purchase beans to brew at home?&lt;/summary&gt;
			&lt;p&gt;Absolutely. We sell retail bags of our staple house blend alongside limited micro-lots, and we are happy to grind them to your exact brewer specifications.&lt;/p&gt;
		&lt;/details&gt;
	&lt;/div&gt;
&lt;/section&gt;
&lt;!-- /wp:html --&gt;

&lt;!-- wp:html --&gt;

&lt;section class=&quot;wp-section wp-cta wp-cta--centered&quot; data-layout=&quot;cta-split&quot;&gt;
	&lt;div class=&quot;wp-cta__card&quot;&gt;
		&lt;p class=&quot;wp-section__eyebrow&quot;&gt;Call To Action&lt;/p&gt;
		&lt;h2&gt;Skip the Morning Line&lt;/h2&gt;
		&lt;p&gt;&lt;/p&gt;
		&lt;a class=&quot;wp-button wp-button--primary&quot; href=&quot;#contact&quot;&gt;Contact Us&lt;/a&gt;
	&lt;/div&gt;
&lt;/section&gt;
&lt;!-- /wp:html --&gt;

&lt;!-- wp:html --&gt;

&lt;section class=&quot;wp-section wp-contact wp-contact--contact-form&quot; id=&quot;contact&quot; data-layout=&quot;contact-form&quot;&gt;
	&lt;header class=&quot;wp-section__header&quot;&gt;
		&lt;p class=&quot;wp-section__eyebrow&quot;&gt;Contact&lt;/p&gt;
		&lt;h2&gt;Visit Us&lt;/h2&gt;
	&lt;/header&gt;
	&lt;div class=&quot;wp-contact__grid&quot;&gt;
		&lt;article class=&quot;wp-contact__details&quot;&gt;
			&lt;h3&gt;Test Cafe&lt;/h3&gt;
			&lt;p&gt;123 Main St, San Francisco, CA&lt;/p&gt;
			&lt;p&gt;&lt;strong&gt;Phone:&lt;/strong&gt; (555) 123-4567&lt;/p&gt;
			&lt;p&gt;&lt;strong&gt;Email:&lt;/strong&gt; info@testcafe.com&lt;/p&gt;
		&lt;/article&gt;
		&lt;article class=&quot;wp-contact__card&quot;&gt;
			&lt;div class=&quot;wp-contact__map&quot;&gt;123 Main St, San Francisco, CA&lt;/div&gt;
			&lt;a class=&quot;wp-button wp-button--primary&quot; href=&quot;mailto:info@testcafe.com&quot;&gt;Book A Conversation&lt;/a&gt;
		&lt;/article&gt;
	&lt;/div&gt;
&lt;/section&gt;
&lt;!-- /wp:html --&gt;</pre>
  </section>
  <section>
    <h2>Provisioning Plan Pages</h2>
    
    <article>
      <h3>Test Cafe</h3>
      <p class="meta">Slug: home | Homepage</p>
      <pre>&lt;!-- wp:navigation {&quot;layout&quot;:{&quot;type&quot;:&quot;flex&quot;,&quot;justifyContent&quot;:&quot;center&quot;}} --&gt;
&lt;nav class=&quot;wp-block-navigation&quot;&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/&quot;&gt;Home&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/about/&quot;&gt;About&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/services/&quot;&gt;Signature Dishes &amp;amp; Experiences&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/gallery/&quot;&gt;Dining Room &amp;amp; Detail&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/faq/&quot;&gt;Dining Questions&lt;/a&gt;&lt;a class=&quot;wp-block-navigation-item__content&quot; href=&quot;/contact/&quot;&gt;Visit Test Cafe&lt;/a&gt;&lt;/nav&gt;
&lt;!-- /wp:navigation --&gt;

&lt;!-- wp:html --&gt;

&lt;section class=&quot;wp-section wp-hero wp-hero--split&quot; id=&quot;top&quot; data-layout=&quot;hero-immersive&quot;&gt;
	&lt;div class=&quot;wp-hero__content&quot;&gt;
		&lt;p class=&quot;wp-hero__badge&quot;&gt;San Francisco&lt;/p&gt;
		&lt;h1&gt;Morning Rituals, Elevated.&lt;/h1&gt;
		&lt;p&gt;Artisanal espresso and house-baked pastries served in a sunlit sanctuary on Main Street.&lt;/p&gt;
		&lt;div class=&quot;wp-hero__actions&quot;&gt;
			&lt;a class=&quot;wp-button wp-button--primary&quot; href=&quot;#contact&quot;&gt;Order Ahead&lt;/a&gt;
			&lt;a class=&quot;wp-button wp-button--secondary&quot; href=&quot;#about&quot;&gt;View Seasonal Menu&lt;/a&gt;
		&lt;/div&gt;
	&lt;/div&gt;
	
&lt;/section&gt;
&lt;!-- /wp:html --&gt;

&lt;!-- wp:html --&gt;

&lt;section class=&quot;wp-section wp-features wp-features--bento&quot; id=&quot;services&quot; data-layout=&quot;feature-grid&quot;&gt;
	&lt;header class=&quot;wp-section__header&quot;&gt;
		&lt;p class=&quot;wp-section__eyebrow&quot;&gt;Services&lt;/p&gt;
		&lt;h2&gt;The Craft Behind the Cup&lt;/h2&gt;
	&lt;/header&gt;
	&lt;div class=&quot;wp-features__grid wp-features__grid--bento&quot;&gt;
		
		&lt;article class=&quot;wp-feature wp-feature--card wp-feature--lead&quot;&gt;
			&lt;span class=&quot;wp-feature__index&quot;&gt;01&lt;/span&gt;
			&lt;h3&gt;Single-Origin Roasts&lt;/h3&gt;
			&lt;p&gt;Partnering directly with farmers, our beans are roasted light to preserve their distinct, origin-specific tasting notes.&lt;/p&gt;
		&lt;/article&gt;
		&lt;article class=&quot;wp-feature wp-feature--card wp-feature--support&quot;&gt;
			&lt;span class=&quot;wp-feature__index&quot;&gt;02&lt;/span&gt;
			&lt;h3&gt;House-Made Pastries&lt;/h3&gt;
			&lt;p&gt;Laminated doughs and 
```

## Parse Repairs

- [0] hero -> hero
- [1] gallery -> gallery
- [2] features -> features
- [3] testimonials -> testimonials
- [4] faq -> faq
- [5] cta -> cta
- [6] contact -> contact

## Errors

- None