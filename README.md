# Solution Architect Scenario Studio

Workspace-first React app for generating editable architecture diagrams and scenario playbooks from natural-language prompts.

## What it includes

- Sticky compact header with `Design`, `Solution`, and `Scenario` workspace tabs
- Large React Flow design board with floating toolbox and floating current-nodes inspector
- Popup chat bubble for both first-pass scenario generation and iterative refinement
- Editable solution narrative tab
- Scenario playbook tab with discovery, problem framing, architecture options, mock interview, risks, executive summary, toolkit, and visual architecture board
- Local mock mode plus OpenAI-backed generation through `/api/studio/generate`
- Local scenario save/load/duplicate and export actions for PNG, TXT, and PDF

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Set `OPENAI_API_KEY` in `.env` to enable live OpenAI generation. Without it, the app uses the built-in mock scenario response.
