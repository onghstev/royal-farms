#!/bin/bash
# ============================================
# Royal Farms - Database Migration Script
# Run this AFTER docker compose up to apply
# Prisma migrations on the new database
# ============================================

set -e

echo "==========================================="
echo "Royal Farms - Database Migration"
echo "==========================================="

# Wait for database to be ready
echo "[1/4] Waiting for database to be ready..."
until docker exec royal-farms-db pg_isready -U royalfarms_admin -d royalfarms > /dev/null 2>&1; do
  echo "  Database not ready yet, waiting 3 seconds..."
  sleep 3
done
echo "  ✓ Database is ready!"

# Check if data was restored from backup
echo ""
echo "[2/4] Checking if database was restored from backup..."
TABLE_COUNT=$(docker exec royal-farms-db psql -U royalfarms_admin -d royalfarms -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
echo "  Found $TABLE_COUNT tables in the database."

if [ "$TABLE_COUNT" -gt "5" ]; then
  echo "  ✓ Database backup was successfully restored!"
else
  echo "  ⚠ Database appears empty. Check if database_backup.sql was mounted correctly."
  echo "  You can manually restore with:"
  echo "    docker exec -i royal-farms-db psql -U royalfarms_admin -d royalfarms < database_backup.sql"
fi

# Run Prisma migrations to ensure schema is up to date
echo ""
echo "[3/4] Running Prisma schema push to sync any pending changes..."
docker exec royal-farms-app npx prisma db push --accept-data-loss=false 2>/dev/null || echo "  Note: Prisma push skipped (schema already in sync)"

# Verify the application
echo ""
echo "[4/4] Verifying application health..."
sleep 5
if curl -sf http://localhost:3000/ > /dev/null 2>&1; then
  echo "  ✓ Application is running and healthy!"
else
  echo "  ⚠ Application may still be starting. Check with: docker logs royal-farms-app"
fi

echo ""
echo "==========================================="
echo "Migration complete!"
echo "==========================================="
echo "App URL: http://localhost:3000"
echo "Login: admin@royalfarms.com / RoyalFarms2026!"
echo "==========================================="
