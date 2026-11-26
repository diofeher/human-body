#!/usr/bin/env bash
# Exports the exercise animations. Usage: build-exercise.sh [id...]
# Set RENDERS=<dir> to also write check renders to <dir>/<id>/.
set -euo pipefail
cd "$(dirname "$0")/../.."
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
[ $# -gt 0 ] || set -- squat lunge pushup
mkdir -p public/exercises .cache/exercise
for id in "$@"; do
  echo "== $id"
  "$BLENDER" -b --factory-startup --disable-autoexec .cache/template/Z-Anatomy/Startup.blend \
    --python-exit-code 1 --python tools/convert/exercise.py -- "$PWD" "$PWD/.cache/exercise" "$id" ${RENDERS:+"$RENDERS/$id"} \
    > ".cache/exercise-$id.log" 2>&1 || { tail -30 ".cache/exercise-$id.log"; exit 1; }
  grep -E '^(NOTE|REPORT|DONE)' ".cache/exercise-$id.log"
  npx gltf-transform meshopt ".cache/exercise/$id.glb" "public/exercises/$id.glb" >/dev/null
  cp ".cache/exercise/$id.json" "public/exercises/$id.json"
done
ls -l public/exercises
