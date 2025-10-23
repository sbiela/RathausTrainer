# Strato VPS Setup für Rathaus Trainer

## 🚀 Schritt-für-Schritt Anleitung:

### 1. Strato VPS bestellen
- **VPS Basic** (1 vCPU, 1GB RAM) - ~5€/Monat
- **Ubuntu 20.04/22.04** wählen
- **SSH-Zugang** aktivieren

### 2. SSH-Zugang einrichten
```bash
# SSH-Key generieren (auf deinem Computer)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Key auf Server kopieren
ssh-copy-id root@rathaustrainer.familiebiela.de
```

### 3. Server-Setup
```bash
# Auf deinem VPS
sudo apt update && sudo apt upgrade -y
sudo apt install nginx -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### 4. Projekt deployen
```bash
# Projekt hochladen
scp -r /Users/simon/Desktop/Maxis\ Rathaus-Trainer/* root@rathaustrainer.familiebiela.de:/var/www/rathaustrainer/

# Auf Server
cd /var/www/rathaustrainer
npm install
pm2 start server.js
pm2 save
pm2 startup
```

### 5. Nginx konfigurieren
```bash
# Nginx-Konfiguration
sudo nano /etc/nginx/sites-available/rathaustrainer.familiebiela.de
```

**Nginx-Konfiguration:**
```nginx
server {
    listen 80;
    server_name rathaustrainer.familiebiela.de;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SSL-Zertifikat (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d rathaustrainer.familiebiela.de
```

## 🎯 Ergebnis:
- ✅ **https://rathaustrainer.familiebiela.de**
- ✅ **Echte Echtzeit-Kommunikation**
- ✅ **Alle Bilder funktional**
- ✅ **Professionelles Hosting**
