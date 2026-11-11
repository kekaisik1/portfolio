#!/usr/bin/env bash
# Make a project video small enough for the page: H.264 + AAC, 720p, at most 2 MB, playable in every browser.
# (Phone and screen recorders often write HEVC, which Firefox and many Chrome installs cannot play.)
#
#   npm run video -- <source file> <project slug>      writes public/videos/<slug>.mp4
set -euo pipefail

MAX_BYTES=$((2 * 1024 * 1024))
AUDIO_KBPS=48

if [[ $# -ne 2 ]]; then
  echo "usage: npm run video -- <source file> <project slug>" >&2
  exit 2
fi
src=$1
slug=$2
if [[ ! -f $src ]]; then
  echo "No such file: $src" >&2
  exit 2
fi
if [[ ! $slug =~ ^[a-z0-9-]{1,40}$ ]]; then
  echo "A slug is lower-case letters, digits and dashes (see src/content/projects.ts): $slug" >&2
  exit 2
fi
for tool in ffmpeg ffprobe; do
  command -v "$tool" >/dev/null || { echo "$tool is not installed (sudo apt install ffmpeg)" >&2; exit 2; }
done

out="$(cd "$(dirname "$0")/.." && pwd)/public/videos/$slug.mp4"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
tmp="$work/out.mp4"

common=(-vf "scale=-2:'min(720,ih)'" -c:v libx264 -preset veryslow -pix_fmt yuv420p -profile:v high)
audio=(-c:a aac -b:a "${AUDIO_KBPS}k" -ac 2)

# First by quality: if that already fits, spending more bits would buy nothing visible.
ffmpeg -v error -y -i "$src" "${common[@]}" -crf 26 "${audio[@]}" -movflags +faststart "$tmp"

if (($(stat -c %s "$tmp") > MAX_BYTES)); then
  # Too big: two passes at the bitrate that fills 2 MB (3% kept back for the container).
  duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  video_kbps=$(awk -v d="$duration" -v max="$MAX_BYTES" -v a="$AUDIO_KBPS" 'BEGIN { printf "%d", max * 8 * 0.97 / d / 1000 - a }')
  if ((video_kbps < 100)); then
    echo "At $duration s this would get ${video_kbps} kbit/s of picture, which looks bad. Cut the video shorter." >&2
    exit 1
  fi
  ffmpeg -v error -y -i "$src" "${common[@]}" -b:v "${video_kbps}k" -pass 1 -passlogfile "$work/pass" -an -f null /dev/null
  ffmpeg -v error -y -i "$src" "${common[@]}" -b:v "${video_kbps}k" -pass 2 -passlogfile "$work/pass" "${audio[@]}" -movflags +faststart "$tmp"
fi

size=$(stat -c %s "$tmp")
if ((size > MAX_BYTES)); then
  echo "Still $size bytes after compression (limit $MAX_BYTES). Cut the video shorter." >&2
  exit 1
fi
mv "$tmp" "$out"
echo "$out: $((size / 1024)) KB"
