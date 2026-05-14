<!-- @format -->

# Pre-Test Verification Checklist

## Critical Items (Must Be Done)

### ✅ Checkpoint 1: Environment Variable Updated

```powershell
# VERIFY:
findstr "LARAGON_APACHE_CONF_PATH" "c:\Users\Dhanush\Downloads\digitalscout2\zip\.env.local"

# Expected output:
# LARAGON_APACHE_CONF_PATH=C:\laragon-classic\etc\apache2\sites-enabled

# NOT:
# LARAGON_APACHE_CONF_PATH=C:\laragon-classic\etc\apache2\conf.d
```

**Status:** ✅ Done

---

### ✅ Checkpoint 2: Old Vhost Files Cleaned

```powershell
# VERIFY sites-enabled contains only Laragon files:
Get-ChildItem "C:\laragon-classic\etc\apache2\sites-enabled" -Filter "*.conf" -Name | Sort-Object

# Expected output (EXACTLY these 3 files):
# 00-default.conf
# auto.wordpress-sites.test.conf
# auto.wp-template.test.conf

# NOT expected: one-hour-cleaners.conf, dri-clean-express.conf, etc.
```

**Status:** ✅ Done

---

### ✅ Checkpoint 3: Unused conf.d Cleaned

```powershell
# VERIFY conf.d is empty:
Get-ChildItem "C:\laragon-classic\etc\apache2\conf.d" -Filter "*.conf" -Name

# Expected output: (nothing - empty directory)
```

**Status:** ✅ Done

---

### ✅ Checkpoint 4: Apache Configuration Verified

```powershell
# VERIFY Apache loads from sites-enabled:
findstr "IncludeOptional.*sites-enabled" "C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\conf\httpd.conf"

# Expected output:
# IncludeOptional "C:/laragon-classic/etc/apache2/sites-enabled/*.conf"
```

**Status:** ✅ Verified (This is in Apache httpd.conf, won't change)

---

## Pre-Test Verification

Before testing deployment, verify these items:

### Database Access

```powershell
# MySQL must be running
# Check in Laragon Control Panel or test:
# mysql -h 127.0.0.1 -u root -p (no password)
```

- [ ] MySQL running (check Laragon)

### WordPress Template

```powershell
# Verify template exists
Test-Path "C:\laragon-classic\www\wordpress-sites\template\wp-config.php"
# Expected: True
```

- [ ] Template WordPress site exists

### Sites Directory

```powershell
# Directory for new sites
Test-Path "C:\laragon-classic\www\wordpress-sites\sites"
# Expected: True
```

- [ ] Sites directory exists with write permissions

### hosts File Setup

```powershell
# Verify DNS works
# Should be able to ping (will resolve to 127.0.0.1):
ping dri-clean-express.test -n 1

# Or check hosts file:
findstr /I "dri-clean-express.test" "C:\Windows\System32\drivers\etc\hosts"
# Should show: 127.0.0.1 dri-clean-express.test
```

- [ ] hosts file manager working (or previously tested)

### Frontend & Backend Running

```powershell
# Frontend should be running:
# npm run dev (in one terminal)

# Backend should be running:
# npm run dev:server (in another terminal or task)
```

- [ ] Frontend available at http://localhost:5173 (or configured port)
- [ ] Backend API at http://localhost:5001

---

## Test Procedure (Step-by-Step)

### Step 1: Ensure Apache is Running

```powershell
# Close Laragon completely
# Reopen Laragon Control Panel
# Wait for Apache to start (check status icon)
# Or verify:
Get-Process httpd -ErrorAction SilentlyContinue
# Should show one or more httpd processes
```

- [ ] Apache is running

### Step 2: Deploy a Test Site

1. Open Digital Scout UI
2. Click on a business (e.g., "Test Cleaners")
3. Click "Deploy" button
4. Watch provisioning status in browser console

- [ ] Deployment started successfully

### Step 3: Monitor Provisioning Logs

```
Expected log sequence:
[LocalWordPressProvisioner] subsite_creation: [info] Creating MySQL database
[LocalWordPressProvisioner] subsite_creation: [info] Copying WordPress template
[LocalWordPressProvisioner] subsite_creation: [info] Creating Apache vhost configuration
[LocalWordPressProvisioner] subsite_creation: [info] Adding hosts file entry
[LocalWordPressProvisioner] subsite_creation: [info] Reloading Apache
[LocalWordPressProvisioner] subsite_creation: [info] Provisioning completed successfully
```

- [ ] All provisioning steps completed

### Step 4: Verify Vhost File Created (In Right Place)

```powershell
# Immediately after deployment, check:
$siteName = "test-cleaners"  # Replace with your deployed site
Get-ChildItem "C:\laragon-classic\etc\apache2\sites-enabled\$siteName.conf" -ErrorAction SilentlyContinue

# Should exist
# If not found, deployment may have failed
```

- [ ] Vhost file exists in sites-enabled

### Step 5: Check Vhost Configuration

```powershell
# Check the generated file
$siteName = "test-cleaners"
Get-Content "C:\laragon-classic\etc\apache2\sites-enabled\$siteName.conf"

# Should show:
# - ServerName test-cleaners.test
# - DocumentRoot "C:/laragon-classic/www/wordpress-sites/sites/test-cleaners"
# - NO React rewrite rules (no "RewriteRule . /index.html")
# - AllowOverride All
# - Require all granted
```

- [ ] Vhost file has correct configuration

### Step 6: Test Homepage Access

```
Open in browser:
http://test-cleaners.test
(Replace test-cleaners with your site name)

Expected: WordPress homepage
          (Shows WordPress theme, not Laragon logo)

If you see: Laragon default page - Apache didn't reload
If you see: Blank page - DocumentRoot path issue
If you see: 404 - Site name mismatch or file not found
```

- [ ] ✅ Homepage loads WordPress

### Step 7: Test Admin Panel Access

```
Open in browser:
http://test-cleaners.test/wp-admin
(Replace test-cleaners with your site name)

Expected: WordPress login page
          (Shows login form)

If you see: 404 - Rewrite rules issue or PHP handler problem
If you see: Blank - PHP not configured
If you see: Permission denied - Directory permissions issue
```

- [ ] ✅ wp-admin loads WordPress login

### Step 8: Test Direct File Access

```
Open in browser:
http://test-cleaners.test/index.php

Expected: WordPress homepage
          (Same as Step 6)

This tests if PHP handler is working correctly.
```

- [ ] ✅ index.php accessible

### Step 9: Check Apache Error Logs

```powershell
# If any issues above, check logs:
Get-Content "C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\logs\error.log" -Tail 30

# OR site-specific logs:
Get-Content "C:\laragon-classic\www\wordpress-sites\sites\test-cleaners\error.log" -Tail 20
```

- [ ] No relevant errors in Apache logs

---

## Troubleshooting Flowchart

```
Does homepage load (http://site.test)?
    │
    ├─ YES → Does /wp-admin load?
    │        │
    │        ├─ YES → ✅ SUCCESS! System working
    │        │
    │        └─ NO →
    │            • Check AllowOverride All in vhost
    │            • Check .htaccess in WordPress root
    │            • Check error log for details
    │
    └─ NO (shows Laragon logo) →
        • Did you restart Apache? (close & reopen Laragon)
        • Does vhost file exist? (Check sites-enabled\site.conf)
        • Apache loaded config? (httpd.exe -S)
        • Check LARAGON_APACHE_CONF_PATH in .env.local
```

---

## Final Verification

```powershell
# Run this to see all loaded vhosts:
C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\bin\httpd.exe -S

# Output should include your deployed sites, e.g.:
# VirtualHost configuration:
# *:80                   00-default.conf (:22)
# *:80  wordpress-sites.test  auto.wordpress-sites.test.conf (:1)
# *:80  wp-template.test  auto.wp-template.test.conf (:1)
# *:80  test-cleaners.test  test-cleaners.conf (:1)  ← YOUR SITE
```

---

## Success Criteria

✅ **All of these must be true:**

1. [ ] Environment variable points to sites-enabled
2. [ ] Apache configuration loads from sites-enabled
3. [ ] No old vhost files with React rules exist
4. [ ] Deployment creates vhost in sites-enabled
5. [ ] http://site.test loads WordPress homepage
6. [ ] http://site.test/wp-admin loads WordPress login
7. [ ] Apache error logs show no relevant errors
8. [ ] Browser console shows no deployment errors

**If all checkboxes pass: The system is working correctly!** 🎉

---

## Quick Commands Reference

```powershell
# Restart Apache
Stop-Process -Name httpd -Force -ErrorAction SilentlyContinue
# Then reopen Laragon

# List deployed vhosts
Get-ChildItem "C:\laragon-classic\etc\apache2\sites-enabled\*.conf" -Name

# Check Apache loaded all configs
C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\bin\httpd.exe -S

# Check Apache syntax
C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\bin\httpd.exe -t

# View Apache error log
Get-Content "C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\logs\error.log" -Tail 20

# View site-specific error log
Get-Content "C:\laragon-classic\www\wordpress-sites\sites\[sitename]\error.log" -Tail 20

# Verify env vars (in .env.local)
findstr "LARAGON_APACHE" ".env.local"
```

---

**Last Updated:** 2026-05-13  
**Created for:** Apache Vhost Configuration Fix  
**Reference:** APACHE_VHOST_FIX_SUMMARY.md
