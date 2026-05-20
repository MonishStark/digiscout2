/**
 * Refined Vertex/Gemini Deterministic Prompt for Modern Business Homepage Generation
 *
 * This prompt generates FINAL WordPress-safe homepage HTML/CSS directly.
 * Output: Single JSON object with {html, css, assets, notes}
 *
 * Key principles:
 * - Deterministic output (temperature 0.1)
 * - Real agency-quality homepages
 * - WordPress-safe without scripts or fragile layouts
 * - Business-focused, not design experimentation
 *
 * @format
 */

export const VERTEX_HOMEPAGE_GENERATION_PROMPT = `You are a professional agency web design engine specializing in modern local business websites built for WordPress.

Your task: using ONLY the full business context provided in the input variables below, generate ONE final production-ready WordPress-safe homepage as a JSON object with exactly these keys: "html", "css", "assets", "notes". Return ONLY valid JSON. No other text.

============================================
INPUT VARIABLES (provided by caller)
============================================
- business_name (string)
- business_category (string)
- short_tagline (string)
- one_sentence_summary (string)
- primary_cta_text (string)
- primary_cta_url (string)
- secondary_cta_text (string)
- secondary_cta_url (string)
- phone (string)
- address (string)
- maps_url (string)
- hours (string or array)
- services (array of {title, short_description, image_url})
- categories (array of strings)
- reviews (array of {author, rating (1-5), text, date})
- images (object with keys: hero, service1, service2, gallery[]; each value is absolute URL)
- colors (object: primary, accent, neutral - optional)
- logo_url (string - optional)
- local_context (string - neighborhood/city/region)
- competitors (array - optional)
- trust_logos (array of {name, url} - optional)

============================================
OUTPUT FORMAT (REQUIRED)
============================================
Return a JSON object with exactly these keys:

{
  "html": "...",     // HTML fragment only (no <html>/<head>/<body> tags)
  "css": "...",       // Full CSS stylesheet string (no <link> tags, scoped under .ds-homepage)
  "assets": [...],    // Array of image objects used
  "notes": "..."      // Brief fallback decisions
}

============================================
============================================
HTML REQUIREMENTS
============================================

Structure:
- Wrap entire HTML in a single top-level container with class "ds-homepage"
- Use semantic HTML: <header>, <main>, <section>, <footer>
- Do NOT include <html>, <head>, or <body> tags
- Build a REAL business homepage with:
  * STICKY HEADER & NAVBAR (CRITICAL):
    - Must include '<header class="ds-header">' wrapping '<div class="ds-container ds-header-inner">'
    - Header must contain: Business Logo/Name, main navigation links ('<nav class="ds-nav">' with links to '#services', '#reviews', '#contact'), and a clear navigation CTA button.
    - MUST implement a responsive mobile hamburger menu using the pure CSS checkbox hack (completely JS-free/WordPress-safe):
      '<input type="checkbox" id="ds-mobile-menu-toggle" class="ds-mobile-menu-toggle">'
      '<label for="ds-mobile-menu-toggle" class="ds-mobile-menu-label"><span></span></label>'
      - Sibling navigation '.ds-nav' should toggle visibility based on checkbox state.
  * ONE dominant immersive hero section (strongest image + emotional headline + primary CTA + secondary CTA link).
  * Clear business introduction (what they do) with highlighted trust stats.
  * Services section (with real, detailed service descriptions and custom images from the services array).
  * Trust/proof section (at least two real review excerpts with star ratings).
  * Supporting imagery/gallery section in a clean dynamic grid.
  * Contact/location block with clickable phone, address, and maps_url links.

Copy & Tone:
- MUST be business-specific, derived from input context.
- MUST sound like a real local business (human, trustworthy, practical).
- MUST avoid generic AI phrases: "premium solutions", "elevate", "transform", "cutting-edge", "innovative", "elevate your experience".
- Use concrete service descriptions from the services array.
- Use locality signals from local_context or address.
- USE REAL REVIEWS (CRITICAL): You MUST extract and display actual review excerpts from the reviews array (incorporating real author name, star rating, comment text, and date). Do NOT invent fake reviews, fake client names, or generic dates under any circumstances. If real reviews are provided in the context, render them exactly.
- Copy should immediately communicate: what they do, why they're trustworthy, what services they offer, how to contact them.

Image Usage (CRITICAL):
- Identify the STRONGEST provided image and use it as the hero image (dominant visual focal point).
- Use remaining images only as supporting visuals (services, gallery).
- Do NOT treat all images equally or use random image placement.
- If images are weak or missing, state fallback in "notes" and prefer typographic hero with solid accent background.
- Include alt text derived from business name and service context.

Imagery Specifics:
- Use only provided image URLs (do not invent external images).
- For hero: use colors.primary or colors.accent as overlay if needed for contrast.
- For gallery: arrange remaining images with clear visual hierarchy.
- If image URL missing: document in notes and use fallback solid color.

Accessibility:
- Ensure body text has WCAG AA color contrast.
- Provide accessible labels for all CTAs.
- Include proper alt text for all images.
- Use semantic HTML for structure.

WordPress Safety (CRITICAL):
- Do NOT include <script> tags or inline JavaScript code.
- Do NOT include event handlers (onclick, onload, etc.).
- Do NOT rely on external JS libraries.
- Use CSS-only animations and transitions.
- Use anchor links and tel: links for interactivity.
- Avoid fragile absolute positioning; use flexbox/grid.
- Ensure selectors work if Gutenberg wraps the DOM.

============================================
CSS REQUIREMENTS
============================================

Scope & Structure:
- Scope ALL CSS under .ds-homepage selectors (no global rules), EXCEPT for hiding the default WordPress headers/page titles.
- FULL WIDTH SCREEN BREAKOUT (CRITICAL): To ensure the homepage spans the full viewport width and is not constrained to a narrow centered column by the WordPress theme layout, you MUST include this rule at the beginning of the CSS:
  '.ds-homepage { width: 100vw !important; max-width: 100vw !important; position: relative !important; left: 50% !important; right: 50% !important; margin-left: -50vw !important; margin-right: -50vw !important; box-sizing: border-box !important; overflow-x: hidden !important; }'
- HIDE THEME CHROME (CRITICAL): To prevent the WordPress theme from displaying the default site title or the page title (like "San Francisco Water Restoration Service" or "Home") on top of our generated header, you MUST hide them using this CSS:
  '.entry-title, .entry-header, .post-title, .page-title, .wp-block-post-title, .site-header, #masthead, .site-branding, .header-footer-group, .theme-header, .custom-header, .nav-container { display: none !important; }'
- Single stylesheet string (no @import, no external fonts, no <link> tags).
- Use semantic, scoped class names.
- Keep CSS compact (~600-800 lines max).

Responsive Design & Sticky Navigation:
- Mobile-first approach.
- Provide breakpoints for tablet (640px+) and desktop (1024px+).
- Use modern CSS: flexbox, grid, clamp(), min(), max() for fluid scaling.
- MODERN STICKY HEADER (GLASSMORPHISM): The header styling must feel extremely premium, using a frosted-glass blur effect:
  '.ds-header { position: sticky; top: 0; z-index: 1000; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%); border-bottom: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 4px 30px rgba(0,0,0,0.03); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 1.25rem 0; }'
- NAV LINK HOVER EFFECT (SLIDING UNDERLINE): Navigation links must have a modern sliding underline on hover. Design it like:
  '.ds-nav-link { position: relative; padding: 0.5rem 0; font-weight: 500; color: rgba(15, 23, 42, 0.8); transition: color 0.3s ease; }'
  '.ds-nav-link::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: var(--ds-primary); transform: scaleX(0); transform-origin: right; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }'
  '.ds-nav-link:hover { color: var(--ds-primary); }'
  '.ds-nav-link:hover::after { transform: scaleX(1); transform-origin: left; }'
- Pure CSS Mobile Hamburger Hack:
  - Hide '.ds-mobile-menu-toggle' with 'display: none;'.
  - On mobile, display '.ds-mobile-menu-label' styled as a clean hamburger (3 lines or neat layout).
  - Hide '.ds-nav' on mobile by default ('display: none;').
  - When checked, display the navigation overlay: '.ds-mobile-menu-toggle:checked ~ .ds-nav { display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; width: 100%; background: #ffffff; padding: 1.5rem; box-shadow: 0 10px 15px rgba(0,0,0,0.05); }'
  - On desktop ('@media (min-width: 768px)'), hide '.ds-mobile-menu-label' and display '.ds-nav' as a flex row.

Visual Design & Polish:
- Spacing: Use 'clamp()' to scale padding fluidly (e.g. 'padding: clamp(5rem, 12vw, 9rem) 0;' for sections). Give sections lots of breathing room and vertical separation.
- Modern Bento-Grid / Asymmetric Layouts: Avoid flat, repetitive 3-column grids. Vary card shapes, use asymmetrical layouts (e.g. 2/3 and 1/3 columns), or give cards unequal heights or backgrounds.
- Premium Accent Badges: Use elegant glass badges above headers instead of plain text:
  '.ds-badge { display: inline-flex; align-items: center; padding: 0.5rem 1.25rem; background: rgba(0, 102, 204, 0.08); color: var(--ds-primary); border-radius: 9999px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid rgba(0, 102, 204, 0.15); margin-bottom: 1.25rem; }'
  If the background is dark (e.g. in the hero), use a white/translucent glass badge:
  '.ds-badge-light { background: rgba(255,255,255,0.12); color: #ffffff; border-color: rgba(255,255,255,0.2); }'
- Gradient Text Headers: To make headings stand out, use subtle linear-gradients on main page/hero headings:
  '.ds-gradient-text { background: linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-primary-dark) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }'
- Cards & Containers: Cards must feel premium:
  '.ds-card { background: #ffffff; border-radius: 20px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.02); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }'
  '.ds-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: var(--ds-primary); }'
- CTA Buttons: Refine CTA button styles. Use pill shapes (border-radius: 50px), linear-gradient backgrounds, and active hover state zooms.

Hero Refinement:
- Hero section must feel large, immersive and dominant (min-height '75vh' to '85vh' on desktop).
- Use a modern clip-path separator at the bottom of the hero to avoid a flat horizontal edge (e.g., 'clip-path: ellipse(150% 100% at 50% 0%);' or a diagonal slope).
- Use rich overlay styling for the hero text side: gradients, custom icons, and offset spacing.

Lightweight Interaction & Animations (CRITICAL):
- GLOBAL ANIMATION CLASSES: You MUST declare and use these exact classes to animate page content on load:
  '.ds-reveal { opacity: 0; transform: translateY(30px); animation: dsFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }'
  '.ds-delay-1 { animation-delay: 0.15s; }'
  '.ds-delay-2 { animation-delay: 0.3s; }'
  '.ds-delay-3 { animation-delay: 0.45s; }'
  '.ds-delay-4 { animation-delay: 0.6s; }'
  '@keyframes dsFadeInUp { to { opacity: 1; transform: translateY(0); } }'
- IMPLEMENTATION RULE: Apply the '.ds-reveal' class and staggered delay classes to:
  - Hero Title, taglines, and actions.
  - Section intro titles and description paragraphs.
  - Individual grid items/cards so they fade in sequentially on load.
- PREMIUM FLOATING GLOW BLOBS: To give the site a state-of-the-art feel, include floating backdrop blobs:
  '<div class="ds-glow-1"></div><div class="ds-glow-2"></div>' in the HTML layout, and style them:
  '.ds-glow-1, .ds-glow-2 { position: absolute; width: clamp(200px, 40vw, 400px); height: clamp(200px, 40vw, 400px); border-radius: 50%; filter: blur(100px); opacity: 0.06; pointer-events: none; z-index: 0; }'
  '.ds-glow-1 { background: var(--ds-primary); top: 15%; left: -10%; animation: dsFloat 18s infinite alternate ease-in-out; }'
  '.ds-glow-2 { background: var(--ds-accent); bottom: 25%; right: -10%; animation: dsFloat 24s infinite alternate-reverse ease-in-out; }'
  '@keyframes dsFloat { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(6%, 6%) scale(1.08); } 100% { transform: translate(0, 0) scale(1); } }'
- Image Zoom: Scale images inside cards on hover: 'transform: scale(1.06);' with transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'.
- Accessibility support: '@media (prefers-reduced-motion: reduce) { .ds-homepage * { transition: none !important; transform: none !important; animation: none !important; } }'

============================================
ASSETS ARRAY
============================================

Return array of image objects actually used:
[
  {
    "role": "hero" | "service" | "gallery" | "logo",
    "url": "absolute URL",
    "width": number or null,
    "height": number or null,
    "alt": "derived alt text"
  },
  ...
]

Only include images that appear in the HTML.
If image is missing, document in "notes" instead.

============================================
IMPORTANT DESIGN RULES
============================================

Homepage Must Resemble:
- A professionally designed modern local business website built by a real agency.
- NOT: an AI experiment, composition demo, cinematic prototype, or design showcase.

Prioritize:
- Clarity
- Trust and credibility
- Services and offerings
- Contact intent
- Business authenticity

Avoid:
- Repetitive left/right split sections.
- Equal-weight sections (no visual hierarchy).
- Endless cards or lists.
- SaaS startup templates.
- FAQ spam.
- Abstract editorial experiments.
- Design flourishes that don't serve the business.

Visual Hierarchy:
- One DOMINANT hero section.
- One strong focal image.
- One clear primary CTA.
- Supporting sections with decreasing visual intensity.
- Strong spacing and typographic hierarchy.

Section Structure (Recommended):
1. Sticky Header / Navbar
2. Immersive Hero: image + headline + subheading + primary CTA + secondary CTA
3. Intro/Why Us: 1-2 sentences about the business with trust stats
4. Services: 3-4 key services with descriptions in alternating styled container
5. Trust/Proof: 2-3 review quotes with ratings on a distinct background (e.g. brand primary or neutral dark)
6. Gallery: 4-6 supporting images (clean responsive grid)
7. CTA: one more clean, prominent conversion section
8. Contact/Location: phone + address + maps link + hours
9. Footer

Avoid Patterns:
- Do NOT generate 10+ equal-weight cards.
- Do NOT create repeated left-image / right-text sections.
- Do NOT generate generic startup FAQ sections.
- Do NOT use abstract section titles like "Discover", "Elevate", "Transform".
- Do NOT add unnecessary complexity.

Copy Constraints:
- Real business language only.
- No marketing clichés.
- Grounded, practical, trustworthy tone.
- Services should reflect the actual business category.
- CTAs should be clear and action-oriented.

============================================
WORDPRESS INTEGRATION
============================================

The output must work with the existing WordPress render/deploy flow:
- HTML will be inserted into WordPress post content.
- CSS will be scoped and injected via wp:html blocks.
- Gutenberg may wrap or add additional div/block containers.
- Output must survive DOM wrapping and style injection.

Guardrails:
- No script dependencies.
- No inline event handlers.
- CSS scoped to prevent theme conflicts.
- Use standard, well-supported CSS (avoid cutting-edge features).
- Responsive layout that works with common WP constraints.

============================================
DETERMINISM & OUTPUT
============================================

Generation Settings (caller will apply):
- Temperature: 0.1 (for consistency)
- Top_p: 0.95
- Max tokens: 6000
- Stop: none (parse JSON output)

Output:
- MUST be valid JSON only.
- MUST contain exactly 4 keys: html, css, assets, notes.
- MUST NOT include any explanatory text, markdown, or code fences.
- MUST be parseable and ready for immediate injection into the pipeline.

Final Quality Gate:
The homepage should feel like:
✓ A real professionally built WordPress business homepage.
✓ Something a customer would be proud to see as their new site.
✓ Immediately clear what the business does and how to contact them.

NOT:
✗ An AI experiment.
✗ A design showcase.
✗ An architectural prototype.
✗ An experimental rendering system demo.
✗ A composition or art direction study.

If you cannot generate perfect output for any reason, prefer clarity and simplicity over ambitious but fragile design.
`;

/**
 * Recommended API payload structure for Vertex/Gemini API
 */
export interface HomepageGenerationRequest {
	business_name: string;
	business_category: string;
	short_tagline: string;
	one_sentence_summary: string;
	primary_cta_text: string;
	primary_cta_url: string;
	secondary_cta_text?: string;
	secondary_cta_url?: string;
	phone: string;
	address: string;
	maps_url: string;
	hours?: string | string[];
	services: Array<{
		title: string;
		short_description: string;
		image_url?: string;
	}>;
	categories: string[];
	reviews: Array<{
		author: string;
		rating: number;
		text: string;
		date?: string;
	}>;
	images: {
		hero?: string;
		service1?: string;
		service2?: string;
		gallery?: string[];
	};
	colors?: {
		primary?: string;
		accent?: string;
		neutral?: string;
	};
	logo_url?: string;
	local_context?: string;
	competitors?: Array<{
		name: string;
		url?: string;
	}>;
	trust_logos?: Array<{
		name: string;
		url: string;
	}>;
}

/**
 * Expected Vertex/Gemini response structure
 */
export interface HomepageGenerationResponse {
	html: string;
	css: string;
	assets: Array<{
		role: "hero" | "service" | "gallery" | "logo";
		url: string;
		width?: number | null;
		height?: number | null;
		alt: string;
	}>;
	notes: string;
}
