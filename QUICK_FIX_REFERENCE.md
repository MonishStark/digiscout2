<!-- @format -->

# Quick Fix Reference - Apache Vhost Issue

## THE PROBLEM

WordPress sites deploy but show "Laragon default page" instead of the WordPress homepage.

## THE CAUSE

Vhost files were being written to `conf.d/` but Apache loads from `sites-enabled/`

## THE FIX (ALREADY APPLIED)

✅ Updated `.env.local`:

```
LARAGON_APACHE_CONF_PATH=C:\laragon-classic\etc\apache2\sites-enabled
```

✅ Cleaned old vhost files
✅ Verified code is correct

## WHAT YOU NEED TO DO NOW

### 1. Restart Apache/Laragon (CRITICAL!)

```powershell
# Close Laragon completely, then reopen it
# OR manually:
Get-Process httpd -ErrorAction SilentlyContinue | Stop-Process -Force
# Then restart Laragon
```

### 2. Test It

1. Click "Deploy" on a business
2. Open: `http://business-name.test`
3. ✅ Should see WordPress homepage
4. Open: `http://business-name.test/wp-admin`
5. ✅ Should see WordPress login

### 3. Verify (Optional)

```powershell
# Check vhost file was created in RIGHT place
Get-ChildItem "C:\laragon-classic\etc\apache2\sites-enabled\*.conf" -Name

# Should show your deployed site
```

## IF IT DOESN'T WORK

**Scenario 1: Still shows Laragon default page**

- Did you restart Apache? (close & reopen Laragon)
- Verify: `Get-ChildItem "C:\laragon-classic\etc\apache2\sites-enabled\business-name.conf"`
- If file doesn't exist, check deployment logs for errors

**Scenario 2: 404 on /wp-admin**

- Verify WordPress files exist: `Test-Path "C:\laragon-classic\www\wordpress-sites\sites\business-name\wp-admin"`
- Check vhost file is correct (no React rewrite rules)
- Verify Apache loaded config:
  ```powershell
  C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\bin\httpd.exe -S
  ```

**Scenario 3: Random errors**

- Check Apache error log:
  ```powershell
  Get-Content "C:\laragon-classic\bin\apache\httpd-2.4.54-win64-VS16\logs\error.log" -Tail 20
  ```

## TECHNICAL DETAILS (For Reference)

### Files Modified

- `.env.local` - LARAGON_APACHE_CONF_PATH updated
- Cleaned `C:\laragon-classic\etc\apache2\sites-enabled\` (removed old files with wrong rules)
- Cleaned `C:\laragon-classic\etc\apache2\conf.d\` (not used by Apache)

### Why This Works

Apache's httpd.conf has:

```
IncludeOptional "C:/laragon-classic/etc/apache2/sites-enabled/*.conf"
```

(NOT conf.d - that was the bug!)

### Generated Vhost Format

```
<VirtualHost *:80>
    ServerName business-name.test
    DocumentRoot "C:/laragon-classic/www/wordpress-sites/sites/business-name"

    <Directory "C:/laragon-classic/www/wordpress-sites/sites/business-name">
        AllowOverride All
        Require all granted
    </Directory>

    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>
</VirtualHost>
```

(Clean, no React rules, proper for WordPress)

---

**Status:** ✅ Fixed
**Do Next:** Restart Laragon and test!
