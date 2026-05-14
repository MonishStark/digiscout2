# Server Commands Cheat Sheet

This document contains the essential SSH commands needed to manage, update, and troubleshoot the Digital Scout application on Namecheap Stellar Shared Hosting.

## 1. Initial Setup

**Clone the repository:**
```bash
# Navigate to your Node.js apps directory
cd ~/nodesapp

# Clone the repo (replace with your repo URL)
git clone https://github.com/YourOrg/digitalscout2.git digitalscout
```

**Install dependencies:**
```bash
cd ~/nodesapp/digitalscout
npm install
```

## 2. Deployment Updates

**Pull latest code from GitHub:**
```bash
cd ~/nodesapp/digitalscout
git pull origin main
```

**Rebuild Frontend:**
```bash
# Build the React app
npm run build

# Clear old assets and deploy new ones
rm -rf ~/public_html/assets
rm -f ~/public_html/index.html
cp -r dist/* ~/public_html/
```

## 3. Application Management

**Restart the Node.js Backend:**
```bash
# The standard cPanel/Passenger way to restart an app
touch ~/nodesapp/digitalscout/tmp/restart.txt
```

**Check Application Logs:**
```bash
# View cPanel error logs
tail -n 50 -f ~/logs/error_log

# If using PM2 (optional)
pm2 logs digitalscout
pm2 status
```

**Check WordPress Logs:**
```bash
# View WordPress debug logs (if WP_DEBUG is enabled)
tail -n 50 -f ~/public_html/wp-content/debug.log
```

## 4. Troubleshooting

**Check Node.js Version:**
```bash
node -v
```

**Verify Environment Variables:**
```bash
# View the configured production variables (do not share this output!)
cat ~/nodesapp/digitalscout/.env.production
```

**Test API Health Locally (from Server):**
```bash
curl -I https://localhost:5001/api/health
```

## 5. File Management

**Edit Environment Variables:**
```bash
nano ~/nodesapp/digitalscout/.env.production
# Use Ctrl+O to save, Ctrl+X to exit
```

**Update WordPress Config:**
```bash
nano ~/public_html/wp-config.php
```
