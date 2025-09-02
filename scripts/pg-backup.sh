#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose"
SERVICE="db"
DB_NAME="${1:-rd_service_tracker}"
DB_USER="${2:-app}"
OUT_DIR="${3:-./backups}"

mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="${OUT_DIR}/backup_${DB_NAME}_${STAMP}.sql"

echo "Creating backup: ${OUT_FILE}"
$COMPOSE exec -T "$SERVICE" pg_dump -U "$DB_USER" "$DB_NAME" > "$OUT_FILE"
echo "Done."