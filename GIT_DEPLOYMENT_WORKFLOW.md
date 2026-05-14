# Git Deployment Workflow

This document outlines the standard operating procedure for deploying updates to the Digital Scout application using a Git-based workflow.

## Environments

- **Local Development**: Your local machine (Windows/Mac/Linux)
- **Staging/Origin**: GitHub Repository (`main` branch)
- **Production**: Namecheap Stellar Shared Hosting (cPanel)

## 1. Local Development Workflow

All new features and bug fixes should be developed and tested locally before deployment.

1. **Pull latest changes**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create a feature branch** (optional but recommended):
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Develop and test**:
   ```bash
   npm run dev:all
   ```
4. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

## 2. Push to GitHub (Origin)

Once local testing is complete, push the changes to GitHub. This acts as the source of truth for the production server.

1. **Push branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
2. **Merge to main** (via Pull Request or direct merge):
   ```bash
   git checkout main
   git merge feature/your-feature-name
   git push origin main
   ```

## 3. Namecheap Pull Workflow (Production Deployment)

To deploy the new changes to production, SSH into the Namecheap server and pull the code from GitHub.

1. **SSH into Namecheap**:
   ```bash
   ssh username@your-cpanel-host.com
   ```
2. **Navigate to the application directory**:
   ```bash
   cd ~/nodesapp/digitalscout
   ```
3. **Pull the latest `main` branch**:
   ```bash
   git pull origin main
   ```
   *Note: If there are conflicts (e.g., changes made directly on the server), you may need to stash or reset. Avoid making direct code changes on the production server to prevent this.*

## 4. Frontend Rebuild Workflow

If the changes included frontend updates (React components, CSS, etc.), you must rebuild the frontend.

1. **Install dependencies** (if `package.json` changed):
   ```bash
   npm install --production=false
   ```
2. **Build the frontend**:
   ```bash
   npm run build
   ```
3. **Deploy the built assets to public_html**:
   ```bash
   # Remove old assets
   rm -rf ~/public_html/assets
   rm -f ~/public_html/index.html
   
   # Copy new build
   cp -r dist/* ~/public_html/
   ```

## 5. Backend Restart Workflow

If the changes included backend updates (`server.ts`, lib functions, etc.), you must restart the Node.js application.

### Option A: Via cPanel UI (Recommended)
1. Log into cPanel
2. Navigate to **Setup Node.js App**
3. Locate `digitalscout` in the application list
4. Click the **Restart** icon

### Option B: Via SSH
If you have SSH access, you can trigger a restart by updating the `tmp/restart.txt` file (Phusion Passenger standard):
```bash
touch ~/nodesapp/digitalscout/tmp/restart.txt
```

## 6. Rollback Workflow

If a deployment causes critical issues in production, you can quickly roll back to the previous stable commit.

1. **SSH into Namecheap**:
   ```bash
   cd ~/nodesapp/digitalscout
   ```
2. **Find the last stable commit**:
   ```bash
   git log --oneline
   ```
3. **Reset to the stable commit**:
   ```bash
   # Replace COMMIT_HASH with the actual hash
   git reset --hard COMMIT_HASH
   ```
4. **Rebuild frontend** (if necessary) and **Restart backend** (see sections 4 & 5).
