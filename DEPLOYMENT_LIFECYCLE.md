# DigitalScout Production Deployment Lifecycle

## 1. Prerequisites
- **cPanel API Token**: Generated in cPanel > Manage API Tokens.
- **WP-CLI**: Must be installed on the server (usually present on Namecheap).
- **MySQL Database**: One main database for the app to store the queue.

## 2. Environment Variables (.env.production)
```env
CPANEL_HOST=your-server.namecheap.com
CPANEL_USERNAME=your_username
CPANEL_API_TOKEN=your_token
DB_HOST=127.0.0.1
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_pass
WP_ROOT_DOMAIN=digiscout.online
WP_DOCROOT_BASE=/home/your_username/public_html/sites
ENCRYPTION_KEY=32_character_hex_key
```

## 3. Provisioning Workflow
1. **Queueing**: Frontend sends request to `/api/wordpress/provision-site`. Job inserted into `provisioning_jobs` as `pending`.
2. **DNS Setup**: Worker calls cPanel UAPI to add a subdomain. Document root is created at `/sites/{subdomain}`.
3. **DB Setup**: Worker creates a new isolated database and user. Privileges are granted.
4. **WP Install**: Worker uses `wp core download` and `wp core install` via WP-CLI.
5. **Configuration**: Permalinks and basic settings are configured.
6. **Validation**: Worker checks if the site responds over HTTP.
7. **Completion**: Job marked as `completed`. Records added to `isolated_deployments`.

## 4. Troubleshooting
- **Logs**: Check the `logs` column (JSON) in the `provisioning_jobs` table for step-by-step execution details.
- **WP-CLI Path**: If WP-CLI is in a non-standard path, update `src/lib/wp-cli.ts` to point to the absolute path.
- **Memory Limits**: Shared hosting may kill long-running Node processes. The worker uses a 5s interval and handles process restarts via the `locked_at` timeout (10 mins).

## 5. Verification Checklist
- [ ] `node build/server.js` starts without DB errors.
- [ ] `curl http://localhost:5001/` returns "DigitalScout API Running".
- [ ] Subdomains are correctly created in cPanel.
- [ ] Databases prefix matches `CPANEL_USERNAME`.
