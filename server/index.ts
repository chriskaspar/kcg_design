import "dotenv/config";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { studioResponseSchema } from "./schema";
import { iconCatalog } from "../src/lib/iconCatalog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 8787);
const isProduction = process.env.NODE_ENV === "production";
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_MODEL || "gpt-4o";
const allowedIconIds = iconCatalog.map((icon) => icon.id).join(", ");

app.use(cors());
app.use(express.json({ limit: "4mb" }));

// ─── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    mode: process.env.OPENAI_API_KEY ? "openai" : "mock"
  });
});

// ─── Generate architecture + playbook ──────────────────────────────────────────
app.post("/api/studio/generate", async (request, response) => {
  const payload = request.body as {
    request?: string;
    scenarioInput?: unknown;
    currentArchitecture?: unknown;
    currentPlaybook?: unknown;
    architectAnswers?: unknown;
    messages?: { role: "user" | "assistant"; content: string }[];
    mockResponse?: unknown;
  };

  if (!payload.request?.trim()) {
    response.status(400).json({ error: "A scenario prompt is required." });
    return;
  }

  if (!openai) {
    response.json(payload.mockResponse);
    return;
  }

  try {
    const result = await openai.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `You are an elite Principal Solutions Architect, industry advisor, and customer engineering coach. Always start from business outcomes and discovery before architecture. Return only valid JSON matching the required schema. Generate both a structured solution architecture and a complete scenario playbook. Use only these allowed icon IDs when assigning architecture nodes: ${allowedIconIds}. Use generic icons if the vendor-specific icon is not available. Keep node positions in a 0 to 1400 horizontal canvas. Assign metadata.group to group related nodes (e.g. "Data Sources", "Ingestion", "Medallion Platform", "Governance", "Analytics & AI"). Ensure ALL nodes are connected by edges — no isolated nodes.`
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(payload)
            }
          ]
        }
      ],
      text: {
        format: zodTextFormat(studioResponseSchema, "studio_response")
      }
    });

    response.json(result.output_parsed);
  } catch (error) {
    if (error instanceof OpenAI.APIError && (error.status === 429 || error.code === "insufficient_quota")) {
      response.json({
        ...(payload.mockResponse as Record<string, unknown>),
        assistantMessage:
          "OpenAI quota is unavailable right now, so the studio used mock data. Update billing or quota when ready and retry for live generation."
      });
      return;
    }

    console.error(error);
    response.status(500).json({
      ...(payload.mockResponse as Record<string, unknown>),
      assistantMessage: "OpenAI generation failed, so the studio returned mock content instead."
    });
  }
});

// ─── Generate story from ARCHITECT Q&A ────────────────────────────────────────
app.post("/api/studio/generate-story", async (request, response) => {
  const payload = request.body as {
    answers?: Record<string, string>;
    scenarioInput?: unknown;
    currentArchitecture?: unknown;
  };

  if (!openai) {
    // Mock story when no API key
    response.json({
      story: {
        strategy: "A governed enterprise data platform built on a lakehouse architecture, unifying fragmented source systems through a medallion lifecycle and enabling trusted analytics and AI at scale.",
        technology: "The platform leverages Databricks with Auto Loader for file ingestion, Delta Live Tables for streaming and batch pipelines, a Bronze–Silver–Gold medallion architecture, Unity Catalog for centralized governance, and curated Gold data products powering BI, ML, and AI consumption layers.",
        outcome: "Faster analytics delivery, reduced platform sprawl, trusted and reusable data products, and a governed foundation that accelerates machine learning and AI use cases across the organization.",
        returnValue: "Reduced time-to-insight, lower total cost of ownership through platform consolidation, improved data quality and trust, and accelerated AI program readiness that creates measurable new business value.",
        years: "This architecture is designed to scale incrementally across data domains, support growing volumes and AI workloads, and provide the governed, interoperable foundation needed for advanced automation, cross-domain sharing, and long-term AI capability building."
      }
    });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a senior Solution Architect who writes concise, executive-ready architecture narratives. Given ARCHITECT framework Q&A answers and scenario context, generate a 5-field story object. Each field should be 3-5 impactful sentences. Return only valid JSON with keys: strategy, technology, outcome, returnValue, years.`
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
      strategy?: string;
      technology?: string;
      outcome?: string;
      returnValue?: string;
      years?: string;
    };

    response.json({ story: parsed });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Story generation failed." });
  }
});

// ─── Serve Vite frontend in production ────────────────────────────────────────
if (isProduction) {
  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  // SPA fallback — serve index.html for all non-API routes
  app.get("*", (_request, response) => {
    response.sendFile(path.join(distPath, "index.html"));
  });
}

// ─── Start server ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

server.on("listening", () => {
  console.log(`SA Studio API running on http://localhost:${port} [${isProduction ? "production" : "development"}]`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.log(`Port ${port} is already in use. Reusing the existing API server.`);
    process.exit(0);
  }
  throw error;
});

server.listen(port);
