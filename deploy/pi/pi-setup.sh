#!/usr/bin/env bash
#
# Einmaliges Setup fuer den Raspberry Pi (Server + Projektion per HDMI).
# Ausfuehren als normaler Benutzer; sudo wird bei Bedarf abgefragt.
#
#   bash pi-setup.sh
#
set -euo pipefail

APP_DIR="$HOME/normalex-photo-loader"
KIOSK_URL="http://localhost:3000/projector"
KIOSK_SCRIPT="$HOME/kiosk.sh"

echo "==> Photo-Loader Pi-Setup"

# ---------- 1. Node.js installieren (falls fehlt) ----------
if ! command -v node >/dev/null 2>&1; then
  echo "==> Installiere Node.js 20..."
  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    echo "Kein apt-get gefunden. Bitte Node.js 20+ manuell installieren." >&2
    exit 1
  fi
fi
echo "Node: $(node --version)"

# ---------- 2. Grafische Basis + Chromium fuer Kiosk ----------
if ! command -v chromium-browser >/dev/null 2>&1 && ! command -v chromium >/dev/null 2>&1; then
  echo "==> Installiere X, Openbox und Chromium..."
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends xserver-xorg xinit openbox chromium-browser
fi
echo "Chromium vorhanden"

# ---------- 3. App kopieren + bauen ----------
if [ ! -d "$APP_DIR" ]; then
  echo "==> $APP_DIR fehlt. Kopiere das Projekt hierher (z.B. per git clone oder scp)."
  echo "    Dann erneut ausfuehren."
  exit 1
fi

cd "$APP_DIR/server"
echo "==> Installiere Server-Abhaengigkeiten..."
npm install --omit=dev

cd "$APP_DIR/client"
echo "==> Baue Client..."
if ! command -v npm >/dev/null 2>&1; then exit 1; fi
npm install
npm run build

# ---------- 4. systemd-Dienst fuer den Server ----------
echo "==> Richte systemd-Dienst ein..."
sudo tee /etc/systemd/system/photo-loader.service >/dev/null <<EOF
[Unit]
Description=Photo Loader Server
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR/server
ExecStart=/usr/bin/node src/index.js
Environment=PORT=3000
Environment=SLIDESHOW_INTERVAL_MS=6000
Restart=always
RestartSec=2
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable photo-loader
sudo systemctl restart photo-loader
echo "Server-Dienst gestartet."

# ---------- 5. Kiosk-Autostart ----------
echo "==> Richte Kiosk-Browser ein..."
cat > "$KIOSK_SCRIPT" <<EOF
#!/usr/bin/env bash
# Startet Chromium im Vollbild auf die Projektor-Ansicht.
sleep 3
CHROME=\$(command -v chromium-browser || command -v chromium)
exec \$CHROME --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 "$KIOSK_URL"
EOF
chmod +x "$KIOSK_SCRIPT"

# Autostart via ~/.xinitrc (startx) und openbox
mkdir -p "$HOME/.config/openbox"
cat > "$HOME/.config/openbox/autostart" <<EOF
$KIOSK_SCRIPT &
EOF

cat > "$HOME/.xinitrc" <<EOF
exec openbox-session
EOF

echo "==> Richte Auto-Login + Autostart ein..."
sudo raspi-config nonint do_boot_behaviour B4 || true

echo
echo "Fertig! Starte den Pi neu:  sudo reboot"
echo "Nach dem Boot startet automatisch der Vollbild-Browser mit der Projektion."
