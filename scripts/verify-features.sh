#!/usr/bin/env bash
# Quick verification that the new value/billing APIs and health work.
# Run with: ./scripts/verify-features.sh
# Backend must be running on port 8000.

set -e
BASE="${1:-http://localhost:8000}"

echo "=== Health (config) ==="
curl -s "$BASE/api/health" | head -1
echo ""

echo "=== Value summary (GET /api/value/summary) ==="
curl -s "$BASE/api/value/summary" | head -1
echo ""

echo "=== Recent events (GET /api/value/events?limit=3) ==="
curl -s "$BASE/api/value/events?limit=3" | head -1
echo ""

echo "Done. If you see JSON above, the new features are reachable."
echo "To see non-zero values: complete onboarding in the app, do one conversation turn, end convo, then run this again."
