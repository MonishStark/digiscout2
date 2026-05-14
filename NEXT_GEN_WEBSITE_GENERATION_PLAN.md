<!-- @format -->

# Next-Gen Website Generation Plan

## Purpose

This plan converts the current AI website generation system from generic template output into a premium, light-theme, category-aware design engine. It focuses only on prompt engineering, schema generation, uniqueness logic, design sophistication, and generated website aesthetics. It does not modify provisioning, WordPress infrastructure, or dashboard UI.

## Current Prompt Architecture (Existing)

### Source

- `server.ts` → `/api/generate` builds the Gemini prompt
- `src/lib/gemini.ts` provides frontend fallback schema logic for dry run mode
- `server.ts` also contains `createFallbackWebsiteSchema()` and `ensureNonTemplateCopy()`

### Current prompt problems

- Design instructions are too broad and generic
- Output is constrained to a fixed 6-section pattern
- Visual direction is vague and repetitive
- Prompts still allow dark themes and stocky visuals
- Category awareness is shallow
- No strong brand personality or layout diversity rules

## Proposed Prompt Architecture

The new prompt architecture must be explicit, multi-layered, and constraint-driven. It should consist of:

1. **Persona / system instruction**
   - Declare the model as a premium brand experience designer, design director, or creative studio lead.
   - Insist on light, luxurious, polished, modern startup-style websites.

2. **Business context injection**
   - Provide full business inputs: name, category, address, phone, email, website, photos, image hints, industry tone.
   - Add a short business personality profile derived from category (e.g. "trustworthy clinical", "energetic performance", "editorial boutique").

3. **Visual design constraints**
   - Force light theme only.
   - Require modern spacing, premium hierarchy, asymmetrical layout, elegant cards, and soft gradients.
   - Explicitly forbid dark backgrounds, heavy shadows, obvious stock site copy, and repetitive block structures.

4. **Category-aware design directions**
   - Define distinct visual systems for each business vertical.
   - Provide design archetypes such as "clinical luxury", "creative hospitality", "architectural premium", "performance energy".

5. **Output schema instructions**
   - Return only valid JSON matching `WebsiteSchema`.
   - Use existing section types but generate more variant-specific values.
   - Use optional hints if necessary for preview-only enhancements.

6. **Uniqueness and layout diversity rules**
   - Vary section order, hero style, CTA placement, layout composition, spacing density, and accent usage.
   - Require two different layout rhythms per website: one for hero and one for a later section.
   - Avoid the exact sequence: hero → features → gallery → testimonials → contact.

7. **Conversion structure guidance**
   - Ensure strong first-screen CTA, a service/value section, proof section, and a final action-focused footer.
   - Use business-specific credibility elements rather than generic testimonials alone.

8. **Validation and fallback guidance**
   - If the model is uncertain, prefer the approved schema shape and keep all values explicit.
   - Do not output markdown or commentary.

## New Design Language System

The design language should be premium, light, and modern. It should be defined by:

- **Tone**: clean luxury, subtle warmth, intelligent structure, editorial clarity
- **Palette**: white / off-white base, soft neutrals, expressive accent colors, subtle gradients
- **Typography**: refined heading fonts + crisp sans body fonts, scale with hierarchy and whitespace
- **Spacing**: generous margins, airy sections, deliberate breathing room
- **Layout**: asymmetry, split-screen, bento grids, cards, layered panels
- **Surface treatments**: minimal glass, soft shadows, delicate borders, light layered backgrounds
- **Interaction**: smooth hover states, subtle motion hints, refined button treatments

### Core design principles

1. **Only light themes**
   - backgrounds should be mostly white, off-white, light sand, or very pale neutrals
   - text should be dark gray to near-black
   - accents should be bright but not neon

2. **Space-first premium layouts**
   - calm, generous spacing around sections
   - content should feel editorial, not cramped
   - section rhythm should alternate between dense and open

3. **Category differentiation**
   - visual language should change strongly by industry, not just color
   - layout systems, imagery, typography, and accent mood should reflect the business

4. **Modern conversion structure**
   - first-screen clarity, outcome-driven messaging, trust signals, focused CTA placement
   - a second CTA section near the end with a concise, high-value action

5. **More editorial variation**
   - mix large hero media with split panels and content cards
   - use asymmetrical image grids and varied feature widths
   - incorporate distinct gallery and testimonial treatments

## Category-Based Visual Systems

### Dry Cleaner

- **Mood**: polished, trustworthy, clinical freshness
- **Palette**: soft blue, creamy white, light gray, navy accent
- **Typography**: modern sans serif headings, humanist body text
- **Layout**: clean split hero with credentials panel, service cards, process strip
- **Visual cues**: crisp lines, soft rounded containers, subtle gradient highlights

### Dental

- **Mood**: clinical luxury, calm, reassuring
- **Palette**: warm white, soft cream, pale blue-green, graphite accent
- **Typography**: precise, elegant sans for headings, spacious body text
- **Layout**: minimalist panels, plenty of white space, structured service grid
- **Visual cues**: subtle glass surfaces, soft shadow bands, slender CTA buttons

### Fitness

- **Mood**: energetic, premium, confident
- **Palette**: bright white, slate, bold teal / coral / chartreuse accent
- **Typography**: bold display headings, compact sans body, strong numerics
- **Layout**: dynamic asymmetrical grids, editorial cards, performance feature blocks
- **Visual cues**: angled shapes, kinetic imagery, contrast bars, strong CTA emphasis

### Cafe

- **Mood**: editorial warmth, approachable luxury
- **Palette**: soft beige, muted terracotta, cream, graphite accents
- **Typography**: elegant serif headings, smooth sans body copy
- **Layout**: layered split sections, editorial photo panels, story cards
- **Visual cues**: texture overlays, organic cards, warm gradients, subtle shadows

### Salon

- **Mood**: fashion-forward luxury, glossy sophistication
- **Palette**: light pearl, pale blush, black ink accent, gold/rose accent
- **Typography**: high-fashion serif or modern slab headings, clean sans body text
- **Layout**: asymmetrical hero, editorial content rows, luxe testimonial cards
- **Visual cues**: glass panels, soft glow, premium brandmarks, elegant spacing

### Real Estate

- **Mood**: architectural premium, quiet confidence
- **Palette**: light stone, graphite, slate blue, muted gold accent
- **Typography**: strong geometric headings, balanced sans body text
- **Layout**: large image blocks, card-based property highlights, split feature sections
- **Visual cues**: grid-driven layouts, subtle line accents, polished CTA panels

### Generic / Other Local Business

- **Mood**: modern startup premium
- **Palette**: white, slate, bright accent, soft neutral
- **Typography**: refined sans headings, accessible body text
- **Layout**: clean modular sections, strong brand positioning
- **Visual cues**: subtle gradients, modern cards, high-end spacing

## Uniqueness Strategy

To make each website feel distinct, the plan must deliver variation across multiple dimensions.

### Dimensions of uniqueness

- **Section ordering**: vary the sequence using 3-4 approved patterns
- **Hero style**: split, centered, editorial, media-led, panel-led
- **Layout composition**: alternating feature grids, bento blocks, card stacks, quote strips
- **Typography pairing**: vary heading/font pairings per category and hero style
- **Spacing density**: use "airy", "balanced", and "compact" to shift rhythm
- **Card style**: use floating cards, border cards, glass cards, mini-tiles
- **Accent usage**: strong vs subtle, full-width accent bands, minimal dot accents
- **Media layout**: full-width hero image, framed image panel, collage grid, floating media card
- **Interaction style**: soft button hover, card lift, highlight underline, subtle glow

### Implementation tactics

1. **Creative direction seed**
   - Keep creative seed but apply it to visual direction and layout choice.
   - Example: `creativeSeed = hash(business.id + business.category + timestamp)`.

2. **Category-specific layout archetypes**
   - Each category should have 2-3 preferred layout archetypes and 2-3 alternate styles.

3. **Section ordering patterns**
   - Define several approved section sequences and choose one based on seed/category.
   - Example patterns:
     - Hero → Value Grid → Proof → Gallery → CTA → Contact
     - Hero → Split Services → Testimonials → FAQ → CTA → Contact
     - Hero → Features → Gallery → Proof / Stats → Contact
     - Hero → Process → Services → Gallery → CTA → Contact

4. **Design direction rules**
   - Require the model to select a distinct direction phrase and apply it consistently.
   - Never allow the model to fall back to generic section lists.

5. **Strong brand personality**
   - Ask the model to interpret the business as a brand identity concept.
   - Example: "A premium local dry cleaner that feels like a trusted boutique concierge service."

6. **Output variation enforcement**
   - Use explicit rules to avoid repeating the same hero and feature structures.
   - Force at least one section to use an alternate layout style.

## Layout Variation Strategy

The schema should support multiple layout patterns while staying compatible.

### Existing section variants to exploit

- `hero.variant` already supports: `split`, `centered`, `editorial`, `immersive`
- `features.layout` supports: `cards`, `list`
- `gallery.items` can vary in number and image composition

### New layout patterns to generate

1. **Editorial split hero**
   - Large heading next to a stacked content panel, with secondary trust / figure blocks.

2. **Panel-led service section**
   - Feature cards arranged in an uneven grid with one large card.

3. **Bento-style gallery**
   - Mix 2–4 images in a crisp asymmetrical matrix.

4. **Proof band**
   - Client testimonials, badges, and metrics in a horizontal band.

5. **Split contact / CTA**
   - Contact info beside a conversion card with a clear action.

6. **FAQ cards**
   - Accordion cards with descriptive copy and subtle visual styling.

7. **Editorial text section**
   - Large typographic headline paired with a narrow supporting paragraph.

### Avoid rigid linear flows

The prompt should allow the model to produce variations such as:

- hero → split features → gallery → testimonials → cta → contact
- hero → editorial copy → proof → faq → contact → cta
- hero → service cards → about / story panel → testimonials → contact
- hero → gallery → features → cta → faq → contact

### Layout hints in schema

Keep compatibility by adding optional, non-breaking hints such as:

- `sectionStyle` or `visualStyle` on sections
- `hero.variant` values already supported
- `features.layout` values already supported
- `gallery.layout` or `gallery.style` as optional hints
- `testimonials.layout` as optional hint
- `faq.style` as optional hint
- `contact.layout` as optional hint

These should be used by the preview renderer if implemented later, but must not be required for WordPress conversion.

## Typography Strategy

A premium typography system should be explicit in prompts and schema.

### Recommended typographic hierarchy

- **Heading fonts**: elegant sans / transitional serif / geometric display
- **Body fonts**: neutral sans with high readability
- **Scale**: using fluid sizes for hero, section headings, subheads, body
- **Weight**: use bold display headings with medium body copy

### Prompt guidance for typography

- Always request a premium heading/body pairing
- Ask for one of these tonal families depending on category:
  - Luxury & editorial: serif heading + neutral sans body
  - Clean modern: geometric sans heading + humanist sans body
  - Bold performance: strong sans heading + uppercase microcopy
  - Clinical / architectural: precise sans heading + calm sans body
- Require readability over novelty.

### Example pairings

- `Heading: Inter Display, Body: Inter` (baseline)
- `Heading: GT America, Body: Inter` (modern premium)
- `Heading: Editorial Serif, Body: IBM Plex Sans` (luxury)
- `Heading: Söhne, Body: Inter` (architectural)
- `Heading: Tiempos, Body: Aktiv Grotesk` (fashion)

### Compatibility note

The current renderer uses `theme.typography.heading` and `theme.typography.body` directly. Provide meaningful values there and keep them light-theme appropriate.

## Color Strategy

All generated sites must be light, premium, and category expressive.

### Light palette rules

- Base background: white or off-white
- Surface: soft warm gray / pale beige / light stone
- Text: charcoal / dark gray
- Accent: one bold accent plus one soft secondary accent
- Outline: pale neutral or subtle tint

### Premium accent moods

- **Dry Cleaner**: sky blue + warm gray
- **Dental**: mint / aqua + soft cream
- **Fitness**: electric teal / coral + slate gray
- **Cafe**: terracotta / ochre + creamy white
- **Salon**: blush / rose gold + graphite
- **Real Estate**: slate blue / warm gold + stone

### Use of color

- Accents should be used sparingly on CTAs, links, small highlights, and icons.
- Surfaces should remain mostly light; avoid saturated backgrounds.
- Use subtle gradients to support depth, not dominate the layout.
- Avoid dark background sections entirely.

## Section Diversity Plan

Each generated schema should include modern variations on the core section types.

### Section roles and recommended variants

1. **Hero**
   - Split media/panel hero
   - Centered text hero
   - Editorial highlight hero
   - Immersive light image hero

2. **Features / Services**
   - Uneven card grid
   - Horizontal feature strip
   - Icon-led mini cards
   - Text-first value section

3. **Gallery / Visuals**
   - Bento photo cluster
   - Card mosaic
   - Minimal image highlight panel
   - Split image/text portfolio block

4. **Testimonials / Proof**
   - Quote cards with author detail
   - Horizontal proof strip with metrics
   - Clustered testimonials in a tiled layout
   - Single strong quote plus support

5. **FAQ / Details**
   - Accordion card list
   - Two-column Q&A grid
   - Feature list with brief explanations
   - Vertical question panel + side detail

6. **CTA / Conversion**
   - Clean boxed CTA section with contrast accent
   - Split contact/CTA pair
   - Minimal banner CTA with supporting text
   - Secondary trust + CTA row

7. **Contact**
   - Simple white card with contact details
   - Split contact + map placeholder
   - Compact brand contact panel

### Use of additional section types

- Add optional **testimonial** and **faq** variants instead of generic blocks
- Use **cta** to create stronger end-of-page conversion focus
- If the model produces optional `hero.badges`, keep them as subtle brand cues

### Section structure variation rules

- Require 1–2 optional sections to appear after the hero before features.
- Require the hero to connect to the first supporting section with a shared visual theme.
- Do not require the same exact section suite for every category.
- Use category-specific storytelling sections where possible (e.g. "How it works" for salon, "Why choose us" for dental).

## Schema Extension Recommendations

Stay compatible with the rendering and WordPress pipeline while adding optional richness.

### Minimal schema extensions

Add these optional fields without breaking existing flow:

- `theme.brightness?: "light"` (always `light`)
- `theme.mood?: string` (e.g. "calm premium", "dynamic energy")
- `theme.shadowStyle?: string` (e.g. "soft", "fine")
- `theme.gradientStyle?: string` (e.g. "pale warm glow")
- `theme.sectionDensity?: "airy" | "balanced" | "compact"`
- `theme.interactionStyle?: "soft" | "elevated" | "minimal"`

- `hero.variant` already exists and should be used more extensively
- `features.layout` already exists and should be varied
- `gallery.style?: "bento" | "mosaic" | "split"`
- `testimonials.layout?: "cards" | "strip" | "highlight"`
- `faq.style?: "accordion" | "grid" | "panel"`
- `contact.layout?: "split" | "card" | "compact"`
- `cta.style?: "banner" | "boxed" | "split"`

### Compatibility guardrails

- Keep all new fields optional.
- Do not rely on new fields for critical provisioning or WordPress conversion.
- Existing renderers can ignore unknown fields safely.
- If the schema is later expanded, one can update `website-renderer.ts` to honor these hints.

## Template Mode Improvements

Template mode must also feel premium and category-aware.

### Proposed enhancements

1. Use richer category-specific theme palettes and layout patterns.
2. Produce 4–6 sections with varied structure instead of only 4.
3. Use more expressive hero variants.
4. Add alternative FAQ, testimonial, or CTA layouts with text that feels polished.
5. Avoid fallback text like "A brief description of your key offering." and instead use business-specific outcome copy.

### Template mode strategy

- Keep deterministic generation but add variation through category-specific patterns.
- Use the same light-theme rules as Gemini mode.
- When `WEBSITE_GENERATION_MODE=template`, generate distinct schema shapes for each category.
- Add minor randomness or seeded variation to choose between two layout archetypes per category.

## Example Improved Prompt Strategy

### Prompt structure

**System prompt**

```
You are a premium brand website designer and creative director. Build a modern light-theme website for a local business that feels polished, elegant, and highly tailored. Use startup / agency-grade editorial layouts, soft light surfaces, refined spacing, and strong conversion focus.
```

**Instruction prompt**

```
Create a structured `WebsiteSchema` JSON object with modern light design. The site must feel premium, airy, and visually unique for this business category.

Design rules:
- Use only light themes: white/off-white backgrounds, dark gray text, soft color accents.
- Avoid dark sections, heavy shadows, and generic stock site phrasing.
- Use at least one asymmetrical section and one split or editorial section.
- Use a clear primary CTA in the hero and a second conversion section later.
- Keep layouts fluid and varied: do not use the same exact section order across every site.
- Use business category to select a distinct visual system.
- Use premium typography hierarchy and modern spacing.

Business:
- Name: ${business.name}
- Category: ${business.category}
- Address: ${business.address}
- Phone: ${business.phoneNumber}
- Email: ${business.email}
- Website: ${business.websiteUri}

Images:
${buildImageBlock(business)}

Return only valid JSON conforming to `WebsiteSchema`. Use existing section types and include optional layout hints when helpful.
```

```

### Example generated design directions

- **Dry cleaner**: "A polished light-cleaning brand experience with soft blue highlights, crisp white surfaces, calm space, and premium service trust cues."
- **Dental**: "A clinical luxury local dental site with calm white space, muted aqua accents, editorial cards, and reassuring premium clarity."
- **Fitness**: "An energetic premium training brand with bright white open space, bold typographic rhythm, dynamic split layouts, and confident CTA emphasis."
- **Cafe**: "A warm editorial café experience with cream surfaces, terracotta accent graphics, elegant serif headlines, and soft layers of imagery."
- **Salon**: "A fashion-forward beauty brand with luminous light panels, blush/gold accents, editorial typography, and luxury spacing."
- **Real estate**: "A premium architectural property brand with stone-neutral backgrounds, slate accents, clean geometry, and large media blocks."

## Example prompt enhancements

### Stronger design instruction example
```

Choose a premium design direction that matches this business category. Build a light, elegant, modern layout that feels more like Stripe, Framer, or an award-winning product page than a generic local listing.

Recommended categories:

- Dry cleaner: polished, transparent, trust-focused
- Dental: clinical luxury, calm, minimal
- Fitness: energetic premium, dynamic, confident
- Cafe: editorial warmth, refined, cozy modern
- Salon: fashion luxury, glossy, elegant
- Real estate: architectural premium, curated, sophisticated

Require:

- Light palette only
- A unique hero style: split, editorial, panel, or immersive bright image
- A secondary conversion block after services or proof
- Asymmetrical layout or a bento-style visual section
- Premium typography pairing and gentle spacing

```

### Layout diversity rule example
```

Do not output the sections in the exact order hero → features → gallery → testimonials → contact. Vary the order by using one of these approved rhythms: hero → value grid → gallery → testimonials → cta → contact, hero → services → proof → faq → contact, hero → editorial story → service cards → gallery → call to action.

```

### Category-aware visual direction example
```

For a dry cleaner, prioritize crisp blue accents, soft rounded cards, cleanliness, and elevated trust messaging.
For dental, prioritize warm white space, calm aqua highlights, premium serif/sans typography, and reassuring clinical clarity.
For fitness, prioritize bright energy, dynamic layout, bold headline rhythm, and clear conversion actions.

```

## Implementation Notes

### Keep compatibility with current pipeline
- Use the existing `WebsiteSchema` shape as the foundation.
- Add optional hints only. Do not break current `renderWebsiteArtifact()` or WordPress conversion.
- Continue using `hero.variant`, `features.layout`, and other safe existing fields.
- Any schema extensions should be optional and preview-only until the renderer is updated.

### Practical prompt output expectations
- The AI should generate richer hero and feature content, not stale placeholder copy.
- The schema should feel like a curated site structure, not a checklist of sections.
- The design language should be specific to category via adjectives and layout choices.

### Testing and rollout
- Implement prompt changes first, then verify preview output quality.
- Keep template mode aligned with the same new visual system.
- Review generated sites across categories for distinctiveness and light-themed refinement.

## Summary

This plan upgrades the generation system to a premium, light-theme, category-sensitive engine by:
- replacing vague instructions with explicit premium design rules
- enforcing layout diversity and asymmetry
- building category-specific visual systems
- increasing typography, spacing, and color sophistication
- improving template mode so it is visually strong, not fallback generic

The next step is to apply these prompt and schema recommendations inside `server.ts` and `src/lib/gemini.ts`, while preserving current compatibility with the WordPress provisioning and rendering pipeline.
```
