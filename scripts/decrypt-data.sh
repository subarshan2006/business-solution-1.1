#!/usr/bin/env bash
# Decrypt src/data/students.js.age -> src/data/students.js (only if missing).
# The plaintext file is gitignored and never committed to the repo.

set -euo pipefail

DATA_DIR="$(cd "$(dirname "$0")/.." && pwd)/src/data"
PLAIN="$DATA_DIR/students.js"
ENC="$DATA_DIR/students.js.age"

# Already decrypted locally -> nothing to do (normal dev workflow).
[ -f "$PLAIN" ] && exit 0

[ -f "$ENC" ] || {
  echo "ERROR: encrypted data not found: $ENC" >&2
  exit 1
}

IDENTITY="${AGE_IDENTITY_FILE:-}"
if [ -z "$IDENTITY" ] && [ -f "$HOME/.config/age/keys.txt" ]; then
  IDENTITY="$HOME/.config/age/keys.txt"
fi
if [ -z "$IDENTITY" ]; then
  echo "ERROR: no age identity found. Set AGE_IDENTITY_FILE or place your key at ~/.config/age/keys.txt" >&2
  exit 1
fi

age -d -i "$IDENTITY" -o "$PLAIN" "$ENC"
echo "Decrypted $ENC -> $PLAIN"
