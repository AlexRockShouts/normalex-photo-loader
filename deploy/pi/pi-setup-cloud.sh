#!/usr/bin/env bash
#
# Cloud-Modus: Raspberry Pi zeigt NUR die Projektion (Kiosk-Browser) von der Cloud.
# Es wird KEIN Server auf dem Pi installiert - der laeuft in der Cloud (z.B. Railway).
#
# Verwendung:
#   bash pi-setup-cloud.sh https://<name>.up.railway.app/projector
#
set -euo pipefail

KIOSK_URL="${1:-}"
if [ -z "$KIOSK_URL" ]; then
  echo "Bitte die Projektor-URL angeben, z.B.:"
  echo "  bash pi-setup-cloud.sh https://<name>.up.railway.app/projector"
  exit 1
fi

KIOSK_SCRIPT="$HOME/kiosk.sh"

echo "==> Pi-Setup (Cloud-Modus) fuer: $KIOSK_URL"

# ---------- Grafische Basis + Chromium ----------
if ! command -v chromium-browser >/dev/null 2>&1 && ! command -v chromium >/dev/null 2>&1; then
  echo "==> Installiere X, Openbox und Chromium..."
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends xserver-xorg xinit openbox chromium-browser
fi
echo "Chromium vorhanden"

# ---------- Kiosk-Autostart ----------
cat > "$KIOSK_SCRIPT" <<EOF
#!/usr/bin/env bash
sleep 3
CHROME=\$(command -v chromium-browser || command -v chromium)
exec \$CHROME --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 "$KIOSK_URL"
EOF
chmod +x "$KIOSK_SCRIPT"

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
echo "Der Pi zeigt dann die Cloud-Projektion von $KIOSK_URL"
