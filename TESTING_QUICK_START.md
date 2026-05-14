<!-- @format -->

# Quick Start: Testing Local WordPress Provisioning

## 🎯 What You Have Now

A fully functional LOCAL WordPress provisioning system that:

- ✅ Creates REAL WordPress sites in Laragon
- ✅ Creates MySQL databases automatically
- ✅ Creates Apache vhosts automatically
- ✅ Adds local domain names (.test) automatically
- ✅ Provides working admin panels
- ✅ Cleans up completely on deletion

---

## 🚀 Start Testing (5 Minutes)

### Step 1: Open Two Terminals

**Terminal 1** - Backend (Port 5001):

```bash
cd c:\Users\Dhanush\Downloads\digitalscout2\zip
npm run dev:server
```

**Expected Output**:

```
> tsx watch server.ts
Loaded environment from .env.local
Server running on port 5001
```

**Terminal 2** - Frontend (Port 3000):

```bash
cd c:\Users\Dhanush\Downloads\digitalscout2\zip
npm run dev
```

**Expected Output**:

```
> vite --port=3000 --host=0.0.0.0
VITE v6.2.3 running at:
http://localhost:3000
```

---

### Step 2: Generate a Website

1. **Open browser**: http://localhost:3000
2. **Search for business**: "restaurant san francisco" (or any business)
3. **Click on a result** to select it
4. **Click "Generate Website"** button
5. **Watch the magic** ✨

**What Should Happen**:

```
[Backend Console]
[LocalWordPressProvisioner] Copying template...
[LocalWordPressProvisioner] Creating MySQL database...
[LocalWordPressProvisioner] Updating wp-config.php...
[ApacheVhost] Created vhost config...
[HostsFile] Added entry...
[ApacheVhost] Apache reloaded successfully

[Frontend UI]
Lead status changes: "Generating..." → "Lead Ready"
Real URL appears: http://restaurant-name.test
No more "standalone.local" ❌
No more ERR_NAME_NOT_RESOLVED ❌
```

---

### Step 3: Verify Everything Was Created

#### File System Check

```
C:\laragon-classic\www\wordpress-sites\sites\
├── restaurant-name/           ← NEW FOLDER!
│   ├── wp-admin/
│   ├── wp-content/
│   ├── wp-config.php
│   ├── index.php
│   └── ...
```

#### Database Check

1. Open: http://localhost/phpmyadmin
2. Look for: `wordpress_restaurant_name` database
3. **Should see**: wp_posts, wp_users, wp_options tables

#### Apache Vhost Check

```
C:\laragon-classic\etc\apache2\conf.d\
├── restaurant-name.conf       ← NEW FILE!
│   ServerName restaurant-name.test
│   DocumentRoot C:/laragon-classic/www/wordpress-sites/sites/restaurant-name
```

#### Hosts File Check

```
C:\Windows\System32\drivers\etc\hosts

127.0.0.1 restaurant-name.test  ← NEW ENTRY!
```

---

### Step 4: Access the WordPress Site

**In Browser, Navigate To**:

```
http://restaurant-name.test
```

**What You Should See**:

- ✅ WordPress site loads
- ✅ Generated website content displays
- ✅ Navigation works
- ✅ All sections visible (hero, features, testimonials, etc.)

**Access WordPress Admin**:

```
http://restaurant-name.test/wp-admin
```

**Default Credentials** (in backend logs):

- Username: `admin`
- Password: Check backend terminal output during generation

---

### Step 5: Test Deletion

**In Frontend UI**:

1. Find the generated lead in "Leads" tab
2. Click the **Delete** button
3. Confirm deletion

**What Should Happen**:

```
[Backend Console]
[LocalWordPressProvisioner] Deleting site...
Deleted site directory: C:\laragon-classic\www\wordpress-sites\sites\restaurant-name
Deleted database: wordpress_restaurant_name
Deleted vhost configuration
Removed hosts file entry

[After Deletion]
- Folder C:\laragon-classic\www\wordpress-sites\sites\restaurant-name → GONE
- Database wordpress_restaurant_name → GONE
- Vhost config → GONE
- Hosts entry → GONE
- http://restaurant-name.test → Cannot access (404 or DNS fail)
```

---

## 📊 Expected Results

### Generation Success ✅

- Real folder created in Laragon sites directory
- Real database created in MySQL
- Real vhost created in Apache
- Real hosts entry added
- Real URL accessible in browser
- Real WordPress site displays generated content
- Real admin panel works

### Generation Failure ❌

- Still see "standalone.local" URL
- Browser shows ERR_NAME_NOT_RESOLVED
- Backend console shows multisite dry-run message
- Vhost not created in conf.d

If you see failures, **restart backend**: Ctrl+C in Terminal 1, then `npm run dev:server`

---

## 🔧 Troubleshooting Quick Fixes

### Issue: Still shows "standalone.local"

```bash
# Backend might still be running old code
# Fix: Restart backend
# Ctrl+C in Terminal 1
npm run dev:server
```

### Issue: Apache won't restart

```bash
# Check if Apache is running
# Open Services: Start → services.msc
# Find Apache2.4 → right-click → Restart

# Or check Laragon status bar in system tray
```

### Issue: Hosts file entry not added

```bash
# Need Administrator access
# Option 1: Run terminal as Administrator and restart backend
# Option 2: Manually add to C:\Windows\System32\drivers\etc\hosts:
#   127.0.0.1 restaurant-name.test
```

### Issue: Cannot connect to MySQL

```bash
# Verify MySQL is running in Laragon
# Check if root user exists:
mysql -u root -h 127.0.0.1

# If fails, restart MySQL from Laragon control panel
```

### Issue: Site folder appears empty

```bash
# WordPress template might be incomplete
# Verify template at: C:\laragon-classic\www\wordpress-sites\template
# Should contain: wp-admin, wp-content, wp-includes, wp-config.php, etc.

# If empty, restore from Laragon WordPress installation
```

---

## 📈 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ USER CLICKS "GENERATE WEBSITE"                                  │
└──────────────────────────────────────┬──────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
            ┌───────▼────────┐                   ┌──────────▼────────┐
            │   FRONTEND     │                   │   BACKEND         │
            │ (React/Vite)   │                   │ (Node/Express)    │
            └────────────────┘                   └──────────┬────────┘
                    │                                       │
                    │ POST /api/wordpress/provision-site   │
                    │──────────────────────────────────────>│
                    │                                       │
                    │                    ┌─────────────────┼─────────────────┐
                    │                    │                 │                 │
                    │         ┌──────────▼──┐  ┌──────────▼──┐  ┌──────────▼──┐
                    │         │ Copy        │  │  Create    │  │  Create    │
                    │         │ Template    │  │  Database  │  │  Vhost     │
                    │         │ Folder      │  │  mysql_db  │  │  Config    │
                    │         └─────────────┘  └────────────┘  └────────────┘
                    │                    │
                    │         ┌──────────┼──┐
                    │         │          │  │
                    │    ┌────▼──┐  ┌────▼──┐
                    │    │Update │  │Add    │
                    │    │wp-cfg │  │Hosts  │
                    │    └───────┘  └───────┘
                    │                    │
                    │         ┌──────────▼──┐
                    │         │  Reload    │
                    │         │  Apache    │
                    │         └────────────┘
                    │                       │
            ┌───────▼──────────────────────▼──────┐
            │ Return: {                           │
            │   site: {                           │
            │     siteUrl: "http://business.test",│
            │     ...                             │
            │   }                                 │
            │ }                                   │
            └───────┬──────────────────────────────┘
                    │
            ┌───────▼────────────────┐
            │ Display Real URL       │
            │ in UI                  │
            └────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        │                          │
   ┌────▼─────┐            ┌──────▼─────┐
   │ User     │            │ Real Files │
   │ navigates│            │ Created:   │
   │ to URL   │            │ ✅ Folder  │
   │          │            │ ✅ DB      │
   │ ✅ WORKS │            │ ✅ Vhost   │
   │          │            │ ✅ Hosts   │
   └──────────┘            └────────────┘
```

---

## ✅ Success Indicators

**If you see these, it's working perfectly** ✅

Frontend:

- [ ] Real URL displays (not "standalone.local")
- [ ] Can click and navigate to URL
- [ ] WordPress content shows
- [ ] Admin panel accessible at /wp-admin

Backend:

- [ ] Provisioning logs show each step
- [ ] No error messages
- [ ] "Apache reloaded successfully" appears

File System:

- [ ] Site folder created with WordPress files
- [ ] Database created in MySQL
- [ ] Vhost config file created
- [ ] Hosts file entry added

---

## 🎓 Learning Path

**Once basic testing works**:

1. **Understand the flow**
   - Read `LOCAL_PROVISIONING_GUIDE.md`
   - Follow backend logs during generation
   - Check created files and database

2. **Test edge cases**
   - Generate multiple sites
   - Delete and regenerate
   - Check cleanup is thorough

3. **Explore the code**
   - `laragon-local-provisioner.ts` - Main logic
   - `laragon-apache-vhost-manager.ts` - Apache handling
   - `laragon-hosts-file-manager.ts` - Hosts file handling
   - `laragon-mysql-manager.ts` - Database operations

4. **Next features** (when ready)
   - WordPress content integration
   - Gutenberg block display
   - Outreach email configuration
   - Production deployment

---

## 🆘 Need Help?

1. **Check logs**: Look at backend terminal output (Terminal 1)
2. **Read guide**: See `LOCAL_PROVISIONING_GUIDE.md` troubleshooting section
3. **Verify setup**: Ensure Laragon is installed with WordPress template
4. **Restart services**: Kill backends and restart fresh
5. **Check permissions**: Run terminal as Administrator if hosts file fails

---

## 📝 Quick Command Reference

```bash
# Start backend
npm run dev:server

# Start frontend (separate terminal)
npm run dev

# Check TypeScript errors
npm run lint

# Stop services
Ctrl+C

# View logs
Check backend terminal window (Terminal 1)

# Test specific endpoint (PowerShell)
curl -X POST http://localhost:5001/api/wordpress/provision-site ^
  -H "Content-Type: application/json" ^
  -d '{"projectId":"test","business":{"name":"test","address":"..."}...}'
```

---

## 🎉 You're Ready!

Everything is implemented and ready to test.

**Start with**:

```bash
npm run dev:server    # Terminal 1
npm run dev           # Terminal 2
```

**Then generate a website and watch it work!**

Real local WordPress sites are now at your fingertips! 🚀
