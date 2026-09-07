#!/usr/bin/env bash
# ==============================================================================
# SETU Application Startup Script (Hot-Reload Enabled)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
PID_FILE="${SCRIPT_DIR}/.setu.pids"
BACKEND_LOG="${SCRIPT_DIR}/backend.log"
FRONTEND_LOG="${SCRIPT_DIR}/frontend.log"

# ANSI Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}====================================================${NC}"
echo -e "${BOLD}${CYAN}   SETU — AI-Powered MPLADS Intelligence Platform   ${NC}"
echo -e "${BOLD}${BLUE}====================================================${NC}"

# Check if already running
if [ -f "$PID_FILE" ]; then
    echo -e "${YELLOW}[!] Existing PID file found. Checking running processes...${NC}"
    "${SCRIPT_DIR}/stop.sh" > /dev/null 2>&1 || true
    sleep 1
fi

# Ensure ports 8001 and 3000 are free
for PORT in 8001 3000; do
    fuser -k ${PORT}/tcp 2>/dev/null || true
    PID=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}[!] Port $PORT is in use by PID $PID. Freeing port...${NC}"
        kill -9 $PID 2>/dev/null || true
    fi
done

# ------------------------------------------------------------------------------
# 1. Start Backend with Hot Reloading
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[1/2] Starting FastAPI Backend (Port 8001)...${NC}"

UVICORN_BIN="${BACKEND_DIR}/venv/bin/uvicorn"
if [ ! -f "$UVICORN_BIN" ]; then
    if command -v uvicorn > /dev/null 2>&1; then
        UVICORN_BIN="uvicorn"
    else
        echo -e "${RED}[ERROR] Uvicorn not found in backend/venv or PATH.${NC}"
        exit 1
    fi
fi

# Run uvicorn from backend directory with hot-reload watching the app folder
(
    cd "${BACKEND_DIR}"
    setsid nohup "$UVICORN_BIN" app.main:app \
        --host 127.0.0.1 \
        --port 8001 \
        --reload \
        --reload-dir app \
        > "${BACKEND_LOG}" 2>&1 &
    echo $! > "${SCRIPT_DIR}/.backend.pid"
)
BACKEND_PID=$(cat "${SCRIPT_DIR}/.backend.pid")
rm -f "${SCRIPT_DIR}/.backend.pid"

echo -e "  -> Backend process spawned (PID: ${BACKEND_PID})"
echo -e "  -> Hot Reload: ${GREEN}Active${NC} (watching ${BACKEND_DIR}/app)"

# ------------------------------------------------------------------------------
# 2. Start Frontend with Hot Reloading
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[2/2] Starting Next.js Frontend (Port 3000)...${NC}"

(
    cd "${FRONTEND_DIR}"
    setsid nohup npm run dev -- -p 3000 > "${FRONTEND_LOG}" 2>&1 &
    echo $! > "${SCRIPT_DIR}/.frontend.pid"
)
FRONTEND_PID=$(cat "${SCRIPT_DIR}/.frontend.pid")
rm -f "${SCRIPT_DIR}/.frontend.pid"

echo -e "  -> Frontend process spawned (PID: ${FRONTEND_PID})"
echo -e "  -> Hot Reload: ${GREEN}Active${NC} (Fast Refresh watching ${FRONTEND_DIR})"

# Save PIDs
echo "BACKEND_PID=${BACKEND_PID}" > "$PID_FILE"
echo "FRONTEND_PID=${FRONTEND_PID}" >> "$PID_FILE"

# ------------------------------------------------------------------------------
# 3. Wait for Health Checks
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}Waiting for services to become ready...${NC}"

# Wait for backend
BACKEND_READY=0
for i in {1..30}; do
    if curl -s http://127.0.0.1:8001/health | grep -q "healthy"; then
        BACKEND_READY=1
        break
    fi
    sleep 1
done

if [ $BACKEND_READY -eq 1 ]; then
    echo -e "  -> Backend:  ${GREEN}ONLINE${NC} (http://127.0.0.1:8001)"
else
    echo -e "  -> Backend:  ${RED}FAILED TO RESPOND${NC} (Check ${BACKEND_LOG})"
fi

# Wait for frontend
FRONTEND_READY=0
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -qE "200|304"; then
        FRONTEND_READY=1
        break
    fi
    sleep 1
done

if [ $FRONTEND_READY -eq 1 ]; then
    echo -e "  -> Frontend: ${GREEN}ONLINE${NC} (http://localhost:3000)"
else
    echo -e "  -> Frontend: ${YELLOW}INITIALIZING...${NC} (Compiling routes, check ${FRONTEND_LOG})"
fi

# ------------------------------------------------------------------------------
# Summary & Controls
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}${GREEN}====================================================${NC}"
echo -e "${BOLD}${GREEN}   SETU Application is Running Successfully!        ${NC}"
echo -e "${BOLD}${GREEN}====================================================${NC}"
echo -e "  ${BOLD}Frontend App:${NC}      ${CYAN}http://localhost:3000${NC}"
echo -e "  ${BOLD}Backend API:${NC}       ${CYAN}http://127.0.0.1:8001/api${NC}"
echo -e "  ${BOLD}API Docs (Swagger):${NC} ${CYAN}http://127.0.0.1:8001/docs${NC}"
echo -e "  ${BOLD}Auto-Reload:${NC}       ${GREEN}Enabled${NC} on both Backend & Frontend"
echo -e ""
echo -e "  ${BOLD}To view logs:${NC}"
echo -e "    Backend:  tail -f ${BACKEND_LOG}"
echo -e "    Frontend: tail -f ${FRONTEND_LOG}"
echo -e ""
echo -e "  ${BOLD}To stop all services:${NC}"
echo -e "    ${YELLOW}./stop.sh${NC}"
echo -e "${BOLD}${GREEN}====================================================${NC}\n"

# If --foreground or -f flag is passed, attach to logs and trap Ctrl+C
if [[ "$1" == "--foreground" || "$1" == "-f" ]]; then
    trap '"${SCRIPT_DIR}/stop.sh"; exit 0' SIGINT SIGTERM
    echo -e "${CYAN}Streaming logs (Press Ctrl+C to stop all services)...${NC}\n"
    tail -f "${BACKEND_LOG}" "${FRONTEND_LOG}"
fi
