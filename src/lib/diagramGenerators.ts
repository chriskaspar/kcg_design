import type { ArchitectureSpec } from "../types/architecture";

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export const buildMermaid = (spec: ArchitectureSpec) => {
  const lines = ["flowchart LR"];

  spec.nodes.forEach((node) => {
    lines.push(`  ${node.id}["${node.label.replaceAll('"', "'")}"]`);
  });

  spec.edges.forEach((edge) => {
    const label = edge.label ? `|${edge.label.replaceAll("|", "/")}|` : "";
    lines.push(`  ${edge.source} -->${label} ${edge.target}`);
  });

  return lines.join("\n");
};

export const buildDrawioXml = (spec: ArchitectureSpec) => {
  const cells = [
    '<mxCell id="0" />',
    '<mxCell id="1" parent="0" />'
  ];

  spec.nodes.forEach((node, index) => {
    cells.push(
      `<mxCell id="${node.id}" value="${escapeXml(node.label)}" style="rounded=1;whiteSpace=wrap;html=1;strokeColor=#0f172a;fillColor=#f8fafc;" vertex="1" parent="1"><mxGeometry x="${120 + node.x}" y="${80 + node.y}" width="160" height="72" as="geometry" /></mxCell>`
    );
  });

  spec.edges.forEach((edge) => {
    cells.push(
      `<mxCell id="${edge.id}" value="${escapeXml(edge.label)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;" edge="1" parent="1" source="${edge.source}" target="${edge.target}"><mxGeometry relative="1" as="geometry" /></mxCell>`
    );
  });

  return `<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net"><diagram id="architecture" name="Architecture Design"><mxGraphModel dx="1498" dy="863" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1920" pageHeight="1080" math="0" shadow="0"><root>${cells.join("")}</root></mxGraphModel></diagram></mxfile>`;
};
