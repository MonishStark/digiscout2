<!-- @format -->

# Apache Vhost Fix - Testing Guide

## Problem Summary

WordPress sites deployed locally showed Laragon's default page instead of the WordPress site.

**Root Cause:**

- Vhost config files were being created in `C:\laragon-classic\etc\apache2\conf.d\`
- But Apache was configured to load vhost files from `C:\laragon-classic\etc\apache2\sites-enabled\`
- Additionally, some old vhost files in sites-enabled had incorrect React SPA rewrite rules

## Solution Applied

### 1. Environment Variable Fixed ✅

```
LARAGON_APACHE_CONF_PATH=C:\laragon-classic\etc\apache2\sites-enabled
```

Changed from: `C:\laragon-classic\etc\apache2\conf.d`

**File Modified:** `.env.local` (line ~35)

### 2. Old Vhost Files Cleaned ✅

- Deleted problematic vhost files from sites-enabled (had React rewrite rules)
- Cleaned up unused conf.d directory
- Kept Laragon auto-generated vhosts:
  - `00-default.conf`
  - `auto.wordpress-sites.test.conf`
  - `auto.wp-template.test.conf`

### 3. Verified Vhost Generator Code ✅

- `laragon-apache-vhost-manager.ts` correctly generates clean WordPress vhost configs
- No React rewrite rules added
- Proper DocumentRoot and Directory settings
- PHP handler configured

## Pre-Testing Verification

### Check 1: Apache Configuration

```powershell
# Verify Apache loads sites-enabled
Get-Content "C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\conf\httpd.conf" | Select-String "sites-enabled"
# Should show: IncludeOptional "C:/laragon-classic/etc/apache2/sites-enabled/*.conf"
```

### Check 2: Directory Structure

```powershell
# Verify sites-enabled has only Laragon auto-files
Get-ChildItem "C:\laragon-classic\etc\apache2\sites-enabled" -Filter "*.conf" -Name

# Expected output:
# 00-default.conf
# auto.wordpress-sites.test.conf
# auto.wp-template.test.conf

# Verify conf.d is empty
Get-ChildItem "C:\laragon-classic\etc\apache2\conf.d" -Filter "*.conf" -Name
# Should be empty (no output)
```

## Testing Procedure

### Step 1: Restart Laragon & Apache

1. Stop Laragon (close Laragon Control Panel or app)
2. Kill any Apache processes:
   ```powershell
   Get-Process httpd -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
3. Restart Laragon application (this will start Apache with new config)
4. Wait for Apache to fully start (check Laragon Control Panel)

### Step 2: Deploy a Test Site

1. Use the Digital Scout UI to click "Deploy" on a business
2. Select a business with a simple name like "test-site" (avoid special characters)
3. Watch the provisioning logs in the browser console

### Step 3: Verify Vhost File Created

After deployment, check that the vhost file was created in the correct location:

```powershell
# List newly created vhost files
Get-ChildItem "C:\laragon-classic\etc\apache2\sites-enabled" -Filter "*.conf" -Name | Sort-Object

# Should show your deployed site, e.g.:
# 00-default.conf
# auto.wordpress-sites.test.conf
# auto.wp-template.test.conf
# test-site.conf  <-- NEW FILE

# Check the content
Get-Content "C:\laragon-classic\etc\apache2\sites-enabled\test-site.conf"

# Expected format (NO React rewrite rules):
# <VirtualHost *:80>
#     ServerName test-site.test
#     ServerAlias www.test-site.test
#
#     DocumentRoot "C:/laragon-classic/www/wordpress-sites/sites/test-site"
#
#     <Directory "C:/laragon-classic/www/wordpress-sites/sites/test-site">
#         Options Indexes FollowSymLinks
#         AllowOverride All
#         Require all granted
#     </Directory>
#     ...
# </VirtualHost>
```

### Step 4: Test Browser Access

In your browser, test both URLs:

1. **Homepage:**

   ```
   http://test-site.test
   ```

   ✅ Should show the WordPress homepage (not Laragon default page)
   ❌ If you see Laragon logo: Apache didn't reload or vhost not found

2. **Admin Panel:**

   ```
   http://test-site.test/wp-admin
   ```

   ✅ Should show WordPress login page
   ❌ If you see 404 or blank: rewrite rules or directory config issue

3. **Direct File:**
   ```
   http://test-site.test/index.html
   ```
   ✅ Should show the WordPress homepage (index.html exists in WP root)
   ❌ If you see 404: DocumentRoot path issue

### Step 5: Check Apache Error Logs

If sites don't load, check Apache error logs:

```powershell
# Real-time log view (last 20 lines)
Get-Content "C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\logs\error.log" -Tail 20

# Or check site-specific logs
Get-Content "C:\laragon-classic\www\wordpress-sites\sites\test-site\error.log" -Tail 10
```

## Troubleshooting

### Issue: Still seeing Laragon default page

**Solutions:**

1. Did you restart Apache? (not just the frontend app)
   - Close all Laragon windows
   - Kill httpd.exe processes
   - Restart Laragon
2. Check vhost file exists in sites-enabled (not conf.d)
3. Check the vhost file has correct DocumentRoot path
4. Run: `C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\bin\httpd.exe -S` to list loaded vhosts

### Issue: 404 Not Found on /wp-admin

**Solutions:**

1. Check that WordPress files exist in DocumentRoot:
   ```powershell
   Test-Path "C:\laragon-classic\www\wordpress-sites\sites\test-site\wp-admin"
   ```
2. Verify vhost has: `<FilesMatch \.php$>` SetHandler and `AllowOverride All`
3. Check WordPress .htaccess file in DocumentRoot
4. Verify PHP is configured to handle .php files

### Issue: "Not Found" for regular pages

**Solutions:**

1. Check DocumentRoot path uses forward slashes (should be `C:/laragon-classic/...`)
2. Verify `.htaccess` exists in WordPress root:
   ```powershell
   Get-ChildItem "C:\laragon-classic\www\wordpress-sites\sites\test-site\" -Filter ".htaccess"
   ```
3. Ensure mod_rewrite is enabled in Apache:
   ```powershell
   findstr /I "mod_rewrite" "C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\conf\httpd.conf"
   ```

## Verification Checklist

- [ ] .env.local has LARAGON_APACHE_CONF_PATH=C:\laragon-classic\etc\apache2\sites-enabled
- [ ] conf.d directory is empty
- [ ] sites-enabled has only auto.\* and 00-default.conf before deployment
- [ ] Apache restarted (Laragon closed and reopened)
- [ ] New deployment created vhost in sites-enabled (NOT conf.d)
- [ ] Vhost file has NO React rewrite rules
- [ ] http://[sitename].test loads WordPress (not Laragon default)
- [ ] http://[sitename].test/wp-admin shows WordPress login
- [ ] Apache error logs have no relevant errors

## If Fix Fails

1. Check provisioning logs in browser console for errors
2. Verify file permissions on:
   - `C:\laragon-classic\etc\apache2\sites-enabled`
   - `C:\laragon-classic\www\wordpress-sites\sites`
3. Ensure MySQL database was created and populated
4. Run Apache syntax check:
   ```powershell
   C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\bin\httpd.exe -t
   ```
5. Check that rewrite rules in .htaccess are correct for WordPress

---

**Last Updated:** 2026-05-13
**Status:** Fix Applied & Documented
