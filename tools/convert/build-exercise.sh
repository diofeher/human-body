#!/usr/bin/env bash
# Exports the squat animation. Usage: build-exercise.sh [renders-dir]
set -euo pipefail
cd "$(dirname "$0")/../.."
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
rm -rf .cache/exercise && mkdir -p public/exercises .cache/exercise
"$BLENDER" -b --factory-startup --disable-autoexec .cache/template/Z-Anatomy/Startup.blend \
  --python-exit-code 1 --python tools/convert/exercise.py -- "$PWD" "$PWD/.cache/exercise" ${1:+"$1"} \
  > .cache/exercise.log 2>&1 || { tail -30 .cache/exercise.log; exit 1; }
grep -E '^(NOTE|REPORT|DONE)' .cache/exercise.log
npx gltf-transform meshopt .cache/exercise/squat.glb public/exercises/squat.glb >/dev/null
cp .cache/exercise/squat.json public/exercises/squat.json
ls -l public/exercises
