#!/bin/sh

set -eu

REPO="neplextech/yasumu"
INSTALL_DIR="${TANXIUM_INSTALL_DIR:-$HOME/.local/bin}"

case "$(uname -m)" in
  arm64|aarch64)
    ARCH="aarch64"
    ;;
  x86_64|amd64)
    ARCH="x86_64"
    ;;
  *)
    echo "Unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

case "$(uname -s)" in
  Darwin)
    TARGET="${ARCH}-apple-darwin"
    ;;
  Linux)
    TARGET="${ARCH}-unknown-linux-gnu"
    ;;
  *)
    echo "Unsupported operating system: $(uname -s)" >&2
    exit 1
    ;;
esac

echo "Finding the latest Tanxium release..."

TAG="$(
  curl -fsSL \
    -H "User-Agent: tanxium-installer" \
    "https://api.github.com/repos/$REPO/releases?per_page=100" |
    grep '"tag_name":' |
    cut -d '"' -f 4 |
    grep '^tanxium-v' |
    head -n 1
)"

if [ -z "$TAG" ]; then
  echo "Could not find a Tanxium release." >&2
  exit 1
fi

ASSET="tanxium-${TARGET}"
URL="https://github.com/$REPO/releases/download/$TAG/$ASSET"

mkdir -p "$INSTALL_DIR"

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

echo "Installing Tanxium $TAG for $TARGET..."

curl -fL "$URL" -o "$TMP_FILE"
chmod +x "$TMP_FILE"
mv "$TMP_FILE" "$INSTALL_DIR/tanxium"

echo "Installed Tanxium to $INSTALL_DIR/tanxium"

case ":${PATH:-}:" in
  *":$INSTALL_DIR:"*)
    ;;
  *)
    QUOTED_INSTALL_DIR="'$(printf '%s' "$INSTALL_DIR" | sed "s/'/'\\\\''/g")'"
    PATH_LINE="export PATH=${QUOTED_INSTALL_DIR}:\"\$PATH\""

    case "${SHELL:-}" in
      */zsh)
        SHELL_CONFIG="$HOME/.zshrc"
        ;;
      */bash)
        if [ "$(uname -s)" = "Darwin" ]; then
          SHELL_CONFIG="$HOME/.bash_profile"
        else
          SHELL_CONFIG="$HOME/.bashrc"
        fi
        ;;
      */fish)
        SHELL_CONFIG=""
        ;;
      *)
        SHELL_CONFIG="$HOME/.profile"
        ;;
    esac

    if [ -n "$SHELL_CONFIG" ]; then
      if ! grep -Fqs "$PATH_LINE" "$SHELL_CONFIG" 2>/dev/null; then
        printf '\n%s\n' "$PATH_LINE" >> "$SHELL_CONFIG"
      fi

      echo "Added $INSTALL_DIR to PATH in $SHELL_CONFIG"
      echo "Restart your terminal or run:"
      echo "  . \"$SHELL_CONFIG\""
    else
      mkdir -p "$HOME/.config/fish"

      FISH_CONFIG="$HOME/.config/fish/config.fish"
      FISH_LINE="fish_add_path $QUOTED_INSTALL_DIR"

      if ! grep -Fqs "$FISH_LINE" "$FISH_CONFIG" 2>/dev/null; then
        printf '\n%s\n' "$FISH_LINE" >> "$FISH_CONFIG"
      fi

      echo "Added $INSTALL_DIR to PATH in $FISH_CONFIG"
      echo "Restart your terminal."
    fi
    ;;
esac

echo "Run: tanxium --version"
