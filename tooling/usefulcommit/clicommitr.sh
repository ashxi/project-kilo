#!/bin/bash 
MAGIC=$(./tooling/usefulcommit/commitr.sh --commit="$1" --type="$2" --lint)
echo "Commiting '$MAGIC'... Press Ctrl+C to cancel."
sleep 1s
echo "Continuing."
git add .
git commit -m '$MAGIC'
git push
git pull