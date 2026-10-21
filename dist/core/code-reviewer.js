import fs from 'node:fs/promises';
import path from 'node:path';
import { readFileUtf8, listFilesRecursive } from '../utils/fs-helpers.js';
/**
 * Normaliza una línea para análisis eliminando espacios superfluos y comentarios básicos.
 */
function normalizeLine(line) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('*/')) {
        return '';
    }
    return trimmed;
}
/**
 * Detecta bloques duplicados entre un conjunto de archivos usando sliding window de n líneas.
 */
export function findDuplicateBlocks(files, minLines = 5) {
    const allFileLines = [];
    for (const f of files) {
        const rawLines = f.content.split('\n');
        const normalizedEntries = [];
        for (let i = 0; i < rawLines.length; i++) {
            const norm = normalizeLine(rawLines[i]);
            // Solo consideramos líneas con contenido sustancial (longitud > 3 para evitar llaves sueltas)
            if (norm.length > 3) {
                normalizedEntries.push({
                    file: f.path,
                    lineNum: i + 1,
                    text: norm,
                });
            }
        }
        allFileLines.push({ file: f.path, lines: normalizedEntries });
    }
    // Mapa de secuencias de minLines normalizadas a ocurrencias
    const sequenceMap = new Map();
    for (const { file, lines } of allFileLines) {
        if (lines.length < minLines)
            continue;
        for (let i = 0; i <= lines.length - minLines; i++) {
            const window = lines.slice(i, i + minLines);
            const key = window.map((w) => w.text).join(' ::: ');
            const rawSnippet = window.map((w) => w.text).join('\n');
            const existing = sequenceMap.get(key) || [];
            existing.push({ file, lineNum: window[0].lineNum, rawSnippet });
            sequenceMap.set(key, existing);
        }
    }
    const duplicates = [];
    const registeredPairs = new Set();
    for (const occurrences of sequenceMap.values()) {
        if (occurrences.length > 1) {
            for (let i = 0; i < occurrences.length; i++) {
                for (let j = i + 1; j < occurrences.length; j++) {
                    const occ1 = occurrences[i];
                    const occ2 = occurrences[j];
                    // Si es en el mismo archivo, la distancia debe ser mayor a minLines para evitar solapamiento
                    if (occ1.file === occ2.file && Math.abs(occ1.lineNum - occ2.lineNum) < minLines) {
                        continue;
                    }
                    const pairKey = `${occ1.file}:${occ1.lineNum}-${occ2.file}:${occ2.lineNum}`;
                    if (registeredPairs.has(pairKey))
                        continue;
                    registeredPairs.add(pairKey);
                    // Si ya existe un bloque registrado entre estos dos archivos que es contiguo o se solapa
                    const existingBlock = duplicates.find((d) => d.sourceFile === occ1.file &&
                        d.targetFile === occ2.file &&
                        occ1.lineNum <= d.startLineSource + d.lineCount &&
                        occ2.lineNum <= d.startLineTarget + d.lineCount);
                    if (existingBlock) {
                        const extension = occ1.lineNum + minLines - (existingBlock.startLineSource + existingBlock.lineCount);
                        if (extension > 0) {
                            existingBlock.lineCount += extension;
                        }
                        continue;
                    }
                    duplicates.push({
                        sourceFile: occ1.file,
                        targetFile: occ2.file,
                        startLineSource: occ1.lineNum,
                        startLineTarget: occ2.lineNum,
                        lineCount: minLines,
                        snippet: occ1.rawSnippet.split('\n').slice(0, 3).join('\n') + '\n...',
                    });
                }
            }
        }
    }
    return duplicates;
}
const CONTROL_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'with']);
/**
 * Analiza métricas de funciones en un archivo TypeScript/JavaScript.
 */
export function analyzeFunctionMetrics(filePath, content, maxLines = 45, maxParams = 4) {
    const metrics = [];
    const lines = content.split('\n');
    // Regex para identificar inicio de funciones
    // Soporta: function foo(..), async function foo(..), const foo = (..) =>, foo(..) { en clases/objetos
    const funcRegex = /(?:(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?:=>|:\s*[^{]+\s*=>)|(?:async\s+)?([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\s*\{)/;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = funcRegex.exec(line);
        if (!match)
            continue;
        const name = match[1] || match[3] || match[5] || 'anonymous';
        if (CONTROL_KEYWORDS.has(name))
            continue;
        const paramsRaw = match[2] || match[4] || match[6] || '';
        const paramCount = paramsRaw.trim()
            ? paramsRaw.split(',').filter((p) => p.trim().length > 0).length
            : 0;
        const lineStart = i + 1;
        let braceCount = 0;
        let foundOpenBrace = false;
        let lineEnd = lineStart;
        // Escanear llaves para determinar fin de la función
        for (let j = i; j < lines.length; j++) {
            const currentLine = lines[j];
            for (const char of currentLine) {
                if (char === '{') {
                    braceCount++;
                    foundOpenBrace = true;
                }
                else if (char === '}') {
                    braceCount--;
                }
            }
            if (foundOpenBrace && braceCount <= 0) {
                lineEnd = j + 1;
                break;
            }
        }
        const lineCount = Math.max(1, lineEnd - lineStart + 1);
        const isOverLimit = lineCount > maxLines || paramCount > maxParams;
        metrics.push({
            file: filePath,
            name,
            lineCount,
            paramCount,
            lineStart,
            isOverLimit,
        });
    }
    return metrics;
}
/**
 * Ejecuta una revisión completa del proyecto o directorio indicado.
 */
export async function reviewProject(targetPath, rootDir = process.cwd(), options = {}) {
    const minDuplicateLines = options.minDuplicateLines ?? 5;
    const maxFunctionLines = options.maxFunctionLines ?? 55;
    const maxParameters = options.maxParameters ?? 4;
    const resolvedTarget = path.isAbsolute(targetPath) ? targetPath : path.join(rootDir, targetPath);
    let targetFiles = [];
    try {
        const stat = await fs.stat(resolvedTarget);
        if (stat.isDirectory()) {
            const allFiles = await listFilesRecursive(resolvedTarget);
            targetFiles = allFiles.filter((f) => (f.endsWith('.ts') || f.endsWith('.js')) &&
                !f.includes('.d.ts') &&
                !f.includes('dist') &&
                !f.includes('node_modules'));
        }
        else {
            targetFiles = [resolvedTarget];
        }
    }
    catch {
        targetFiles = [];
    }
    const loadedFiles = [];
    let totalLines = 0;
    for (const f of targetFiles) {
        try {
            const content = await readFileUtf8(f);
            const relativePath = path.relative(rootDir, f);
            loadedFiles.push({ path: relativePath, content });
            totalLines += content.split('\n').length;
        }
        catch {
            // Ignorar archivos no legibles
        }
    }
    // 1. Detectar duplicados DRY
    const duplicates = findDuplicateBlocks(loadedFiles, minDuplicateLines);
    // 2. Analizar métricas de funciones
    const allFunctionMetrics = [];
    for (const f of loadedFiles) {
        const fMetrics = analyzeFunctionMetrics(f.path, f.content, maxFunctionLines, maxParameters);
        allFunctionMetrics.push(...fMetrics);
    }
    const longFunctions = allFunctionMetrics.filter((fm) => fm.isOverLimit);
    // 3. Generar findings y deducir puntuación
    const findings = [];
    let penalty = 0;
    for (const dup of duplicates) {
        penalty += 8;
        findings.push({
            severity: 'WARNING',
            category: 'DRY',
            file: dup.sourceFile,
            line: dup.startLineSource,
            message: `Bloque de ${dup.lineCount} líneas duplicado en ${dup.targetFile}:${dup.startLineTarget}`,
            suggestion: 'Extraer esta lógica común a un helper o función utilitaria compartida.',
        });
    }
    for (const func of longFunctions) {
        if (func.lineCount > maxFunctionLines) {
            const isCritical = func.lineCount > maxFunctionLines * 1.8;
            penalty += isCritical ? 5 : 2;
            findings.push({
                severity: isCritical ? 'CRITICAL' : 'WARNING',
                category: 'COMPLEXITY',
                file: func.file,
                line: func.lineStart,
                message: `Función '${func.name}' excede el límite recomendado (${func.lineCount} líneas > ${maxFunctionLines})`,
                suggestion: 'Dividir la función aplicando el principio de Responsabilidad Única (SRP).',
            });
        }
        if (func.paramCount > maxParameters) {
            penalty += 2;
            findings.push({
                severity: 'INFO',
                category: 'CLEAN_CODE',
                file: func.file,
                line: func.lineStart,
                message: `Función '${func.name}' tiene ${func.paramCount} parámetros (máximo sugerido: ${maxParameters})`,
                suggestion: 'Agrupar los parámetros en un objeto de opciones o interfaz estructurada.',
            });
        }
    }
    const qualityScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));
    let cleanCodeStatus = 'EXCELLENT';
    if (qualityScore < 60) {
        cleanCodeStatus = 'CRITICAL';
    }
    else if (qualityScore < 80) {
        cleanCodeStatus = 'NEEDS_REFACTOR';
    }
    else if (qualityScore < 95) {
        cleanCodeStatus = 'GOOD';
    }
    return {
        timestamp: new Date().toISOString(),
        filesScanned: loadedFiles.length,
        totalLines,
        qualityScore,
        duplicates,
        longFunctions,
        findings,
        summary: {
            cleanCodeStatus,
            dryViolationsCount: duplicates.length,
            highComplexityCount: longFunctions.length,
        },
    };
}
/**
 * Formatea el reporte de revisión para salida limpia y profesional en consola.
 */
export function formatReviewReport(report) {
    const lines = [];
    lines.push('════════════════════════════════════════════════════════════');
    lines.push('       AUDITOR DE CÓDIGO LIMPIO Y DRY (SDD REVIEW)           ');
    lines.push('════════════════════════════════════════════════════════════\n');
    lines.push(` Archivos analizados: ${report.filesScanned}`);
    lines.push(` Total de líneas:     ${report.totalLines}`);
    lines.push(` Puntuación de salud: ${report.qualityScore} / 100`);
    lines.push(` Estado general:      ${report.summary.cleanCodeStatus}\n`);
    if (report.findings.length === 0) {
        lines.push('✔ [SDD CRAFTSMAN] ¡Felicitaciones! Cero duplicaciones detectadas y funciones en límites saludables.');
        lines.push('  El código cumple con los estándares DRY y Single Responsibility.');
        return lines.join('\n');
    }
    lines.push(`⚠ Se detectaron ${report.findings.length} puntos de mejora:\n`);
    const dryFindings = report.findings.filter((f) => f.category === 'DRY');
    if (dryFindings.length > 0) {
        lines.push('── Violaciones DRY (Duplicación de Código) ─────────────────');
        for (const f of dryFindings) {
            lines.push(` • [${f.severity}] ${f.file}${f.line ? `:${f.line}` : ''}`);
            lines.push(`   ${f.message}`);
            lines.push(`   ↳ Sugerencia: ${f.suggestion}\n`);
        }
    }
    const complexityFindings = report.findings.filter((f) => f.category === 'COMPLEXITY');
    if (complexityFindings.length > 0) {
        lines.push('── Funciones Monolíticas (Complejidad Excesiva) ─────────────');
        for (const f of complexityFindings) {
            lines.push(` • [${f.severity}] ${f.file}${f.line ? `:${f.line}` : ''}`);
            lines.push(`   ${f.message}`);
            lines.push(`   ↳ Sugerencia: ${f.suggestion}\n`);
        }
    }
    const cleanFindings = report.findings.filter((f) => f.category === 'CLEAN_CODE');
    if (cleanFindings.length > 0) {
        lines.push('── Sugerencias de Clean Code ───────────────────────────────');
        for (const f of cleanFindings) {
            lines.push(` • [${f.severity}] ${f.file}${f.line ? `:${f.line}` : ''}`);
            lines.push(`   ${f.message}`);
            lines.push(`   ↳ Sugerencia: ${f.suggestion}\n`);
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=code-reviewer.js.map