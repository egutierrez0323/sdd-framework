import path from 'node:path';
import { listFilesRecursive, readFileUtf8, writeFileUtf8 } from '../utils/fs-helpers.js';

export interface GraphNode {
  id: string; // ej: "src/core/config.ts"
  name: string;
  type: 'module' | 'interface' | 'utility' | 'test';
  exports: string[];
  imports: string[];
  approxTokens: number;
}

export interface ProjectGraph {
  nodes: GraphNode[];
  edges: Array<{ from: string; to: string }>;
  stats: {
    totalFiles: number;
    totalExports: number;
    rawTokensEstimate: number;
    graphTokensEstimate: number;
    tokenReductionPercent: number;
  };
}

export async function generateProjectGraph(
  projectRoot: string = process.cwd(),
  targetExtensions: string[] = ['.ts', '.js', '.tsx', '.jsx']
): Promise<ProjectGraph> {
  const allFiles = await listFilesRecursive(projectRoot);
  const codeFiles = allFiles.filter(
    (f) =>
      targetExtensions.some((ext) => f.endsWith(ext)) &&
      !f.includes('node_modules') &&
      !f.includes('dist') &&
      !f.includes('.sdd')
  );

  const nodes: GraphNode[] = [];
  const edges: Array<{ from: string; to: string }> = [];

  let rawTokensEstimate = 0;

  for (const file of codeFiles) {
    const relPath = path.relative(projectRoot, file).replace(/\\/g, '/');
    const content = await readFileUtf8(file);

    // Estimación rápida de tokens: ~4 caracteres por token
    const fileTokens = Math.ceil(content.length / 4);
    rawTokensEstimate += fileTokens;

    const exports: string[] = [];
    const imports: string[] = [];

    // Parseo rápido de exports (funciones, clases, interfaces, tipos, consts)
    const exportMatches = content.matchAll(
      /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+([A-Za-z0-9_]+)/g
    );
    for (const match of exportMatches) {
      if (match[1]) exports.push(match[1]);
    }

    // Parseo de imports relativos
    const importMatches = content.matchAll(/import\s+(?:.+?\s+from\s+)?['"](\.\.?\/[^'"]+)['"]/g);
    for (const match of importMatches) {
      if (match[1]) {
        const rawImport = match[1];
        // Normalizar ruta importada
        const dir = path.dirname(relPath);
        const resolved = path.normalize(path.join(dir, rawImport)).replace(/\\/g, '/');
        imports.push(resolved);
        edges.push({ from: relPath, to: resolved });
      }
    }

    let nodeType: GraphNode['type'] = 'module';
    if (relPath.includes('test')) nodeType = 'test';
    else if (relPath.includes('utils')) nodeType = 'utility';

    nodes.push({
      id: relPath,
      name: path.basename(relPath),
      type: nodeType,
      exports,
      imports,
      approxTokens: fileTokens,
    });
  }

  // Estimación de tokens del grafo compacto
  const graphSummary = JSON.stringify(
    nodes.map((n) => ({ id: n.id, exports: n.exports, imports: n.imports }))
  );
  const graphTokensEstimate = Math.ceil(graphSummary.length / 4);
  const tokenReductionPercent =
    rawTokensEstimate > 0
      ? Math.round(((rawTokensEstimate - graphTokensEstimate) / rawTokensEstimate) * 100)
      : 0;

  return {
    nodes,
    edges,
    stats: {
      totalFiles: nodes.length,
      totalExports: nodes.reduce((sum, n) => sum + n.exports.length, 0),
      rawTokensEstimate,
      graphTokensEstimate,
      tokenReductionPercent,
    },
  };
}

export function formatMermaidGraph(graph: ProjectGraph): string {
  let md = `# Mapa Visual de Arquitectura y Grafo de Dependencias\n\n`;
  md += `> **MÉTRICAS DE TOKENS:**\n`;
  md += `> - Archivos analizados: **${graph.stats.totalFiles}**\n`;
  md += `> - Símbolos exportados: **${graph.stats.totalExports}**\n`;
  md += `> - Tokens código fuente completo: ~**${graph.stats.rawTokensEstimate}** tokens\n`;
  md += `> - Tokens del grafo compacto: ~**${graph.stats.graphTokensEstimate}** tokens\n`;
  md += `> - **Ahorro de Tokens: ${graph.stats.tokenReductionPercent}%**\n\n`;

  md += `\`\`\`mermaid\ngraph TD\n`;

  // Declarar nodos
  for (const node of graph.nodes) {
    const label = `${node.name}<br/>(${node.exports.slice(0, 3).join(', ')}${
      node.exports.length > 3 ? '...' : ''
    })`;
    md += `  ${sanitizeId(node.id)}["${label}"]\n`;
  }

  // Declarar dependencias
  for (const edge of graph.edges) {
    const toMatch = graph.nodes.find(
      (n) => n.id.startsWith(edge.to) || n.id.replace(/\.[^.]+$/, '') === edge.to
    );
    if (toMatch) {
      md += `  ${sanitizeId(edge.from)} --> ${sanitizeId(toMatch.id)}\n`;
    }
  }

  md += `\`\`\`\n\n`;

  // Índice Compacto de Símbolos (Para inyectar como contexto mínimo a agentes de IA)
  md += `## Índice Semántico Ultracompacto de Contexto\n\n`;
  md += `| Módulo | Símbolos Exportados | Dependencias Clave |\n`;
  md += `| :--- | :--- | :--- |\n`;
  for (const node of graph.nodes) {
    md += `| \`${node.id}\` | ${node.exports.map((e) => `\`${e}\``).join(', ') || '*(interno)*'} | ${
      node.imports.map((i) => `\`${path.basename(i)}\``).join(', ') || '*(ninguna)*'
    } |\n`;
  }

  return md;
}

function sanitizeId(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, '_');
}

export async function saveProjectGraphArtifacts(
  graph: ProjectGraph,
  projectRoot: string = process.cwd()
): Promise<{ jsonPath: string; mermaidPath: string; externalDeepGraph?: string }> {
  const jsonPath = path.join(projectRoot, '.sdd', 'context-graph.json');
  const mermaidPath = path.join(projectRoot, '.sdd', 'architecture-graph.md');

  // Detectar si el proyecto tiene un grafo profundo externo (ej. Graphify)
  let externalDeepGraph: string | undefined;
  const graphifyCandidates = [
    path.join(projectRoot, 'graph.html'),
    path.join(projectRoot, 'graph.json'),
    path.join(projectRoot, '.graphify', 'graph.json'),
  ];

  for (const candidate of graphifyCandidates) {
    try {
      const fs = await import('node:fs/promises');
      await fs.access(candidate);
      externalDeepGraph = path.relative(projectRoot, candidate).replace(/\\/g, '/');
      break;
    } catch {
      // No existe, continuar
    }
  }

  let mermaidContent = formatMermaidGraph(graph);
  if (externalDeepGraph) {
    mermaidContent = `> 🔍 **GRAFO FORENSE PROFUNDO DETECTADO (Graphify):** Existe un mapa intra-función detallado en \`${externalDeepGraph}\` para análisis de llamadas de bajo nivel.\n\n` + mermaidContent;
  }

  await writeFileUtf8(jsonPath, JSON.stringify(graph, null, 2));
  await writeFileUtf8(mermaidPath, mermaidContent);

  return { jsonPath, mermaidPath, externalDeepGraph };
}
