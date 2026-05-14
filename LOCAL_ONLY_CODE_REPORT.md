<!-- @format -->

# LOCAL-ONLY CODE REMOVAL REPORT

**Digital Scout - Namecheap Shared Hosting Deployment**  
**Date:** May 14, 2026  
**Status:** Codebase Analysis Complete

---

## EXECUTIVE SUMMARY

This application contains **4 Laragon-specific files** and **1 local proxy route** that are DEVELOPMENT-ONLY and MUST be disabled or removed for production deployment.

**Action Required:**

- ✅ Feature-flag all Laragon code (disable when `NODE_ENV=production`)
- ❌ Remove `/api/local-wordpress` proxy routes
- ❌ Delete LARAGON\_\* environment variables
- ✅ Verify production uses WordPress Multisite API directly

---

## 1. LOCAL-ONLY FILES

### 1.1 laragon-local-provisioner.ts

**Location:** `src/lib/laragon-local-provisioner.ts`

**Purpose:**

- Provisions WordPress sites on local Laragon Windows environment
- Creates WordPress directory structure on local drive
- Sets up local Apache vhost configuration
- Imports and uses Laragon-specific managers

**Exports:**

- `provisionLocalWordPressSite()` - Main provisioning function
- `deleteLocalWordPressSite()` - Site deletion

**Why It Breaks in Production:**

- Assumes `C:\laragon-classic\www\` directory structure (Windows-specific)
- Calls Apache vhost manager (no Apache control on Namecheap)
- Calls hosts file manager (no /etc/hosts access on Namecheap)
- Calls MySQL manager (no direct MySQL CLI access)
- References `.test` local domains

**Action:** ⚠️ **FEATURE FLAG**

```typescript
// At top of file - AFTER imports:
if (process.env.NODE_ENV === "production") {
	throw new Error(
		"Local provisioning not available in production. Use WordPress Multisite API.",
	);
}
```

**Deployment:** File is NOT deployed to Namecheap. Entire module disabled at runtime.

---

### 1.2 laragon-apache-vhost-manager.ts

**Location:** `src/lib/laragon-apache-vhost-manager.ts`

**Purpose:**

- Generates Apache vhost configuration files
- Writes files to `C:\laragon-classic\etc\apache2\sites-enabled\`
- Creates configuration for `.test` domains

**Exports:**

- `ApacheVhostManager` class
- Methods to create, update, delete vhost files

**Why It Breaks in Production:**

- Writes to filesystem: cannot write to Namecheap Apache config
- Namecheap manages Apache configuration through cPanel
- No direct access to `/etc/apache2/`
- Manual vhost management not allowed

**Action:** ⚠️ **FEATURE FLAG** (via parent laragon-local-provisioner.ts)

**Deployment:** File is NOT deployed. Never imported in production path.

---

### 1.3 laragon-hosts-file-manager.ts

**Location:** `src/lib/laragon-hosts-file-manager.ts`

**Purpose:**

- Modifies system `/etc/hosts` file (or Windows hosts file)
- Adds DNS entries for local `.test` domains
- Example: `127.0.0.1 business-name.test`

**Exports:**

- `HostsFileManager` class
- Methods to add/remove/verify hosts entries

**Why It Breaks in Production:**

- Requires root/admin access (can't modify /etc/hosts)
- Namecheap DNS handled via domain registrar
- `.test` domains don't exist on Namecheap
- File modification requires filesystem access

**Action:** ⚠️ **FEATURE FLAG** (via parent laragon-local-provisioner.ts)

**Deployment:** File is NOT deployed. Never imported in production path.

---

### 1.4 laragon-mysql-manager.ts

**Location:** `src/lib/laragon-mysql-manager.ts`

**Purpose:**

- Executes MySQL commands directly via CLI
- Creates databases and users
- Manages MySQL root password authentication

**Exports:**

- `MySQLManager` class
- Methods to execute MySQL CLI commands

**Why It Breaks in Production:**

- Assumes local MySQL CLI installed and accessible
- Requires MySQL root password in environment
- Cannot execute arbitrary shell commands on shared hosting
- Namecheap MySQL managed through cPanel

**Action:** ⚠️ **FEATURE FLAG** (via parent laragon-local-provisioner.ts)

**Deployment:** File is NOT deployed. Never imported in production path.

---

## 2. LOCAL PROXY ROUTES

### 2.1 proxyLocalWordPressRequest()

**Location:** `server.ts` lines 223-360

**Purpose:**

- HTTP proxy to local `.test` WordPress domains
- Routes `/api/local-wordpress/{siteSlug}/*` requests
- Rewrites URLs from `.test` domain to proxy path
- Manages cookies, headers, HTML rewriting

**Routes Affected:**

- `app.all("/api/local-wordpress/:siteSlug", proxyLocalWordPressRequest)`
- `app.all("/api/local-wordpress/:siteSlug/*", proxyLocalWordPressRequest)`

**Why It Breaks in Production:**

- No local `.test` domains exist on Namecheap
- Request to `/api/local-wordpress/business-name/` has nowhere to proxy
- Headers rewritten for local domain - doesn't exist
- Fallback to `127.0.0.1:80` won't work on shared hosting

**Current Usage in server.ts:**

```typescript
// Lines 17 (import)
import { provisionLocalWordPressSite, deleteLocalWordPressSite } from "./src/lib/laragon-local-provisioner";

// Lines 223-360 (function definition)
async function proxyLocalWordPressRequest(req: Request, res: Response) { ... }

// Lines 363-364 (route registration)
app.all("/api/local-wordpress/:siteSlug", proxyLocalWordPressRequest);
app.all("/api/local-wordpress/:siteSlug/*", proxyLocalWordPressRequest);
```

**Action:** ❌ **REMOVE COMPLETELY**

- Delete function `proxyLocalWordPressRequest()` (lines 223-360)
- Delete route registrations (lines 363-364)
- Remove import of `provisionLocalWordPressSite` and `deleteLocalWordPressSite` (only if not used elsewhere)

**Alternative for Production:**

- WordPress Multisite sites are accessed directly: `https://example.com/business-name/`
- No proxy needed - WordPress handles multisite routing

---

## 3. ENVIRONMENT VARIABLES TO REMOVE

These variables are **LOCAL DEVELOPMENT ONLY** and must be REMOVED from production:

### Laragon-Specific Variables

```bash
# ❌ DELETE THESE - Windows Laragon only
LARAGON_TEMPLATE_PATH=C:\laragon-classic\www\wordpress-sites\template
LARAGON_SITES_PATH=C:\laragon-classic\www\wordpress-sites\sites
LARAGON_APACHE_CONF_PATH=C:\laragon-classic\etc\apache2\sites-enabled
LARAGON_APACHE_BIN_PATH=C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\bin
LARAGON_LOCAL_DOMAIN=test
LARAGON_MYSQL_HOST=127.0.0.1
LARAGON_MYSQL_PORT=3306
LARAGON_MYSQL_ROOT_PASSWORD=
```

### Local Proxy Variables

```bash
# ❌ DELETE THESE - Local proxy only
LOCAL_WORDPRESS_PROXY_HOST=127.0.0.1
LOCAL_WORDPRESS_PROXY_PORT=80
```

### AI Studio Variables

```bash
# ❌ DELETE THIS - AI Studio development only
DISABLE_HMR=true
```

---

## 4. PRODUCTION-READY CODE

### Architecture Path for Production

```
User Request
    ↓
Namecheap Shared Hosting (cPanel)
    ├─ Static Frontend (nginx/Apache → /public_html/dist/)
    ├─ Node.js Backend (cPanel Node.js App → :5001)
    └─ WordPress (cPanel WordPress → /public_html/wp/)
    ↓
Express Backend (server.ts)
    ├─ /api/generate → Gemini API
    ├─ /api/deploy → Netlify API
    ├─ /api/wordpress/provision-site → WP REST API
    ├─ /api/outreach → CallHippo API
    └─ /* → Serve frontend (dist/)
    ↓
WordPress Multisite API (REST)
    └─ Create subsites, pages, media
```

**Code That Stays Unchanged:**

- ✅ `server.ts` (minus local proxy routes)
- ✅ `src/lib/wordpress-provisioning.ts` (uses WP REST API)
- ✅ `src/lib/gemini.ts` (Gemini AI integration)
- ✅ `src/lib/netlify.ts` (Netlify deployment)
- ✅ `src/lib/callhippo-service.ts` (WhatsApp/SMS)
- ✅ `src/lib/website-renderer.ts` (HTML generation)
- ✅ All React components
- ✅ vite.config.ts (frontend build)
- ✅ package.json (dependencies)

---

## 5. FEATURE FLAG IMPLEMENTATION

### Check: NODE_ENV in Production Code

**Where to Add:**
All code that imports Laragon modules should check NODE_ENV:

#### In laragon-local-provisioner.ts (TOP OF FILE)

```typescript
if (process.env.NODE_ENV === "production") {
	throw new Error(
		"Local WordPress provisioning not available in production. Use WordPress Multisite API instead.",
	);
}
```

#### In server.ts (BEFORE ROUTE REGISTRATION)

```typescript
// LOCAL DEVELOPMENT ONLY - Proxy to local .test WordPress
if (process.env.NODE_ENV !== "production") {
	app.all("/api/local-wordpress/:siteSlug", proxyLocalWordPressRequest);
	app.all("/api/local-wordpress/:siteSlug/*", proxyLocalWordPressRequest);
} else {
	console.log("[SECURITY] Local WordPress proxy disabled in production");
}
```

---

## 6. DEPLOYMENT CHECKLIST

### Pre-Deployment Code Review

```
Code Quality:
☐ Run: grep -r "laragon" src/ server.ts --ignore-case
  ✅ Should return: 0 matches (except imports in non-production code)
☐ Run: grep -r "\.test" src/ server.ts
  ✅ Should return: 0 matches (except in comments)
☐ Run: grep -r "LARAGON_" server.ts
  ✅ Should return: 0 matches in production code
☐ Run: grep -r "/api/local-wordpress" src/
  ✅ Should return: 0 matches (routes removed)

Production Build:
☐ npm run build completes without errors
☐ dist/ folder created with all assets
☐ No build warnings about Laragon/local code
☐ TypeScript compiles: tsc --noEmit (exit code 0)

Imports:
☐ laragon-local-provisioner only imported in development code
☐ proxyLocalWordPressRequest removed from production routes
☐ All imports can be resolved

Environment:
☐ NODE_ENV=production set in Namecheap
☐ No LARAGON_* variables in .env.production
☐ No LOCAL_WORDPRESS_* variables in .env.production
☐ All required production variables present
```

---

## 7. IMPACT ANALYSIS

### What Works Without Changes

- ✅ Website generation (Gemini API)
- ✅ Netlify deployment
- ✅ CallHippo outreach
- ✅ Frontend React SPA
- ✅ Database design

### What Changes

- ⚠️ WordPress provisioning path:
  - FROM: Local Laragon provisioning
  - TO: WordPress Multisite API (REST API)
- ⚠️ Site access:
  - FROM: `.test` domains via proxy
  - TO: Real domain subpaths (example.com/business-name/)

### What's Removed

- ❌ Local file system modifications
- ❌ Apache vhost generation
- ❌ Hosts file modification
- ❌ Local MySQL management
- ❌ Local domain proxy

---

## 8. SUMMARY TABLE

| Item                    | File                            | Action         | Reason                      |
| ----------------------- | ------------------------------- | -------------- | --------------------------- |
| Local provisioning      | laragon-local-provisioner.ts    | Feature-flag   | Laragon-specific            |
| Apache vhost generation | laragon-apache-vhost-manager.ts | Never imported | Requires filesystem access  |
| Hosts file management   | laragon-hosts-file-manager.ts   | Never imported | Requires root access        |
| MySQL management        | laragon-mysql-manager.ts        | Never imported | Requires CLI access         |
| Local proxy             | server.ts (lines 223-364)       | Remove         | `.test` domains don't exist |
| LARAGON\_\* env vars    | .env.local                      | Remove         | Windows-specific paths      |
| LOCAL*WORDPRESS*\* vars | .env.local                      | Remove         | Local proxy only            |
| WordPress provisioning  | wordpress-provisioning.ts       | No change      | Uses WP REST API ✅         |
| Frontend build          | vite config                     | No change      | Works as-is ✅              |
| Backend API             | server.ts (minus proxy)         | Minor cleanup  | Remove local routes ✅      |

---

**Status:** Ready for Production Deployment  
**Next Step:** Follow NAMECHEAP_DEPLOYMENT_GUIDE.md for deployment instructions
