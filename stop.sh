#!/usr/bin/env bash
# ==============================================================================
# SETU Application Shutdown Script
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${SCRIPT_DIR}/.setu.pids"

# ANSI Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}====================================================${NC}"
echo -e "${BOLD}${YELLOW}   Shutting Down SETU Application Services...       ${NC}"
echo -e "${BOLD}${BLUE}====================================================${NC}"

STOPPED_COUNT=0

# 1. Kill recorded PIDs from PID_FILE if available
if [ -f "$PID_FILE" ]; then
    # shellcheck disable=SC1090
    source "$PID_FILE"

    if [ -n "$BACKEND_PID" ]; then
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo -e "  -> Stopping Backend (PID: ${BACKEND_PID})..."
            pkill -P "$BACKEND_PID" 2>/dev/null || true
            kill -TERM "$BACKEND_PID" 2>/dev/null || true
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        fi
    fi

    if [ -n "$FRONTEND_PID" ]; then
        if kill -0 "$FRONTEND_PID" 2>/dev/null; then
            echo -e "  -> Stopping Frontend (PID: ${FRONTEND_PID})..."
            pkill -P "$FRONTEND_PID" 2>/dev/null || true
            kill -TERM "$FRONTEND_PID" 2>/dev/null || true
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        fi
    fi

    rm -f "$PID_FILE"
fi

# Give processes a moment to exit gracefully
sleep 1

# 2. Force-kill any lingering processes on ports 8001 & 3000
for PORT in 8001 3000; do
    PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo -e "  -> Cleaning up lingering process on port ${PORT} (PID: ${PIDS})..."
        for P in $PIDS; do
            kill -9 "$P" 2>/dev/null || true
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        done
    fi
done

# 3. Clean up any leftover next dev / uvicorn instances launched in workspace
pkill -f "uvicorn app.main:app" 2>/dev/null || true

echo -e "\n${BOLD}${GREEN}====================================================${NC}"
echo -e "${BOLD}${GREEN}   All SETU Services Have Been Successfully Stopped!${NC}"
echo -e "${BOLD}${GREEN}====================================================${NC}"
echo -e "  Ports 8001 (FastAPI) and 3000 (Next.js) are now free."
echo -e "  To restart: ${BLUE}./start.sh${NC}\n"
