#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <dump.sql> [db_name] [db_user]"
  exit 1
fi

COMPOSE="docker compose"
SERVICE="db"
DUMP_FILE="$1"
DB_NAME="${2:-rd_service_tracker}"
DB_USER="${3:-app}"

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "Dump file not found: $DUMP_FILE"
  exit 1
fi

echo "Restoring ${DUMP_FILE} into database ${DB_NAME}..."
$COMPOSE exec -T "$SERVICE" psql -U "$DB_USER" -d "$DB_NAME" < "$DUMP_FILE"
echo "Done."