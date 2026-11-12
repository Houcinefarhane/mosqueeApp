#!/usr/bin/env bash
# Crée le keystore de signature Play Store (une seule fois par app).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID="$ROOT/android"
KEYSTORE_DIR="$ANDROID/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/release.keystore"
PROPS="$ANDROID/keystore.properties"
ALIAS="madrasapp"

if [[ -f "$KEYSTORE_FILE" ]]; then
  echo "Le keystore existe déjà : $KEYSTORE_FILE"
  exit 1
fi

mkdir -p "$KEYSTORE_DIR"
PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)"
PASS="${PASS}Aa1!"

keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_FILE" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$PASS" \
  -keypass "$PASS" \
  -dname "CN=MadrasApp, OU=Mobile, O=MadrasApp, L=Plaisir, ST=IDF, C=FR"

cat > "$PROPS" <<EOF
storeFile=../keystore/release.keystore
storePassword=$PASS
keyAlias=$ALIAS
keyPassword=$PASS
EOF
chmod 600 "$PROPS"

echo ""
echo "✅ Keystore créé : $KEYSTORE_FILE"
echo "✅ keystore.properties écrit (gitignoré)"
echo ""
echo "⚠️  SAUVEGARDEZ le fichier .keystore et les mots de passe hors du dépôt"
echo "    (coffre-fort, 1Password, disque chiffré). Sans eux, impossible de"
echo "    publier des mises à jour sur le même listing Play Store."
echo ""
echo "Mot de passe (copiez maintenant, non réaffiché) :"
echo "$PASS"
