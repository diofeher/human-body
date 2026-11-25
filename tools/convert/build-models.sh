#!/usr/bin/env bash
# Exports and compresses one GLB per layer. Usage: build-models.sh [decimate-ratio]
set -euo pipefail
cd "$(dirname "$0")/../.."
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
rm -rf .cache/glb && mkdir -p public/models
"$BLENDER" -b --factory-startup --disable-autoexec .cache/template/Z-Anatomy/Startup.blend \
  --python-exit-code 1 --python tools/convert/export.py -- "$PWD/.cache/export-list.json" "$PWD/.cache/glb" "${1:-0.5}" \
  > .cache/export.log 2>&1 || { tail -30 .cache/export.log; exit 1; }
grep '^exported' .cache/export.log
for f in .cache/glb/*.glb; do npx gltf-transform meshopt "$f" "public/models/$(basename "$f")" >/dev/null; done
ls -l public/models
