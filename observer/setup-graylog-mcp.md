# Graylog MCP Server — Setup Guide

Connect Claude Code (or Cursor) to your Graylog instance for log search, error tracking, and system monitoring.

## Prerequisites

- **Python 3.8+**
- **uv** (Python package manager):
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

## Step 1: Clone the repo

```bash
git clone https://github.com/nelsonadpa/MCPNP.git
cd MCPNP
```

The `mcp-graylog` server code is inside this repo.

## Step 2: Get your Graylog API Token

1. Open your Graylog web UI (e.g. `https://graylog.your-org.com`)
2. Log in with your admin or user account
3. Click your **username** in the top-right corner → **Edit profile**
   - Or navigate to: **System → Users and Teams** → click your user → **Edit**
4. Scroll down to the **Tokens** section
5. Enter a token name (e.g. `mcp-claude`) and click **Create Token**
6. **Copy the token immediately** — it won't be shown again

> **Important:** The token acts as the username. The password is always the literal string `token`.

## Step 3: Configure Claude Code

Create or edit `.mcp.json` in your project root (or `~/.claude/.mcp.json` for global config):

```json
{
  "mcpServers": {
    "graylog": {
      "command": "uv",
      "args": [
        "--directory", "/FULL/PATH/TO/mcp-graylog",
        "run", "python", "-c",
        "from mcp_graylog.server import mcp_server; mcp_server.run(transport='stdio')"
      ],
      "env": {
        "GRAYLOG_ENDPOINT": "https://graylog.your-org.com",
        "GRAYLOG_PORT": "443",
        "GRAYLOG_USERNAME": "PASTE_YOUR_API_TOKEN_HERE",
        "GRAYLOG_PASSWORD": "token"
      }
    }
  }
}
```

Replace:
- `/FULL/PATH/TO/mcp-graylog` → the absolute path where you cloned the repo
- `https://graylog.your-org.com` → your Graylog URL
- `PASTE_YOUR_API_TOKEN_HERE` → the token from Step 2

## Step 4: Restart Claude Code

The MCP server starts automatically on next launch. Verify with:

> "Test the Graylog connection"

## Available Tools (11)

| Tool | What it does |
|------|-------------|
| `test_connection` | Verify connectivity to Graylog |
| `get_system_info` | Graylog version, cluster status |
| `search_logs` | Search logs with Elasticsearch query syntax |
| `search_stream_logs` | Search within a specific stream |
| `get_error_logs` | Get errors from last N hours |
| `list_streams` | List all available streams |
| `search_streams_by_name` | Find streams by name |
| `get_stream_info` | Detailed stream info |
| `get_last_event_from_stream` | Most recent event from a stream |

## Example Prompts

Once connected, try these in Claude Code:

```
"Search for error logs from the last hour"
"List all Graylog streams"
"Show me logs where serviceId is abc123 from the last 24 hours"
"Get system info from Graylog"
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `uv: command not found` | Install uv: `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Connection refused | Check `GRAYLOG_ENDPOINT` URL and `GRAYLOG_PORT` |
| 401 Unauthorized | Token expired or wrong — generate a new one in Graylog UI |
| Module not found | Make sure `--directory` points to the correct `mcp-graylog` folder |
