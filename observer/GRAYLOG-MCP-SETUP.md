# Graylog MCP Server — Setup Guide

Connect Claude Code to Graylog for log search, monitoring, and incident response.

## Prerequisites

- [Claude Code](https://claude.ai/claude-code) installed
- [uv](https://docs.astral.sh/uv/) — Python package manager (`brew install uv`)

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/AI-enthusiasts/mcp-graylog.git ~/Desktop/mcp-graylog
```

### 2. Configure the MCP server

Add this to your project's `.mcp.json` (or `~/.claude/.mcp.json` for global access):

```json
{
  "mcpServers": {
    "graylog": {
      "command": "uv",
      "args": ["--directory", "/Users/YOUR_USER/Desktop/mcp-graylog", "run", "python", "-c", "from mcp_graylog.server import mcp_server; mcp_server.run(transport='stdio')"],
      "env": {
        "GRAYLOG_ENDPOINT": "https://graylog.cuba.eregistrations.org",
        "GRAYLOG_PORT": "443",
        "GRAYLOG_USERNAME": "10c47o7amfncfshogep00aitgu0o593tc7tprciicdgb94jomfn4",
        "GRAYLOG_PASSWORD": "token"
      }
    }
  }
}
```

> **Important**: Replace `/Users/YOUR_USER/Desktop/mcp-graylog` with the actual path where you cloned the repo.

### 3. Verify

Restart Claude Code and ask: "test the graylog connection"

You should see: `connected: true`

## Configuration Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GRAYLOG_ENDPOINT` | Graylog server URL | `https://graylog.cuba.eregistrations.org` |
| `GRAYLOG_PORT` | Server port | `443` |
| `GRAYLOG_USERNAME` | API token (token-as-username auth) | `10c47o7amfncfshogep00aitgu0o593tc7tprciicdgb94jomfn4` |
| `GRAYLOG_PASSWORD` | Always the literal string `token` | `token` |

## Authentication

Graylog uses **token-as-username** authentication:
- `GRAYLOG_USERNAME` is your API token, not your login username
- `GRAYLOG_PASSWORD` is always the literal word `token`

### Getting your own API token

1. Log into Graylog web UI
2. Go to **System → Users and Teams**
3. Edit your user
4. Scroll to **Tokens** section
5. Create a new token, copy it
6. Use it as `GRAYLOG_USERNAME`

> For Cuba, everyone can use the shared token shown above.

## Available Tools (11)

| Tool | Purpose |
|------|---------|
| `test_connection` | Verify connectivity |
| `search_logs` | Search logs with Elasticsearch syntax |
| `search_stream_logs` | Search within a specific stream |
| `list_streams` | List all streams |
| `get_stream_info` | Get stream details |
| `search_streams_by_name` | Find streams by name |
| `get_last_event_from_stream` | Latest event from a stream |
| `get_system_info` | Graylog system health |
| `get_error_logs` | Quick error log retrieval |

## Example Queries

Once connected, ask Claude:

```
search graylog for errors in the last 24h
```

```
search logs where serviceName:"Permisos Eventuales" in the last 7 days
```

```
show me bot executions for serviceId:2c918084887c7a8f01887c99ed2a6fd5
```

```
find all level:ERROR logs from the last hour
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Prompt is too long" | Too many MCP servers loaded. Disable unused ones in `.mcp.json` |
| Connection refused | Check VPN / network access to `graylog.cuba.eregistrations.org` |
| 401 Unauthorized | Token expired or invalid. Generate a new one in Graylog UI |
| `uv` not found | Install with `brew install uv` |
