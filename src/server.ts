import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { analyzeMetrics } from "./lib/metrics.js";
import { scoreGames } from "./lib/scoring.js";

const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";
const PUBLIC_DIR = join(process.cwd(), "public");

function createStrategyServer() {
  const server = new McpServer(
    {
      name: "vtuber-youtube-strategy",
      version: "1.0.0"
    },
    {
      instructions:
        "Use these read-only tools for deterministic calculations only. Do not send raw CSV files or secrets."
    }
  );

  server.registerTool(
    "analyze_metrics",
    {
      title: "Analyze YouTube metrics",
      description:
        "Calculate deterministic aggregate YouTube metrics from normalized per-video rows after CSV parsing.",
      inputSchema: {
        videos: z.array(
          z.object({
            title: z.string().optional(),
            views: z.number().nullable().optional(),
            impressions: z.number().nullable().optional(),
            ctr: z.number().min(0).max(1).nullable().optional(),
            watchHours: z.number().nullable().optional(),
            subscribers: z.number().nullable().optional()
          })
        ).min(1).max(5000)
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false
      }
    },
    async ({ videos }) => {
      const result = analyzeMetrics(videos);
      return {
        structuredContent: result,
        content: [{ type: "text", text: `Analyzed ${result.sampleSize} rows.` }]
      };
    }
  );

  server.registerTool(
    "score_game_candidates",
    {
      title: "Score game candidates",
      description:
        "Compare game candidates with a fixed scoring rule after evidence has been gathered. Do not use this tool to invent market data.",
      inputSchema: {
        channelProfile: z.object({
          competitiveAffinity: z.number().min(0).max(1).optional(),
          storyAffinity: z.number().min(0).max(1).optional(),
          noveltyAffinity: z.number().min(0).max(1).optional(),
          longStreamAffinity: z.number().min(0).max(1).optional()
        }),
        games: z.array(
          z.object({
            title: z.string().min(1),
            channelFit: z.number().min(0).max(1),
            marketDemand: z.number().min(0).max(1),
            continuity: z.number().min(0).max(1),
            competitionLevel: z.number().min(0).max(1),
            rankedMode: z.boolean().optional(),
            notes: z.string().optional()
          })
        ).min(1).max(100)
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false
      }
    },
    async ({ channelProfile, games }) => {
      const ranked = scoreGames(channelProfile, games);
      return {
        structuredContent: { ranked },
        content: [{ type: "text", text: `Scored ${ranked.length} candidate games.` }]
      };
    }
  );

  return server;
}

async function serveStatic(res: import("node:http").ServerResponse, file: string, contentType: string) {
  try {
    const body = await readFile(join(PUBLIC_DIR, file));
    res.writeHead(200, { "content-type": contentType });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not Found");
  }
}

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" }).end(
      JSON.stringify({
        name: "VTuber YouTube Strategy Analyzer MCP",
        version: "1.0.0",
        status: "ok"
      })
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    await serveStatic(res, "index.html", "text/html; charset=utf-8");
    return;
  }
  if (req.method === "GET" && url.pathname === "/support") {
    await serveStatic(res, "support.html", "text/html; charset=utf-8");
    return;
  }
  if (req.method === "GET" && url.pathname === "/privacy") {
    await serveStatic(res, "privacy.html", "text/html; charset=utf-8");
    return;
  }
  if (req.method === "GET" && url.pathname === "/terms") {
    await serveStatic(res, "terms.html", "text/html; charset=utf-8");
    return;
  }
  if (req.method === "GET" && url.pathname === "/style.css") {
    await serveStatic(res, "style.css", "text/css; charset=utf-8");
    return;
  }

  const allowed = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && allowed.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createStrategyServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`MCP listening on :${port}${MCP_PATH}`);
});