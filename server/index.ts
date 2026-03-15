import "dotenv/config";
import fs from "node:fs";
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

// ─── Load prompts from files ───────────────────────────────────────────────────
const promptsDir = path.resolve(__dirname, "prompts");
const loadPrompt = (filename: string) => fs.readFileSync(path.join(promptsDir, filename), "utf-8").trim();
const generateSystemPrompt = loadPrompt("generate-system.md");
const generateRequests = JSON.parse(loadPrompt("generate-requests.json")) as {
  generateDesign: string;
  generateSolution: string;
  generateStory: string;
  generateNew: string;
};

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

// ─── Unified generate endpoint ─────────────────────────────────────────────────
app.post("/api/studio/generate", async (request, response) => {
  const payload = request.body as {
    intent?: keyof typeof generateRequests;
    scenarioInput?: unknown;
    currentArchitecture?: unknown;
    currentPlaybook?: unknown;
    currentSolutionNarrative?: string;
    currentStory?: unknown;
    architectAnswers?: unknown;
    messages?: { role: "user" | "assistant"; content: string }[];
    mockResponse?: unknown;
  };

  const intentText = payload.intent ? generateRequests[payload.intent] : undefined;
  if (!intentText) {
    response.status(400).json({ error: "A valid intent is required: generateDesign, generateSolution, generateStory, or generateNew." });
    return;
  }

  if (!openai) {
    response.json(payload.mockResponse);
    return;
  }

  // Build context sent to OpenAI — never include mockResponse (fallback only)
  const isNew = payload.intent === "generateNew";
  const openAIContext: Record<string, unknown> = {
    request: intentText,
    scenarioInput: payload.scenarioInput,
    architectAnswers: payload.architectAnswers,
    messages: payload.messages
  };
  if (!isNew) {
    openAIContext.currentArchitecture = payload.currentArchitecture;
    openAIContext.currentPlaybook = payload.currentPlaybook;
    openAIContext.currentSolutionNarrative = payload.currentSolutionNarrative;
    openAIContext.currentStory = payload.currentStory;
  }

  try {
    const result = await openai.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: `${generateSystemPrompt}\n\nAllowed icon IDs: ${allowedIconIds}` }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify(openAIContext) }]
        }
      ],
      text: { format: zodTextFormat(studioResponseSchema, "studio_response") }
    });

    response.json(result.output_parsed);
  } catch (error) {
    if (error instanceof OpenAI.APIError && (error.status === 429 || error.code === "insufficient_quota")) {
      response.json({
        ...(payload.mockResponse as Record<string, unknown>),
        assistantMessage: "OpenAI quota is unavailable right now, so the studio used mock data. Update billing or quota when ready and retry for live generation."
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
