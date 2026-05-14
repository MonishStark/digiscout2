<!-- @format -->

# Local WordPress Provisioning Implementation Guide

## Overview

This document outlines the newly implemented LOCAL WordPress provisioning system for Digital Scout. This replaces the previous dry-run/mock provisioning with REAL local WordPress site creation using Laragon.

## What Was Changed

### New Services Created

1. **laragon-apache-vhost-manager.ts** - Manages Apache virtual host configurations
   - Creates .conf files in Laragon Apache conf.d directory
   - Handles Apache restart/reload on Windows
   - Cleans up vhost configs on deletion

2. **laragon-hosts-file-manager.ts** - Manages Windows hosts file entries
   - Adds entries like `127.0.0.1 business-name.test`
   - Removes entries on site deletion
   - Works with Windows hosts file at `C:\Windows\System32\drivers\etc\hosts`

3. **laragon-mysql-manager.ts** - Manages MySQL database creation/deletion
   - Creates databases with wordpress\_ prefix
   - Connects to Laragon MySQL (127.0.0.1:3306)
   - Uses configured root credentials

4. **laragon-local-provisioner.ts** - Main orchestrator for complete site provisioning
   - Copies WordPress template from LARAGON_TEMPLATE_PATH to site-specific directory
   - Creates MySQL database
   - Updates wp-config.php with database credentials
   - Creates Apache vhost configuration
   - Adds hosts file entry
   - Returns real local site URL (e.g., `http://business-name.test`)

### Backend Changes

- **server.ts** - Updated `/api/wordpress/provision-site` endpoint
  - Changed from multisite provisioning to local provisioning
  - Calls `provisionLocalWordPressSite()` instead of `provisionWordPressMultisiteSite()`
  - Updated DELETE `/api/wordpress/site/:siteId` to use local deletion

- **package.json** - Added mysql2 dependency for database operations

## Environment Variables Required

All these should already be in your `.env.local`:

```
# Laragon paths
LARAGON_TEMPLATE_PATH=C:\laragon-classic\www\wordpress-sites\template
LARAGON_SITES_PATH=C:\laragon-classic\www\wordpress-sites\sites
LARAGON_APACHE_CONF_PATH=C:\laragon-classic\etc\apache2\conf.d
LARAGON_APACHE_BIN_PATH=C:\laragon-classic\bin\apache\bin

# Laragon local domain
LARAGON_LOCAL_DOMAIN=test

# MySQL credentials
LARAGON_MYSQL_HOST=127.0.0.1
LARAGON_MYSQL_PORT=3306
LARAGON_MYSQL_ROOT_PASSWORD=  # Empty if no password (typical Laragon setup)
```

## How It Works Now

### Generation Flow

When a user clicks "Generate Website":

1. **Frontend** (`LeadDetails.tsx`) calls `provisionWordPressSite()`
2. **Frontend** sends POST to `/api/wordpress/provision-site`
3. **Backend** (`server.ts`) calls `provisionLocalWordPressSite()`
4. **Provisioner** performs these steps:
   - Copies template WordPress site to `C:\laragon-classic\www\wordpress-sites\sites\<business-slug>`
   - Creates MySQL database `wordpress_<business-slug>`
   - Updates `wp-config.php` with database credentials
   - Creates Apache vhost config at `C:\laragon-classic\etc\apache2\conf.d\<business-slug>.conf`
   - Adds Windows hosts entry: `127.0.0.1 business-slug.test`
   - Reloads Apache to recognize new vhost
5. **Backend** returns success with real site URL: `http://business-slug.test`
6. **Frontend** displays the real URL to user
7. **User** can navigate to `http://business-slug.test` and see working WordPress site

### Deletion Flow

When a user clicks delete:

1. **Frontend** calls DELETE `/api/wordpress/site/:siteId`
2. **Backend** calls `deleteLocalWordPressSite(siteId)`
3. **Provisioner** cleans up:
   - Deletes site directory at `LARAGON_SITES_PATH\<siteId>`
   - Drops MySQL database `wordpress_<siteId>`
   - Deletes Apache vhost config
   - Removes hosts file entry
   - Reloads Apache

## Testing Checklist

### Prerequisites

- Laragon Classic installed and running
- MySQL running and accessible
- Apache running (at least initially)
- WordPress template at `C:\laragon-classic\www\wordpress-sites\template` is fully set up

### Step 1: Start the Backend

```bash
npm run dev:server
```

Backend should start on port 5001 without errors.

### Step 2: Start the Frontend (in another terminal)

```bash
npm run dev
```

Frontend should start on port 3000.

### Step 3: Test Generation

1. Open http://localhost:3000
2. Search for a business (e.g., "pizza restaurant in san francisco")
3. Click on a result to select it
4. Click "Generate Website"
5. **EXPECTED**:
   - Should see status updates in the UI
   - No more "standalone.local" or dry-run responses
   - Real URL like `http://pizza-restaurant.test` should appear
   - Status should show "Synced to WordPress"

### Step 4: Verify WordPress Site Created

1. In File Explorer, navigate to `C:\laragon-classic\www\wordpress-sites\sites\`
2. **EXPECTED**: New folder with business name (slugified)
3. Inside that folder: `wp-config.php`, `wp-content`, `wp-admin`, etc.

### Step 5: Verify Database Created

1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Look for database named `wordpress_<business-slug>`
3. **EXPECTED**: Database exists with WordPress tables (wp_posts, wp_users, etc.)

### Step 6: Verify Apache Vhost

1. Check `C:\laragon-classic\etc\apache2\conf.d\`
2. **EXPECTED**: File `<business-slug>.conf` exists with proper ServerName configuration

### Step 7: Access the Generated Site

1. Open browser and navigate to `http://business-slug.test` (replace with actual slug)
2. **EXPECTED**:
   - WordPress site loads
   - Shows the generated website content
   - Admin panel accessible at `http://business-slug.test/wp-admin`

### Step 8: Test Deletion

1. In the UI, find the generated lead
2. Click delete button
3. **EXPECTED**:
   - Site folder deleted from `LARAGON_SITES_PATH\<slug>`
   - Database `wordpress_<slug>` dropped from MySQL
   - Vhost config removed from `apache\conf.d\`
   - Hosts file entry removed
   - `http://business-slug.test` no longer accessible

## Troubleshooting

### Site URL still shows "standalone.local" or dry-run

- Check if backend is using old code
- Restart backend server: `npm run dev:server`
- Verify server.ts imports include `provisionLocalWordPressSite`

### Apache vhost not created / Apache restart fails

- Check if Apache is running
- Verify LARAGON_APACHE_CONF_PATH is correct
- Check Apache error logs in Laragon
- Try running Apache restart manually: Start → Services → Apache2.4 → Restart

### Database not created / connection fails

- Verify MySQL is running
- Check LARAGON_MYSQL_HOST, LARAGON_MYSQL_PORT, LARAGON_MYSQL_ROOT_PASSWORD
- Verify root user can connect: `mysql -u root -h 127.0.0.1`

### Hosts file entry not added

- Hosts file location: `C:\Windows\System32\drivers\etc\hosts`
- **IMPORTANT**: Must run as Administrator for changes to persist
- Or: Edit hosts file manually and add line: `127.0.0.1 business-slug.test`

### WordPress site folder copied but empty

- Check if template path is correct: `C:\laragon-classic\www\wordpress-sites\template`
- Verify template has all required files (wp-config.php, wp-content, etc.)
- Check file permissions

### Cannot access http://business-slug.test

- First, verify hosts file has entry: `127.0.0.1 business-slug.test`
- Check if vhost config exists: `C:\laragon-classic\etc\apache2\conf.d\<slug>.conf`
- Check Apache error log for 404 or vhost configuration issues
- Try clearing DNS cache: `ipconfig /flushdns` (Windows)

## Key Differences from Multisite (Old) Approach

| Aspect             | Old (Multisite)                          | New (Local)                         |
| ------------------ | ---------------------------------------- | ----------------------------------- |
| **Method**         | REST API to remote multisite             | Direct local file/folder operations |
| **Network**        | Requires remote WordPress multisite      | Standalone sites on local machine   |
| **Database**       | One shared database for all subsites     | Separate database per site          |
| **File Structure** | All sites in `/wp-content/blogs.dir/`    | Separate folder per site            |
| **Access**         | Via REST API authentication              | Direct file system access           |
| **Scaling**        | Limited by multisite licensing/structure | Limited by local disk/CPU           |
| **Cost**           | Depends on remote hosting                | Free (local Laragon)                |
| **Speed**          | Network latency                          | Near-instant (local)                |

## Next Steps

1. **Test the full flow** using the testing checklist above
2. **Verify all steps** work without errors
3. **Check log output** in backend terminal for any warnings
4. **Test deletion** to ensure complete cleanup
5. **Verify hosts file permissions** if having issues
6. Once verified, you can proceed to:
   - Display generated website content in WordPress
   - Add Gutenberg block integration
   - Set up outreach emails with real URLs
   - Deploy to production WordPress/Netlify (optional)

## Important Notes

- **Permissions**: The app needs Administrator access to:
  - Modify Windows hosts file
  - Restart Apache service
  - Create files in Apache conf.d
- **Laragon Setup**: Template must be a complete, working WordPress installation
- **Database**: Using root user for simplicity; can be made more secure by creating a dedicated user

- **Site Naming**: Business names are slugified (lowercase, hyphens, max 32 chars) for file/database names

- **Logs**: Check backend console for detailed provisioning logs with timestamps
