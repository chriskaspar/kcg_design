import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { studioResponseSchema } from "./schema";
import { iconCatalog } from "../src/lib/iconCatalog";

const app = express();
const port = Number(process.env.PORT || 8787);
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_MODEL || "gpt-5";
const allowedIconIds = iconCatalog.map((icon) => icon.id).join(", ");

app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    mode: process.env.OPENAI_API_KEY ? "openai" : "mock"
  });
});

app.post("/api/studio/generate", async (request, response) => {
  const payload = request.body as {
    request?: string;
    scenarioInput?: unknown;
    currentArchitecture?: unknown;
    currentPlaybook?: unknown;
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
              text:
                `You are an elite Principal Solutions Architect, industry advisor, and customer engineering coach. Always start from business outcomes and discovery before architecture. Return only valid JSON matching the required schema. Generate both a structured solution architecture and a complete scenario playbook. Use only these allowed icon IDs when assigning architecture nodes: ${allowedIconIds}. Use generic icons if the vendor-specific icon is not available. Keep node positions in a 0 to 1400 horizontal canvas and assign lanes such as Source Systems, Ingestion, Platform / Processing, Governance, or Consumption / AI.`
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

const server = http.createServer(app);

server.on("listening", () => {
  console.log(`Solution Architect Scenario Studio API running on http://localhost:${port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.log(`Port ${port} is already in use. Reusing the existing API server on http://localhost:${port}`);
    process.exit(0);
  }

  throw error;
});

server.listen(port);
