# Setup Deployment ke VPS

Panduan deployment menggunakan GitHub Actions ke VPS dengan user yang sudah ada.

## 1. Persiapan SSH Key

### Di Komputer Local:

```bash
# Generate SSH key pair baru (jika belum punya)
ssh-keygen -t ed25519 -C "racetify-deployment" -f ~/.ssh/racetify-vps

# Akan generate 2 file:
# - ~/.ssh/racetify-vps (private key - untuk GitHub Actions)
# - ~/.ssh/racetify-vps.pub (public key - copy ke VPS)

# Copy public key ke VPS
# Option 1: Jika punya ssh-copy-id (Linux/Mac)
ssh-copy-id -i ~/.ssh/racetify-vps.pub YOUR_USER@YOUR_VPS_IP

# Option 2: Manual (Windows atau jika ssh-copy-id tidak tersedia)
# 1. Tampilkan public key
cat ~/.ssh/racetify-vps.pub
# Atau di Windows PowerShell:
# type ~\.ssh\racetify-vps.pub

# 2. Copy output-nya, lalu login ke VPS dan paste:
ssh YOUR_USER@YOUR_VPS_IP
mkdir -p ~/.ssh
echo "PASTE_PUBLIC_KEY_DISINI" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
exit

# Test SSH connection
ssh -i ~/.ssh/racetify-vps YOUR_USER@YOUR_VPS_IP
```

**Penting:**
- **Private key** (`~/.ssh/racetify-vps`) → Untuk GitHub Actions Secret `VPS_SSH_KEY`
- **Public key** (`~/.ssh/racetify-vps.pub`) → Di-copy ke VPS

## 2. Setup Direktori Aplikasi di VPS

```bash
# Login ke VPS
ssh YOUR_USER@YOUR_VPS_IP

# Option 1: Gunakan home directory (tidak perlu sudo)
mkdir -p ~/apps/racetify-photo
mkdir -p ~/apps/racetify-photo/logs

# Option 2: Atau gunakan /var/www (perlu sudo)
# sudo mkdir -p /var/www/racetify-photo
# sudo mkdir -p /var/www/racetify-photo/logs
# sudo chown -R $USER:$USER /var/www/racetify-photo
# sudo chmod -R 755 /var/www/racetify-photo
```

**Rekomendasi:** Gunakan `~/apps/racetify-photo` untuk menghindari permission issues.  
Jika menggunakan home directory, update path di ecosystem.config.js dan GitHub workflow menjadi `~/apps/racetify-photo`.

## 3. Install Node.js & PM2 di VPS

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js
nvm install 22
nvm use 22
nvm alias default 22

# Install PM2 globally
npm install -g pm2

# Setup PM2 startup
pm2 startup
# Jalankan command yang di-generate oleh PM2 startup
```

## 4. Setup PM2 Ecosystem File

```bash
# Masuk ke direktori aplikasi
cd ~/apps/racetify-photo

# Buat ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'racetify-photo',
    cwd: '~/apps/racetify-photo',  // Sesuaikan dengan path yang dipilih
    script: './.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9001,
      NITRO_PORT: 9001
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: '~/apps/racetify-photo/logs/err.log',  // Sesuaikan dengan path
    out_file: '~/apps/racetify-photo/logs/out.log',    // Sesuaikan dengan path
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
EOF

# Buat direktori logs
mkdir -p logs

# Start aplikasi dengan PM2
pm2 start ecosystem.config.js
pm2 save
```

## 5. Setup GitHub Actions Secrets

Di GitHub repository, tambahkan secrets berikut:

**Settings → Secrets and variables → Actions → Secrets:**

- `VPS_HOST`: IP address VPS (misal: `123.45.67.89`)
- `VPS_USERNAME`: Username SSH Anda (misal: `root` atau username yang digunakan)
- `VPS_SSH_KEY`: Private key dari `~/.ssh/racetify-vps` (isi lengkap file)
- `VPS_PORT`: `22` (atau custom SSH port)
- `SUPABASE_URL`: URL Supabase project
- `SUPABASE_KEY`: Anon key dari Supabase

**Settings → Secrets and variables → Actions → Variables:**

- `PORT`: `9001` (atau port custom)

## 6. Test Deployment

Dari local machine, test SSH connection:

```bash
ssh -i ~/.ssh/racetify-vps YOUR_USER@YOUR_VPS_IP

# Jika berhasil, test PM2:
cd ~/apps/racetify-photo
pm2 status
```

**Note:** Jika menggunakan `/var/www/racetify-photo`, ganti semua path `~/apps/racetify-photo` dengan `/var/www/racetify-photo`.

## 7. Setup Nginx/Reverse Proxy (Opsional)

```bash
# Install Nginx
sudo apt update
sudo apt install nginx -y

# Buat config untuk racetify-photo
sudo nano /etc/nginx/sites-available/racetify-photo

# Paste config berikut:
```

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=app_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration (akan diatur oleh Certbot)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Hide Nginx version
    server_tokens off;
    
    # Max upload size (sesuaikan dengan kebutuhan upload foto)
    client_max_body_size 50M;
    client_body_buffer_size 128k;
    
    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
    gzip_disable "MSIE [1-6]\.";
    
    # Rate limiting per location
    limit_req zone=app_limit burst=20 nodelay;
    limit_conn conn_limit 10;
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        proxy_cache_bypass $http_upgrade;
    }
    
    # API endpoints dengan rate limit lebih ketat
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API specific timeouts (lebih panjang untuk upload)
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Static assets dengan caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Cache static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ \.(env|log|sql|md)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Health check endpoint (tanpa rate limit)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
    
    # Access & Error logs
    access_log /var/log/nginx/racetify-photo-access.log;
    error_log /var/log/nginx/racetify-photo-error.log;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/racetify-photo /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 8. Setup SSL dengan Let's Encrypt (Opsional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal sudah di-setup otomatis oleh certbot
```

## 9. Security Best Practices

1. **Disable Password Authentication untuk SSH:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set:
   PasswordAuthentication no
   PubkeyAuthentication yes
   PermitRootLogin no
   
   sudo systemctl restart sshd
   ```

2. **Setup Firewall:**
   ```bash
   sudo ufw allow 22/tcp      # SSH
   sudo ufw allow 80/tcp      # HTTP
   sudo ufw allow 443/tcp     # HTTPS
   sudo ufw enable
   sudo ufw status
   ```

3. **Install Fail2Ban (Proteksi dari brute force):**
   ```bash
   sudo apt install fail2ban -y
   
   # Buat config untuk SSH
   sudo cat > /etc/fail2ban/jail.local << 'EOF'
   [DEFAULT]
   bantime = 3600
   findtime = 600
   maxretry = 5
   
   [sshd]
   enabled = true
   port = ssh
   logpath = /var/log/auth.log
   
   [nginx-limit-req]
   enabled = true
   filter = nginx-limit-req
   action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
   logpath = /var/log/nginx/*error.log
   findtime = 600
   bantime = 7200
   maxretry = 10
   EOF
   
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   sudo fail2ban-client status
   ```

4. **Setup Automatic Security Updates:**
   ```bash
   sudo apt install unattended-upgrades -y
   sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```

5. **Environment Variables Security:**
   - Semua sensitive data di `.env` file
   - `.env` file harus mode `600` (hanya owner yang bisa read/write)
   ```bash
   chmod 600 ~/apps/racetify-photo/.env
   ```

6. **Regular Security Monitoring:**
   ```bash
   # Check logs regularly
   sudo tail -f /var/log/nginx/racetify-photo-error.log
   sudo tail -f /var/log/auth.log
   
   # Check fail2ban status
   sudo fail2ban-client status sshd
   
   # Check active connections
   sudo netstat -antp | grep :3000
   ```

7. **Database Security (Supabase):**
   - Gunakan Row Level Security (RLS) policies
   - Jangan expose service_role key di client-side
   - Gunakan anon key dengan RLS policies yang ketat

8. **Backup Strategy:**
   ```bash
   # Setup automated backup script
   sudo cat > /usr/local/bin/backup-racetify.sh << 'EOF'
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="~/backups/racetify-photo"
   mkdir -p $BACKUP_DIR
   
   # Backup application
   tar -czf $BACKUP_DIR/app_$DATE.tar.gz ~/apps/racetify-photo/.output
   
   # Keep only last 7 backups
   ls -t $BACKUP_DIR/app_*.tar.gz | tail -n +8 | xargs rm -f
   EOF
   
   sudo chmod +x /usr/local/bin/backup-racetify.sh
   
   # Add to crontab (daily at 2 AM)
   (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-racetify.sh") | crontab -
   ```

## Troubleshooting

### PM2 not found in PATH
```bash
# Tambahkan NVM ke PATH di ~/.bashrc atau ~/.profile
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
source ~/.bashrc
```

### Permission Denied saat deploy
```bash
# Pastikan ownership correct
chmod -R 755 ~/apps/racetify-photo

# Atau jika pakai /var/www:
# sudo chown -R $USER:$USER /var/www/racetify-photo
# sudo chmod -R 755 /var/www/racetify-photo
```

### PM2 tidak auto-start setelah reboot
```bash
pm2 startup
# Copy dan jalankan command yang dihasilkan dengan sudo
pm2 save
```
