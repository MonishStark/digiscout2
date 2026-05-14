<!-- @format -->

# PRODUCTION HOSTING AUDIT

**Digital Scout Full-Stack Application**  
**Date:** May 14, 2026  
**Status:** Complete Architecture Analysis (NO CODE CHANGES)

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current Architecture Overview](#current-architecture-overview)
3. [Project Structure Analysis](#project-structure-analysis)
4. [Execution Flow Deep Dive](#execution-flow-deep-dive)
5. [Hosting Requirements](#hosting-requirements)
6. [Namecheap Compatibility Analysis](#namecheap-compatibility-analysis)
7. [WordPress Architecture Assessment](#wordpress-architecture-assessment)
8. [Production Folder Structure](#production-folder-structure)
9. [Build & Deployment Flow](#build--deployment-flow)
10. [Database Requirements](#database-requirements)
11. [Environment Variables Strategy](#environment-variables-strategy)
12. [Local-Only Code Removal](#local-only-code-removal)
13. [Netlify Client Site Deployment](#netlify-client-site-deployment)
14. [MVP Deployment Strategy](#mvp-deployment-strategy)
15. [Risk Areas & Mitigation](#risk-areas--mitigation)

---

## EXECUTIVE SUMMARY

### What This Application Does

**Digital Scout** is an AI-powered website generation and provisioning platform that:

1. **Discovers businesses** via Google Maps API
2. **Generates custom websites** using Gemini AI from business information
3. **Provisions WordPress sites** (multisite subsite per business)
4. **Deploys client sites** to Netlify (HTML export for prospects)
5. **Sends outreach messages** via CallHippo (WhatsApp/SMS to business owners)
6. **Manages leads** with contact information and deployment tracking

### Current Architecture (Development)

```
Browser (React)           Backend (Node.js)              WordPress Multisite
├─ localhost:3000         ├─ localhost:5001             ├─ multisite.local
├─ Vite dev server        ├─ REST API                   ├─ Auto-provisioned subsites
├─ Hot reload             ├─ Gemini integration         ├─ Gutenberg blocks
└─ Development UI         ├─ WP provisioning            ├─ digital-scout theme
                          ├─ Netlify deployment         └─ WordPress MySQL DB
                          ├─ CallHippo messaging
                          ├─ Debug logging
                          └─ Local WordPress proxy
```

### Critical Issues for Production

| Issue                                                | Severity     | Impact on Namecheap             |
| ---------------------------------------------------- | ------------ | ------------------------------- |
| Laragon Apache vhost generation                      | **CRITICAL** | Won't work on VPS               |
| Local .test domain assumption                        | **CRITICAL** | Not accessible outside local    |
| Direct file system manipulation (hosts file, vhosts) | **CRITICAL** | Requires root access            |
| Node.js background process                           | **HIGH**     | Only on VPS/Node hosting        |
| WordPress multisite configuration                    | **HIGH**     | Needs custom setup on Namecheap |
| Local MySQL management APIs                          | **HIGH**     | Requires MySQL CLI & shell      |

### Hosting Verdict

| Hosting Type        | Frontend | Backend | WordPress | Verdict         |
| ------------------- | -------- | ------- | --------- | --------------- |
| **Shared Hosting**  | ✅ Yes   | ❌ No   | ✅ Yes    | **NOT VIABLE**  |
| **Node.js Hosting** | ✅ Yes   | ✅ Yes  | ✅ Maybe  | **POSSIBLE**    |
| **VPS (Namecheap)** | ✅ Yes   | ✅ Yes  | ✅ Yes    | **RECOMMENDED** |

**Final Recommendation:** Namecheap **VPS** (2GB+) with Node.js support

---

## CURRENT ARCHITECTURE OVERVIEW

### Technology Stack

**Frontend:**

- React 19.0.1 (UI framework)
- Vite 6.2.3 (bundler & dev server)
- TailwindCSS 4.1.14 (styling)
- TypeScript 5.8.2 (type safety)
- Google Maps API (business discovery)
- Lucide icons, shadcn UI components

**Backend:**

- Node.js 18+ (runtime)
- Express.js 4.21.2 (HTTP server)
- TypeScript 5.8.2 (type safety)
- Google Gemini API (AI generation)
- MySQL2 3.9.0 (WordPress DB)
- JSZip 3.10.1 (file handling)

**WordPress:**

- WordPress Multisite (shared installation)
- digital-scout-base-theme (custom theme)
- Gutenberg HTML blocks (content format)
- WP REST API (programmatic access)
- Custom provisioning plugin endpoint
- Application passwords (authentication)

**External Services:**

- Google Gemini API (website generation)
- Google Maps Platform (business discovery)
- Netlify API (client site deployment)
- CallHippo API (WhatsApp/SMS outreach)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  PRODUCTION ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────┘

                        User Browser
                             │
                         HTTPS (80/443)
                             │
                    ┌────────────────────┐
                    │ React Frontend     │
                    │ (Vite SPA, dist/)  │
                    │ ├─ Discover page   │
                    │ ├─ Leads/Projects  │
                    │ └─ Maps            │
                    └────────────────────┘
                             │
                        REST API (JSON)
                             │
                    ┌────────────────────────────┐
                    │  Node.js Backend           │
                    │  (Express + TypeScript)    │
                    │                            │
                    │ ├─ /api/generate           │
                    │ │  └─ Gemini AI            │
                    │ ├─ /api/deploy            │
                    │ │  └─ Netlify API          │
                    │ ├─ /api/wordpress/*       │
                    │ │  └─ WP REST API          │
                    │ ├─ /api/outreach          │
                    │ │  └─ CallHippo API        │
                    │ └─ /api/enrich            │
                    │    └─ Web scraping         │
                    └────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
            Google API  Netlify API  WordPress API
            ├─ Gemini   ├─ Deploy    ├─ Multisite
            └─ Maps     └─ Manage    └─ REST API

                    Database Layer
                    (MySQL/Maria)
                    ├─ WordPress tables
                    ├─ Posts, pages
                    ├─ Media
                    └─ Multisite metadata
```

---

## PROJECT STRUCTURE ANALYSIS

### Directory Layout

```
/                                  # Application root
├─ package.json                    # npm configuration
├─ vite.config.ts                 # Frontend bundler config
├─ tsconfig.json                  # TypeScript config
├─ server.ts                       # Express backend entrypoint
├─ .env.example                    # Environment template
├─ .env.local                      # Development secrets (GIT IGNORED)
├─ index.html                      # Frontend HTML shell
├─ README.md                       # Development guide
│
├─ src/                            # Frontend source
│  ├─ main.tsx                     # React entry point
│  ├─ App.tsx                      # Main app component
│  ├─ index.css                    # Global styles
│  ├─ types.ts                     # TypeScript interfaces
│  ├─ components/                  # React components
│  │  ├─ Sidebar.tsx              # Business search & selection
│  │  ├─ MapArea.tsx              # Google Maps integration
│  │  ├─ DeploymentsView.tsx       # Projects list & deployments
│  │  ├─ LeadDetails.tsx           # Lead information display
│  │  ├─ OutreachView.tsx          # Messaging interface
│  │  └─ ui/                       # shadcn UI component library
│  │     ├─ button.tsx
│  │     ├─ input.tsx
│  │     ├─ card.tsx
│  │     ├─ dialog.tsx
│  │     └─ ... (10+ more)
│  │
│  └─ lib/                         # Business logic
│     ├─ gemini.ts                # Website generation from Gemini
│     ├─ website-renderer.ts       # HTML rendering from schema
│     ├─ netlify.ts               # Netlify API client
│     ├─ wordpress-client.ts       # WordPress provisioning client
│     ├─ wordpress-provisioning.ts # WordPress multisite provisioning
│     ├─ wordpress.ts             # WordPress helper functions
│     ├─ callhippo-service.ts      # Outreach messaging API
│     ├─ laragon-local-provisioner.ts      # ⚠️  LOCAL ONLY
│     ├─ laragon-apache-vhost-manager.ts   # ⚠️  LOCAL ONLY
│     ├─ laragon-hosts-file-manager.ts     # ⚠️  LOCAL ONLY
│     ├─ laragon-mysql-manager.ts          # ⚠️  LOCAL ONLY
│     ├─ utils.ts                 # Utilities
│     └─ generation-debug.ts       # Debug utilities
│
├─ dist/                           # Build output (after npm run build)
│  ├─ index.html
│  ├─ assets/
│  │  ├─ index-[hash].js          # Main JS bundle
│  │  ├─ index-[hash].css         # Main CSS bundle
│  │  └─ vendor-[hash].js         # Vendor JS
│  └─ [static files]
│
├─ wordpress/                      # WordPress files
│  ├─ digital-scout-base-theme/    # Custom WordPress theme
│  │  ├─ header.php
│  │  ├─ footer.php
│  │  ├─ index.php
│  │  ├─ functions.php
│  │  └─ style.css
│  │
│  └─ multisite-mvp-provisioner/   # Custom provisioning plugin
│     └─ multisite-mvp-provisioner.php
│
├─ tests/                          # Test data
│  ├─ cafe.json
│  ├─ dental.json
│  ├─ gym.json
│  └─ validate-pipeline.js
│
└─ .debug-generation/              # Debug logs (created at runtime)
   ├─ 2026-05-14T10-30-45-salon-name/
   ├─ 2026-05-14T10-31-12-gym-name/
   └─ [one folder per generation]
```

### Key Entrypoints

| File           | Purpose             | Runtime       | Port |
| -------------- | ------------------- | ------------- | ---- |
| `src/main.tsx` | React app startup   | Browser       | -    |
| `server.ts`    | Express backend     | Node.js       | 5001 |
| `index.html`   | Frontend HTML shell | Browser       | -    |
| `package.json` | npm dependencies    | Build/Runtime | -    |

---

## EXECUTION FLOW DEEP DIVE

### User Flow: "Generate Website"

```
Step 1: User selects business
├─ Search business on map
├─ Click on map marker
└─ Sidebar shows: name, category, address, ratings

Step 2: User clicks "Generate" button
├─ Frontend: generateWebsite(business)
└─ POST /api/generate {business data}

Step 3: Backend generates website
├─ Check WEBSITE_GENERATION_MODE env var
├─ IF template: Use fallback schema (instant)
├─ IF gemini: Call Gemini API (5-30 seconds)
│  ├─ Build prompt from business data
│  ├─ Send to Gemini API
│  ├─ Extract JSON response
│  ├─ Normalize/validate schema
│  └─ Log debug info
└─ Return WebsiteSchema (sections, theme, brand)

Step 4: Frontend renders preview
├─ renderWebsiteArtifact(schema)
├─ Convert schema → HTML
├─ Inject TailwindCSS styles
├─ Store in project.websiteContent
└─ Show preview + deployment buttons

Step 5: Auto WordPress provision (if enabled)
├─ IF WordPress credentials present
├─ Build WordPressProvisioningPlan
├─ POST /api/wordpress/provision-site
├─ Create multisite subsite
├─ Create admin user
├─ Install theme
├─ Import media
├─ Create pages (Gutenberg blocks)
├─ Set homepage
└─ Return site URL + admin URL

Step 6: User clicks "Deploy to Netlify" (optional)
├─ POST /api/deploy {websiteContent, businessName}
├─ Backend creates Netlify site
├─ Returns deployed URL
├─ Frontend stores deployedUrl
└─ Show "View Live Site" button

Step 7: User clicks "Send Outreach" (optional)
├─ POST /api/outreach {phoneNumber, message, channel}
├─ Backend sends via CallHippo API
├─ WhatsApp preferred, SMS fallback
└─ Return success/error
```

### WordPress Multisite Data Flow

```
Gemini Response (JSON)
      │
      └─→ WebsiteSchema
           ├─ brand {name, category, address, email, phone, website}
           ├─ theme {colors, fonts, layout, style}
           ├─ seo {title, description, keywords}
           └─ sections: [
                 HeroSection,
                 FeaturesSection,
                 GallerySection,
                 TestimonialSection,
                 ContactSection,
                 CtaSection,
                 FaqSection
              ]
      │
      └─→ WordPressProvisioningPlan
           ├─ siteSlug: "salon-name"
           ├─ siteTitle: "Salon Name"
           ├─ pages: [
                 {title: "Home", slug: "home", content: "...gutenberg..."},
                 {title: "Services", slug: "services", content: "..."},
                 ...
              ]
           ├─ media: [{sourceUrl, alt, preferredFilename}, ...]
           └─ themeSettings: {palette, typography, radius, style}
      │
      └─→ WP REST API Calls
           ├─ POST /wp-json/wp/v2/sites (multisite)
           ├─ POST /wp-json/wp/v2/users (admin)
           ├─ POST /wp-json/wp/v2/media (images)
           ├─ POST /wp-json/wp/v2/pages (content)
           └─ PUT /wp-json/wp/v2/settings (homepage)
      │
      └─→ WordPress Multisite Database
           ├─ wp_blogs (subsite record)
           ├─ wp_2_posts (subsite pages)
           ├─ wp_2_postmeta (page metadata)
           ├─ wp_2_term_relationships (categories)
           └─ wp_usermeta (admin user)
```

---

## HOSTING REQUIREMENTS

### Runtime Environment

```
Node.js:
├─ Version: 18+ (minimum), 20+ (recommended)
├─ Module: ESM (ES modules)
├─ Interpreter: tsx (for TypeScript)

Memory:
├─ Frontend build: ~500MB (npm run build)
├─ Backend baseline: ~200MB
├─ Per request (Gemini): ~100-200MB
├─ Recommended total: 1-2GB RAM

CPU:
├─ Minimum: 1 core @ 1GHz
├─ Recommended: 2+ cores
├─ Gemini requests: ~100-500ms per request

Disk:
├─ Application code: ~200MB
├─ node_modules: ~500MB
├─ Frontend dist/: ~100MB
├─ WordPress: ~100MB
├─ Database: ~50-500MB (depends on subsites)
├─ Debug logs (.debug-generation/): Variable
├─ Media uploads (wp-content/uploads/): Variable
├─ Recommended: 5-10GB available

Network:
├─ Outbound: Gemini, Maps, Netlify, CallHippo, WordPress APIs
├─ Inbound: User browsers (HTTPS)
├─ Required ports: 80 (HTTP), 443 (HTTPS)
└─ No SSH required (unless managing server)
```

### Third-Party API Costs

| Service         | Free Tier          | Typical Cost                |
| --------------- | ------------------ | --------------------------- |
| **Gemini API**  | 15 req/min, 60/day | $5-50/month (100-500 sites) |
| **Google Maps** | $200 credit/month  | $0-50/month (discovery)     |
| **Netlify**     | 100 deploys/month  | Free for MVP                |
| **CallHippo**   | Variable pricing   | $0-100/month (outreach)     |
| **Total**       | Mostly free        | $5-150/month                |

---

## NAMECHEAP COMPATIBILITY ANALYSIS

### Option 1: Shared Hosting ❌ NOT VIABLE

```
Limitations:
├─ ❌ No Node.js runtime
├─ ❌ No server.ts execution
├─ ❌ No npm/package manager
├─ ❌ PHP-only environment
├─ ❌ Execution timeout (PHP scripts ~30 seconds max)
├─ ❌ Cannot run background processes
├─ ❌ No direct file system manipulation

What Breaks:
├─ ❌ All API endpoints (/api/generate, /api/deploy, etc.)
├─ ❌ Gemini integration
├─ ❌ Express.js backend
├─ ❌ Netlify deployment
├─ ❌ CallHippo messaging
├─ ❌ WordPress provisioning

What Works:
├─ ✅ Static frontend (if pre-built to dist/)
├─ ✅ WordPress installation (PHP native)

Verdict: DO NOT USE
```

### Option 2: Node.js Hosting (Namecheap Developer) ⚠️ INVESTIGATE

```
Potential:
├─ ✅ Node.js support
├─ ✅ npm available
├─ ✅ Express.js compatible
├─ ✅ Outbound HTTPS connections
├─ ⚠️  WordPress support?
├─ ⚠️  Database access?
├─ ⚠️  Build process support?

Unknowns to Verify:
1. Can you run separate WordPress instance?
2. Does it support multisite setup?
3. What's the deployment workflow?
4. Are there request rate limits?
5. Can you install custom plugins?
6. How are env variables managed?
7. What's the memory/CPU limits?

Verdict: Requires vendor clarification
```

### Option 3: VPS (Namecheap) ✅ RECOMMENDED

```
Full Control:
├─ ✅ Root/sudo access
├─ ✅ Custom software installation
├─ ✅ Node.js support
├─ ✅ WordPress multisite
├─ ✅ MySQL/MariaDB database
├─ ✅ Apache or Nginx
├─ ✅ SSL certificates
├─ ✅ Process manager (PM2, systemd)
├─ ✅ File system control
├─ ✅ Firewall configuration

Recommended Specs:
├─ RAM: 2GB minimum, 4GB recommended
├─ Storage: 50GB SSD (expandable)
├─ Bandwidth: 1TB/month (standard)
├─ CPU: 1-2 cores minimum

Cost:
├─ Starter: $5-10/month (2GB RAM, 1 core)
├─ Standard: $15-25/month (4GB RAM, 2 cores)
├─ Business: $30-50/month (8GB RAM, 4 cores)
├─ Domain: $10-15/year
├─ SSL: Free (Let's Encrypt)
└─ Annual: $65-200/year

Setup Time:
├─ Initial setup: 4-6 hours
├─ Testing: 8-10 hours
├─ Go-live: 2-3 hours
└─ Total: 1-2 weeks

Verdict: BEST OPTION
```

### Comparison Matrix

| Feature         | Shared | Node Host | VPS   |
| --------------- | ------ | --------- | ----- |
| Node.js Backend | ❌     | ✅        | ✅    |
| WordPress       | ✅     | ✅        | ✅    |
| npm/Build       | ❌     | ✅        | ✅    |
| File Control    | ⚠️     | ⚠️        | ✅    |
| MySQL Access    | ✅     | ✅        | ✅    |
| SSL Support     | ✅     | ✅        | ✅    |
| Full Control    | ❌     | ⚠️        | ✅    |
| Cost            | $3-8   | $10-30    | $5-30 |

---

## WORDPRESS ARCHITECTURE ASSESSMENT

### Current Setup: Multisite ✅ VIABLE

```
Architecture:
├─ Single WordPress installation
├─ Network enabled (multisite)
├─ Each business = 1 subsite
│  ├─ businessname.example.com (subdomain) OR
│  ├─ example.com/businessname (subpath)
├─ Shared database (wp_blogs + subsite tables)
├─ Shared theme: digital-scout-base-theme
├─ Pages created via Gutenberg blocks
└─ Content pushed via WP REST API

Pros:
├─ ✅ Single WordPress installation to manage
├─ ✅ Shared resources (themes, plugins)
├─ ✅ Network-wide updates
├─ ✅ Up to 1000+ subsites possible
├─ ✅ Existing provisioning code works
├─ ✅ Cost-effective (1 db, 1 server)

Cons:
├─ ⚠️ Single point of failure
├─ ⚠️ Database grows with each subsite
├─ ⚠️ Shared resources can be problematic
├─ ⚠️ More complex configuration
└─ ⚠️ Can be harder to manage at scale

Recommendation: ✅ USE THIS FOR MVP & PRODUCTION
```

### WordPress Multisite Setup for Namecheap VPS

```
Step 1: Install WordPress Core
├─ Download WordPress
├─ Create MySQL database
├─ Set up wp-config.php
├─ Run WordPress installation

Step 2: Enable Multisite
├─ wp-config.php: define('WP_ALLOW_MULTISITE', true);
├─ Go to wp-admin/network.php
├─ Run Network Setup wizard
├─ Verify .htaccess updated

Step 3: Configure Network
├─ Choose subpath OR subdomain mode
│  ├─ Subpath: example.com/business-name (simpler)
│  └─ Subdomain: business.example.com (cleaner)
├─ Add to wp-config.php
├─ Setup wildcard DNS (if subdomain)

Step 4: Upload Theme & Plugin
├─ Upload digital-scout-base-theme to wp-content/themes/
├─ Upload provisioning plugin to wp-content/plugins/
├─ Network activate both
├─ Set theme as default

Step 5: Configure Network Admin
├─ Create network admin user
├─ Set application password
├─ Test WP REST API access
├─ Verify provisioning endpoint
```

---

## PRODUCTION FOLDER STRUCTURE

### Namecheap VPS Recommended Layout

```
/home/digitalscout/                    # Application home
│
├─ app/                                # Backend application
│  ├─ server.ts
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ node_modules/
│  ├─ src/                             # (optional, can remove)
│  ├─ dist/                            # Frontend build
│  │  ├─ index.html
│  │  └─ assets/
│  ├─ .env.production
│  ├─ .gitignore
│  └─ ecosystem.config.js              # PM2 config
│
├─ wp/                                 # WordPress installation
│  ├─ wp-config.php
│  ├─ index.php
│  ├─ wp/                              # WordPress core
│  ├─ wp-content/
│  │  ├─ themes/
│  │  │  ├─ digital-scout-base-theme/
│  │  │  └─ [other themes]
│  │  ├─ plugins/
│  │  │  ├─ digital-scout-provisioner/
│  │  │  └─ [other plugins]
│  │  ├─ uploads/                      # Media files
│  │  │  └─ sites/                     # Per-subsite uploads
│  │  └─ mu-plugins/                   # Must-use plugins
│  ├─ .htaccess                        # Rewrite rules
│  └─ wp-config-sample.php             # Backup
│
├─ logs/                               # Application logs
│  ├─ app.log                          # Node.js output
│  ├─ error.log                        # Backend errors
│  ├─ access.log                       # HTTP requests
│  └─ wordpress/                       # WP debug logs
│
├─ backups/                            # Database backups
│  ├─ database/
│  │  ├─ wordpress-2026-05-14.sql.gz
│  │  └─ [daily backups]
│  └─ files/
│     ├─ wp-content-2026-05-14.tar.gz
│     └─ [weekly backups]
│
├─ .debug-generation/                  # Debug logs
│  ├─ 2026-05-14T10-30-45-salon-name/
│  │  ├─ 1-business-input.json
│  │  ├─ 2-generation-prompt.txt
│  │  ├─ 3-gemini-raw-response.json
│  │  ├─ 5-normalized-schema.json
│  │  ├─ 7-rendered-html.html
│  │  ├─ 8-wordpress-blocks.json
│  │  ├─ 9-final-preview-summary.md
│  │  └─ 10-errors.log
│  └─ [one folder per generation]
│
├─ temp/                               # Temporary files
│  ├─ uploads/                         # Temp file uploads
│  └─ cache/                           # Cache files
│
└─ config/                             # Configuration
   ├─ nginx.conf                       # Web server config
   ├─ pm2-ecosystem.config.js          # Process manager
   └─ systemd-digitalscout.service     # Systemd service
```

---

## BUILD & DEPLOYMENT FLOW

### Local Development Build

```
npm install
├─ Installs all dependencies
├─ Creates node_modules/
└─ Takes ~2 minutes

npm run build
├─ Vite builds frontend
├─ Creates dist/ folder
├─ Minifies JS/CSS
├─ Creates index.html
└─ Takes ~30 seconds

npm run dev:server (Terminal 1)
├─ Starts Express server
├─ Listens on :5001
├─ Auto-reloads on changes (tsx watch)
└─ Ready for API calls

npm run dev (Terminal 2)
├─ Starts Vite dev server
├─ Listens on :3000
├─ Hot reload enabled
└─ Browser opens automatically
```

### Production Deployment

```
Phase 1: Infrastructure Preparation
├─ 1. Provision Namecheap VPS (2GB RAM)
├─ 2. Install Node.js, npm, MySQL, Nginx
├─ 3. Setup SSL certificate (Let's Encrypt)
├─ 4. Create /home/digitalscout directory structure
└─ Takes ~4 hours

Phase 2: Deploy Code
├─ 1. Clone/upload application code
├─ 2. npm install --production
├─ 3. npm run build (creates dist/)
├─ 4. Create .env.production with secrets
└─ Takes ~1 hour

Phase 3: WordPress Setup
├─ 1. Download & extract WordPress core
├─ 2. Create MySQL database
├─ 3. Configure wp-config.php (multisite)
├─ 4. Run WordPress installation
├─ 5. Enable multisite
├─ 6. Upload theme & plugin
├─ 7. Activate network-wide
└─ Takes ~2 hours

Phase 4: Start Backend
├─ 1. Install PM2 globally: npm install -g pm2
├─ 2. Create ecosystem.config.js
├─ 3. Start: pm2 start ecosystem.config.js
├─ 4. Enable auto-startup: pm2 startup && pm2 save
└─ Takes ~30 minutes

Phase 5: Configure Web Server
├─ 1. Create Nginx/Apache config
├─ 2. Setup reverse proxy to :5001
├─ 3. Configure SSL certificates
├─ 4. Enable HTTPS redirect
├─ 5. Restart web server
└─ Takes ~1 hour

Phase 6: Testing & Verification
├─ 1. Test frontend: curl https://example.com
├─ 2. Test API: curl https://example.com/api/health
├─ 3. Test WordPress: curl https://example.com/wp-admin/
├─ 4. Test generation: POST /api/generate
├─ 5. Monitor logs: pm2 logs
└─ Takes ~2 hours

Total: ~14-16 hours active work over 1-2 weeks
```

### example ecosystem.config.js (PM2)

```javascript
module.exports = {
	apps: [
		{
			name: "digitalscout",
			script: "./server.ts",
			interpreter: "node",
			interpreterArgs: "--loader tsx/esm",

			// Scaling
			instances: "max",
			exec_mode: "cluster",

			// Restart rules
			max_memory_restart: "512M",
			autorestart: true,
			watch: false,

			env: {
				NODE_ENV: "production",
				PORT: 5001,
			},

			// Logging
			error_file: "/home/digitalscout/logs/error.log",
			out_file: "/home/digitalscout/logs/app.log",

			// Stability
			kill_timeout: 5000,
		},
	],

	deploy: {
		production: {
			user: "digitalscout",
			host: "example.com",
			ref: "origin/main",
			repo: "https://github.com/username/repo.git",
			path: "/home/digitalscout/app",
			"post-deploy": "npm install && npm run build",
		},
	},
};
```

---

## DATABASE REQUIREMENTS

### MySQL/MariaDB Setup

```
WordPress Database:
├─ Database name: wordpress
├─ Character set: utf8mb4
├─ Collation: utf8mb4_unicode_ci

Default Tables (first site):
├─ wp_posts (blog posts & pages)
├─ wp_postmeta (post metadata)
├─ wp_terms (categories, tags)
├─ wp_users (WordPress users)
├─ wp_usermeta (user metadata)
├─ wp_comments (comments)
├─ wp_options (site settings)

Multisite Tables:
├─ wp_blogs (all subsites)
├─ wp_blog_versions (version tracking)
├─ wp_sitemeta (network settings)

Per-Subsite Tables (dynamic):
├─ wp_2_posts (subsite 2 posts)
├─ wp_2_postmeta
├─ wp_2_terms
├─ wp_3_posts (subsite 3 posts)
├─ wp_3_postmeta
└─ ... (pattern continues)

Digital Scout Tables:
├─ NONE - All data in-memory or filesystem
├─ No separate app database needed
├─ WordPress is the sole database

Database User:
├─ Username: wp_user
├─ Grant: ALL PRIVILEGES on wordpress.*
├─ Includes: CREATE, ALTER, DROP (for subsite creation)

Database Size Estimates:
├─ Empty: 5-10 MB
├─ 10 subsites: 20-30 MB
├─ 100 subsites: 200-400 MB
├─ 1000 subsites: 2-4 GB
└─ Backup: ~50% of database size (compressed)
```

### MySQL User Setup

```sql
-- Create user
CREATE USER 'wp_user'@'localhost' IDENTIFIED BY 'strong_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON wordpress.* TO 'wp_user'@'localhost';

-- Refresh
FLUSH PRIVILEGES;
```

---

## ENVIRONMENT VARIABLES STRATEGY

### Required Production Variables

```bash
# Backend Configuration
NODE_ENV=production
PORT=5001
APP_URL=https://example.com

# API Keys (REQUIRED)
GEMINI_API_KEY=<actual_key>
GOOGLE_MAPS_PLATFORM_KEY=<actual_key>
VITE_NETLIFY_TOKEN=<actual_token>
CALLHIPPO_API_KEY=<actual_key>

# WordPress Multisite (REQUIRED)
WORDPRESS_MULTISITE_BASE_URL=https://example.com
WORDPRESS_MULTISITE_NETWORK_USERNAME=network-admin
WORDPRESS_MULTISITE_NETWORK_APP_PASSWORD=<app_password>

# Database (REQUIRED)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wordpress
DB_USER=wp_user
DB_PASSWORD=<password>

# Features
WEBSITE_GENERATION_MODE=gemini          # NOT template
CALLHIPPO_TEST_MOCK=false               # NOT true
CALLHIPPO_FORCE_SUCCESS=false           # NOT true

# Logging
LOG_LEVEL=info
DEBUG_LOGGING=true
```

### Variables to REMOVE

```
❌ DELETE ALL OF THESE:

# Laragon-specific (Windows local dev only)
LARAGON_TEMPLATE_PATH
LARAGON_SITES_PATH
LARAGON_APACHE_CONF_PATH
LARAGON_APACHE_BIN_PATH
LARAGON_MYSQL_HOST
LARAGON_MYSQL_PORT
LARAGON_MYSQL_ROOT_PASSWORD
LARAGON_LOCAL_DOMAIN

# Local proxy (only for .test domains)
LOCAL_WORDPRESS_PROXY_HOST
LOCAL_WORDPRESS_PROXY_PORT

# AI Studio artifact
DISABLE_HMR
```

### Variable Validation on Startup

```typescript
// server.ts initialization
function validateEnvironment() {
	const required = [
		"GEMINI_API_KEY",
		"GOOGLE_MAPS_PLATFORM_KEY",
		"VITE_NETLIFY_TOKEN",
		"WORDPRESS_MULTISITE_BASE_URL",
		"WORDPRESS_MULTISITE_NETWORK_USERNAME",
		"WORDPRESS_MULTISITE_NETWORK_APP_PASSWORD",
	];

	for (const key of required) {
		if (!process.env[key]) {
			console.error(`❌ Required env var missing: ${key}`);
			process.exit(1);
		}
	}

	console.log("✅ All required env vars present");
}
```

---

## LOCAL-ONLY CODE REMOVAL

### Files That Are Laragon-Specific

```
CRITICAL - Must be disabled/removed for production:

1. laragon-apache-vhost-manager.ts
   ├─ Purpose: Generate Apache vhost files
   ├─ Why breaks: Can't write to /etc/apache2/
   ├─ Fix: Disable entire file if PRODUCTION
   └─ Location: src/lib/laragon-apache-vhost-manager.ts

2. laragon-hosts-file-manager.ts
   ├─ Purpose: Modify Windows/Linux /etc/hosts
   ├─ Why breaks: Can't edit /etc/hosts (needs root)
   ├─ Fix: Disable entire file if PRODUCTION
   └─ Location: src/lib/laragon-hosts-file-manager.ts

3. laragon-mysql-manager.ts
   ├─ Purpose: Execute MySQL commands directly
   ├─ Why breaks: Requires MySQL CLI + root password
   ├─ Fix: Disable entire file if PRODUCTION
   └─ Location: src/lib/laragon-mysql-manager.ts

4. laragon-local-provisioner.ts
   ├─ Purpose: Provision WordPress on local Laragon
   ├─ Why breaks: All Laragon APIs, assumes .test domains
   ├─ Fix: Use multisite API instead
   └─ Location: src/lib/laragon-local-provisioner.ts

5. server.ts - proxyLocalWordPressRequest()
   ├─ Lines: ~230-320
   ├─ Purpose: Proxy to local .test WordPress
   ├─ Why breaks: No local .test domains exist
   ├─ Fix: Remove endpoint entirely
   └─ Location: server.ts
```

### Code Changes Required

```typescript
// Example: Disable local provisioning in production

// In server.ts - /api/wordpress/provision-site endpoint
if (process.env.NODE_ENV === "production") {
	// Production: use multisite API only
	const response = await provisionWordPressMultisiteSite(request);
	return res.json(response);
} else {
	// Development: try local first, fallback to multisite
	try {
		return await provisionLocalWordPressSite(request);
	} catch (error) {
		return await provisionWordPressMultisiteSite(request);
	}
}

// In laragon-local-provisioner.ts
export async function provisionLocalWordPressSite(request) {
	if (process.env.NODE_ENV === "production") {
		throw new Error("Local provisioning not available in production");
	}
	// ... existing Laragon code ...
}
```

---

## NETLIFY CLIENT SITE DEPLOYMENT

### Current Flow

```
1. Generate website (Gemini → schema)
2. Render preview (schema → HTML)
3. Store HTML in project.websiteContent
4. User clicks "Deploy"
5. POST /api/deploy {websiteContent, businessName}
6. Backend creates Netlify site
7. Returns deployed URL
8. Show "View Live Site" link
```

### Generated HTML Structure

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<title>Business Name</title>

		<!-- TailwindCSS inline -->
		<style>
			/* ~50KB minified */
		</style>
	</head>
	<body>
		<!-- Hero section -->
		<!-- Features section -->
		<!-- Gallery section -->
		<!-- Testimonials section -->
		<!-- FAQ section -->
		<!-- CTA section -->
		<!-- Contact section -->
	</body>
</html>
```

### Netlify API Integration

```typescript
// Deploy to Netlify
export async function deploySiteToNetlify(
	websiteContent: string,
	businessName: string,
): Promise<NetlifyDeployResult> {
	const response = await fetch(`${API_URL}/api/deploy`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ websiteContent, businessName }),
	});

	return await response.json();
	// Returns: {deployedUrl, siteId, deployId}
}
```

### Production Considerations

```
MVP: Simple HTML deployment (current)
├─ ✅ Works fine
├─ ✅ No build process needed
├─ ✅ Free tier available
└─ ✅ Fast deployments

Future Enhancements:
├─ ⏸️ Contact form handling
├─ ⏸️ Analytics integration
├─ ⏸️ Custom domain mapping
├─ ⏸️ Site analytics dashboard
└─ ⏸️ Serverless functions for backends
```

---

## MVP DEPLOYMENT STRATEGY

### Fastest Path to Production: 2 Weeks

```
WEEK 1:

Monday:
├─ 4 hours: Provision VPS + initial setup
├─ Install: Node.js, npm, MySQL, Nginx
└─ Configure: Firewall, SSH, domain DNS

Tuesday:
├─ 2 hours: Deploy application code
├─ npm install --production
├─ npm run build
├─ Configure .env.production

Wednesday:
├─ 2 hours: Install WordPress multisite
├─ Setup MySQL database
├─ Configure wp-config.php
├─ Enable multisite via setup wizard
├─ Upload theme & plugin

Thursday:
├─ 1 hour: Setup PM2 process manager
├─ Create ecosystem.config.js
├─ pm2 start & pm2 save

Friday:
├─ 2 hours: Setup Nginx + SSL
├─ Create nginx config
├─ Setup Let's Encrypt certificate
├─ Test HTTPS access

WEEK 2:

Monday-Tuesday:
├─ 8 hours: Comprehensive testing
├─ Frontend loading
├─ API endpoints working
├─ WordPress provisioning
├─ Netlify deployments
├─ Error handling

Wednesday:
├─ 2 hours: Load testing
├─ Monitor CPU/memory/disk
├─ Check for bottlenecks

Thursday:
├─ 2 hours: Security hardening
├─ Firewall rules
├─ HTTPS everywhere
├─ Rate limiting

Friday:
├─ 2 hours: Go-live verification
├─ Final sanity checks
├─ Monitor logs
└─ Declare MVP production-ready

Total: 25-30 hours = 1 developer week
```

### MVP Feature Scope

```
INCLUDE:
✅ Business discovery (Google Maps)
✅ Website generation (Gemini)
✅ Live preview
✅ WordPress provisioning
✅ Netlify deployment
✅ Outreach messaging (WhatsApp/SMS)
✅ Health checks & monitoring

DEFER TO PHASE 2:
⏸️ Advanced analytics
⏸️ Multi-user management
⏸️ Custom domain assignment
⏸️ Theme customization UI
⏸️ Bulk operations
⏸️ Complex outreach workflows

REMOVE:
❌ Laragon provisioning
❌ Debug UI
❌ Complex theming
```

---

## RISK AREAS & MITIGATION

### Critical Risks

```
RISK #1: Laragon Code in Production
Severity: 🔴 CRITICAL
Likelihood: 🔴 VERY HIGH

What Breaks:
├─ proxyLocalWordPressRequest() endpoint
├─ provisionLocalWordPressSite() function
├─ Apache vhost generation
├─ Hosts file modification
├─ MySQL direct execution

Mitigation:
✅ Remove all LARAGON_* env vars
✅ Add feature flags: if (NODE_ENV === 'prod')
✅ Delete /api/local-wordpress entirely
✅ Code review: grep for "laragon"
✅ Deployment checklist validation


RISK #2: Missing API Keys
Severity: 🔴 CRITICAL
Likelihood: 🔴 VERY HIGH

What Breaks:
├─ Website generation (no Gemini key)
├─ Google Maps (no Maps key)
├─ Netlify deployment (no token)
├─ WordPress provisioning (no credentials)
├─ Outreach (no CallHippo key)

Mitigation:
✅ Validate all env vars on startup
✅ Return helpful error messages
✅ Create checklist before deploy
✅ Setup env var manager/vault


RISK #3: Database Connection Failed
Severity: 🔴 CRITICAL
Likelihood: 🟡 MEDIUM

Mitigation:
✅ Test DB connection on startup
✅ Log connection string (without password)
✅ Auto-retry with exponential backoff
✅ Setup /health endpoint


RISK #4: WordPress Multisite Misconfiguration
Severity: ❌ CRITICAL
Likelihood: 🟡 MEDIUM

Mitigation:
✅ Use provided wp-config template
✅ Test subsite creation before go-live
✅ Verify WP REST API working
✅ Keep WordPress/plugins updated


RISK #5: Node.js Memory Leak
Severity: ❌ CRITICAL
Likelihood: 🟡 MEDIUM

Mitigation:
✅ Setup PM2 memory limit
✅ Auto-restart on threshold
✅ Monitor memory dashboard
✅ Run load tests
✅ Weekly deployments
```

---

## PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Deployment

```
Code Quality:
☐ No hardcoded URLs (except domain)
☐ No hardcoded API keys
☐ No test data in source
☐ TypeScript compiles: tsc --noEmit
☐ grep for "laragon" → 0 matches
☐ grep for "localhost:5001" → removed
☐ All imports resolved

Environment:
☐ .env.production created
☐ All API keys are REAL (not test)
☐ NODE_ENV=production
☐ WEBSITE_GENERATION_MODE=gemini (not template)
☐ CALLHIPPO_TEST_MOCK=false
☐ CALLHIPPO_FORCE_SUCCESS=false
☐ All URLs use HTTPS
☐ Database credentials verified

Build:
☐ npm install --production completes
☐ npm run build creates dist/
☐ No build warnings
☐ Source maps excluded
☐ Static files optimized
```

### Post-Deployment Testing

```
Connectivity:
☐ curl -I https://example.com → 200
☐ curl https://example.com/api/health → {status: "ok"}
☐ Browser accesses https://example.com
☐ No SSL warnings

Frontend:
☐ React app loads
☐ All images load
☐ CSS styles applied
☐ No console errors
☐ Responsive works

API:
☐ POST /api/generate works
☐ POST /api/deploy works
☐ POST /api/wordpress/provision-site works
☐ POST /api/outreach works

WordPress:
☐ https://example.com/wp-admin/ accessible
☐ Can login with credentials
☐ Network dashboard shows
☐ Can create subsite
☐ Subsite accessible at example.com/business-name/
☐ Theme activated

Monitoring:
☐ pm2 status shows running
☐ Logs accessible: pm2 logs
☐ No sensitive data in logs
☐ Memory usage reasonable (<300MB)
```

---

## SUMMARY & RECOMMENDATIONS

### Current Production Readiness

**Status:** ⚠️ **70% Ready**

```
✅ Ready for Production:
├─ Frontend architecture (React SPA)
├─ Backend API structure (Express)
├─ WordPress multisite design
├─ Netlify integration
├─ CallHippo integration
├─ Database design
└─ Authentication & security patterns

⚠️ Needs Fixes:
├─ Remove Laragon-specific code
├─ Update environment variables
├─ Configure for production domain
├─ Setup process manager (PM2)
├─ Configure web server (Nginx/Apache)
├─ Setup SSL certificate
└─ Test thoroughly on VPS

❌ Not Ready:
├─ No Laragon - use WordPress multisite API
├─ No .test domains - use real domain
├─ No local file modifications - use built-in APIs
└─ No shared hosting - must use VPS
```

### Next Phase Actions

```
IMMEDIATELY:
1. ☐ Create detailed deployment plan
2. ☐ Review Laragon code removal checklist
3. ☐ Set up Namecheap VPS account
4. ☐ Plan env variable configuration

WEEK 1:
5. ☐ Provision VPS infrastructure
6. ☐ Deploy application code
7. ☐ Install WordPress multisite
8. ☐ Configure .env.production

WEEK 2:
9. ☐ Comprehensive testing
10. ☐ Load testing
11. ☐ Security hardening
12. ☐ Go-live preparation

ONGOING:
13. ☐ Setup monitoring/alerts
14. ☐ Configure automated backups
15. ☐ Document deployment process
16. ☐ Create incident response plan
```

### Cost Estimate (Annual)

```
Infrastructure:
├─ VPS (2GB, 1 core): $60/year
├─ Domain: $12/year
├─ SSL: Free (Let's Encrypt)
└─ Subtotal: $72/year

Third-Party APIs:
├─ Gemini API: $50-200/year (depends on usage)
├─ Google Maps: $0-50/year
├─ Netlify: Free (MVP)
├─ CallHippo: $0-500/year (depends on outreach)
└─ Subtotal: $50-750/year

Total First Year: $122-822/year
- After first year (with established infrastructure): $50-750/year
```

---

**Document Status:** Complete Production Audit  
**Last Updated:** May 14, 2026  
**Next Review:** Before production deployment  
**Prepared For:** Architecture review and Namecheap VPS deployment
