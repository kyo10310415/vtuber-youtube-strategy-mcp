# VTuber Channel Analyzer MCP

MCP backend for the public **With MCP** version of VTuber Channel Analyzer.

## Public pages

- Website: `/`
- Support: `/support`
- Privacy Policy: `/privacy`
- Terms of Service: `/terms`
- Health: `/health`
- MCP endpoint: `/mcp`

## Tools

- `analyze_metrics`: deterministic aggregation of normalized video platform per-video metrics
- `score_game_candidates`: deterministic comparison of candidate games

The server is stateless and does not require a database or authentication in v1.

## Local setup

```bash
npm ci
npm run dev
```

Health check:

```text
http://localhost:8787/health
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
4. Build Command: `npm ci && npm run build`
5. Start Command: `npm start`
6. Health Check Path: `/health`
7. Use Node.js 22 or newer
8. Deploy

Production MCP endpoint:

```text
https://vtuber-youtube-strategy-mcp.onrender.com/mcp
```

## Privacy

Do not send raw CSV files, credentials, or secrets to the MCP tools. The intended flow is to parse CSV data in ChatGPT, normalize the relevant metrics, and send only the required numeric fields to the MCP server.

## 依存の固定（SEC-046）
package-lock.jsonで宣言範囲内の依存解決とintegrityを固定しました。依存導入はnpm ci、監査用の隔離導入はnpm ci --ignore-scriptsを使用してください。manifestの範囲や新しい依存は変更していません。更新時はlock差分とビルドを確認します。
Node22.23.4でTypeScript build、およびローカルHTTPのhealth/initialize/tools/list（2ツール）の成功を確認。ツール本体を呼ぶ分析や本番データ処理は試験していません。
