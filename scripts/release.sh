#!/bin/bash
set -e

TAURI_CONF="src-tauri/tauri.conf.json"
CARGO_TOML="src-tauri/Cargo.toml"
PKG_JSON="package.json"

CURRENT=$(grep '"version"' "$TAURI_CONF" | head -1 | sed 's/.*"\([0-9]*\.[0-9]*\.[0-9]*\)".*/\1/')

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

case "${1:-patch}" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
  *) echo "Usage: bun release [major|minor|patch]"; exit 1 ;;
esac

NEW="$MAJOR.$MINOR.$PATCH"

sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW\"/" "$TAURI_CONF"
sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW\"/" "$PKG_JSON"
sed -i '' "s/^version = \"$CURRENT\"/version = \"$NEW\"/" "$CARGO_TOML"

echo "Bumped $CURRENT → $NEW"

git add "$TAURI_CONF" "$CARGO_TOML" "$PKG_JSON"
git commit -m "release v$NEW"
git tag "v$NEW"
git push && git push --tags

echo "Released v$NEW"
