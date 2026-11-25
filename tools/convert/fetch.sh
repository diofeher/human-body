#!/usr/bin/env bash
# Downloads the Z-Anatomy sources into .cache/ (gitignored).
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p .cache
[ -d .cache/z-anatomy ] || git clone -q --depth 1 https://github.com/Z-Anatomy/Models-of-human-anatomy .cache/z-anatomy
mkdir -p .cache/template
unzip -qo .cache/z-anatomy/Z-Anatomy.zip -d .cache/template
curl -sSfL -o .cache/Translations0.txt https://raw.githubusercontent.com/LluisV/Z-Anatomy/PC-Version/Resources/Translations0.txt
echo "models: $(git -C .cache/z-anatomy rev-parse HEAD)"
echo "translations: $(git ls-remote https://github.com/LluisV/Z-Anatomy refs/heads/PC-Version | cut -f1)"
