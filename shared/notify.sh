#!/bin/bash
# Agent Notification System for eRegistrations Agent Hub
#
# Usage:
#   notify.sh check <agent-name>     — Check for unread responses/requests
#   notify.sh signal <agent-name>    — Create a signal file after writing a response
#   notify.sh wait <agent-name> <request-id> [timeout] — Poll until response is ready
#   notify.sh clean <agent-name>     — Clean processed signal files
#
# Signal files: shared/.signals/<agent>_<timestamp>.signal
# Format: TYPE|FROM|FILE|TIMESTAMP

SHARED_DIR="$(cd "$(dirname "$0")" && pwd)"
SIGNALS_DIR="$SHARED_DIR/.signals"
mkdir -p "$SIGNALS_DIR"

case "$1" in
  check)
    AGENT="$2"
    if [ -z "$AGENT" ]; then
      echo "Usage: notify.sh check <agent-name>"
      exit 1
    fi

    FOUND=0

    # Check for unread signal files addressed to this agent
    for sig in "$SIGNALS_DIR"/${AGENT}_*.signal; do
      [ -f "$sig" ] || continue
      FOUND=1
      cat "$sig"
    done

    # Check for unmatched responses (responses without a .read marker)
    for resp in "$SHARED_DIR"/responses/*"${AGENT}"*.md; do
      [ -f "$resp" ] || continue
      BASENAME=$(basename "$resp")
      if [ ! -f "$SIGNALS_DIR/.read_${BASENAME}" ]; then
        FOUND=1
        MTIME=$(stat -f %m "$resp" 2>/dev/null || stat -c %Y "$resp" 2>/dev/null || echo "unknown")
        echo "RESPONSE|unknown|$BASENAME|$MTIME"
      fi
    done

    # Check for unmatched requests addressed to this agent
    for req in "$SHARED_DIR"/requests/*"${AGENT}"*.md; do
      [ -f "$req" ] || continue
      BASENAME=$(basename "$req")
      if [ ! -f "$SIGNALS_DIR/.read_${BASENAME}" ]; then
        FOUND=1
        MTIME=$(stat -f %m "$req" 2>/dev/null || stat -c %Y "$req" 2>/dev/null || echo "unknown")
        echo "REQUEST|unknown|$BASENAME|$MTIME"
      fi
    done

    if [ "$FOUND" -eq 0 ]; then
      echo "NO_MESSAGES"
    fi
    ;;

  signal)
    AGENT="$2"
    FROM="$3"
    FILE="$4"
    TYPE="${5:-RESPONSE}"

    if [ -z "$AGENT" ] || [ -z "$FILE" ]; then
      echo "Usage: notify.sh signal <target-agent> <from-agent> <filename> [REQUEST|RESPONSE]"
      exit 1
    fi

    TIMESTAMP=$(date +%s)
    echo "${TYPE}|${FROM}|${FILE}|${TIMESTAMP}" > "$SIGNALS_DIR/${AGENT}_${TIMESTAMP}.signal"
    echo "Signal sent to $AGENT: $TYPE from $FROM ($FILE)"
    ;;

  wait)
    AGENT="$2"
    REQUEST_ID="$3"
    TIMEOUT="${4:-300}"  # default 5 minutes

    if [ -z "$AGENT" ] || [ -z "$REQUEST_ID" ]; then
      echo "Usage: notify.sh wait <agent-name> <request-id> [timeout-seconds]"
      exit 1
    fi

    ELAPSED=0
    INTERVAL=5
    echo "Waiting for response to $REQUEST_ID (timeout: ${TIMEOUT}s)..."

    while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
      # Check if response file exists matching the request ID pattern
      for resp in "$SHARED_DIR"/responses/*"${REQUEST_ID}"*.md; do
        if [ -f "$resp" ]; then
          echo "READY|$(basename "$resp")|${ELAPSED}s"
          exit 0
        fi
      done
      sleep "$INTERVAL"
      ELAPSED=$((ELAPSED + INTERVAL))
    done

    echo "TIMEOUT|${REQUEST_ID}|${TIMEOUT}s"
    exit 1
    ;;

  clean)
    AGENT="$2"
    if [ -z "$AGENT" ]; then
      echo "Usage: notify.sh clean <agent-name>"
      exit 1
    fi

    # Mark all current signals as read and remove signal files
    for sig in "$SIGNALS_DIR"/${AGENT}_*.signal; do
      [ -f "$sig" ] || continue
      FILE=$(awk -F'|' '{print $3}' "$sig")
      touch "$SIGNALS_DIR/.read_${FILE}"
      rm "$sig"
    done
    echo "Cleaned signals for $AGENT"
    ;;

  *)
    echo "Agent Notification System"
    echo ""
    echo "Usage:"
    echo "  notify.sh check <agent>              — Check for unread messages"
    echo "  notify.sh signal <to> <from> <file>   — Notify agent of new file"
    echo "  notify.sh wait <agent> <req-id> [sec]  — Poll until response ready"
    echo "  notify.sh clean <agent>               — Mark messages as read"
    ;;
esac
