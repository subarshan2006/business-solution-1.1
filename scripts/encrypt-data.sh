#!/usr/bin/env bash
# Encrypt src/data/students.js -> src/data/students.js.age
# Run this after editing students.js, then commit the .age file.

set -euo pipefail

DATA_DIR="$(cd "$(dirname "$0")/.." && pwd)/src/data"
PLAIN="$DATA_DIR/students.js"
ENC="$DATA_DIR/students.js.age"

[ -f "$PLAIN" ] || {
  echo "ERROR: plain data not found: $PLAIN" >&2
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

PUB=$(age-keygen -y "$IDENTITY")
age -r "$PUB" -o "$ENC" "$PLAIN"
echo "Encrypted $PLAIN -> $ENC"
