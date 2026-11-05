#!/bin/sh
# Uploads dist/web-reader to R2 bucket howtolivebetter-public (custom domain sach.thantamtue.vn).
# Needs wrangler logged in; set CLOUDFLARE_ACCOUNT_ID when the token sees several accounts.
# Run from the repo root after: npm --prefix tools/vi/web-reader ci && npm --prefix tools/vi/web-reader run build
set -eu
B=howtolivebetter-public
D=dist/web-reader
put() { # key file content-type cache-control
  npx --yes wrangler@4 r2 object put "$B/$1" --file "$2" --content-type "$3" --cache-control "$4" --remote
}
HTML="text/html; charset=utf-8"
PAGE_CACHE="public, max-age=300"
ASSET_CACHE="public, max-age=31536000, immutable"   # URLs carry ?v=<hash>
for key in how-to-live-better how-to-live-better/ how-to-live-better/index.html; do
  put "$key" "$D/how-to-live-better.html" "$HTML" "$PAGE_CACHE"
done
A=how-to-live-better/assets
put "$A/reader.css"   "$D/$A/reader.css"   "text/css; charset=utf-8"        "$ASSET_CACHE"
put "$A/reader.js"    "$D/$A/reader.js"    "text/javascript; charset=utf-8" "$ASSET_CACHE"
put "$A/epub.min.js"  "$D/$A/epub.min.js"  "text/javascript; charset=utf-8" "$ASSET_CACHE"
put "$A/jszip.min.js" "$D/$A/jszip.min.js" "text/javascript; charset=utf-8" "$ASSET_CACHE"
put "$A/icon.png"     "$D/$A/icon.png"     "image/png"                      "public, max-age=86400"
put "$A/og.jpg"       "$D/$A/og.jpg"       "image/jpeg"                     "public, max-age=86400"
echo "done: https://sach.thantamtue.vn/how-to-live-better"
