# VTuber YouTube Strategy Analyzer MCP

MCP backend for the public **With MCP** version of VTuber YouTube Strategy Analyzer.

## Tools

- `analyze_metrics`: deterministic aggregation of normalized YouTube per-video metrics
- `score_game_candidates`: deterministic comparison of candidate games

The server is stateless and does not require a database or authentication in v1.

## Local setup

```bash
npm install
npm run dev
```

Health check:

```text
http://localhost:8787/
```

MCP endpoint:

```text
http://localhost:8787/mcp
```

## Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector@latest
```

Choose **Streamable HTTP** and connect to:

```text
http://localhost:8787/mcp
```

## Deploy to Render

1. Render → **New** → **Web Service**
2. Connect this GitHub repository
3. Runtime: **Node**
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Health Check Path: `/`
7. Use Node.js 22 or newer
8. Deploy

After deployment, the MCP URL will be:

```text
https://YOUR-SERVICE.onrender.com/mcp
```

Use that URL in the plugin package's `mcp.json` and `skills/youtube-strategy/agents/openai.yaml`.

## Privacy

Do not send raw CSV files, credentials, or secrets to the MCP tools. The intended flow is to parse CSV data in ChatGPT, normalize the relevant metrics, and send only the required numeric fields to the MCP server.
