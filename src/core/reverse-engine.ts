import fs from 'node:fs/promises';
import path from 'node:path';
import { fileExists, readFileUtf8 } from '../utils/fs-helpers.js';

export interface ProjectScanResult {
  projectPath: string;
  projectName: string;
  ecosystem: 'node' | 'python' | 'rust' | 'go' | 'polyglot' | 'unknown';
  detectedLanguages: string[];
  testRunner?: string;
  buildTool?: string;
  dependencies: string[];
  devDependencies: string[];
  mainDirectories: string[];
  packageScripts: Record<string, string>;
}

export async function scanProject(projectRoot: string): Promise<ProjectScanResult> {
  const result: ProjectScanResult = {
    projectPath: projectRoot,
    projectName: path.basename(projectRoot),
    ecosystem: 'unknown',
    detectedLanguages: [],
    dependencies: [],
    devDependencies: [],
    mainDirectories: [],
    packageScripts: {},
  };

  // 1. Escanear Node / JavaScript / TypeScript
  const pkgPath = path.join(projectRoot, 'package.json');
  if (await fileExists(pkgPath)) {
    result.ecosystem = 'node';
    result.detectedLanguages.push('JavaScript');
    try {
      const pkgContent = JSON.parse(await readFileUtf8(pkgPath));
      if (pkgContent.name) result.projectName = pkgContent.name;
      if (pkgContent.scripts) result.packageScripts = pkgContent.scripts;
      if (pkgContent.dependencies) {
        result.dependencies = Object.keys(pkgContent.dependencies);
      }
      if (pkgContent.devDependencies) {
        result.devDependencies = Object.keys(pkgContent.devDependencies);
        if (result.devDependencies.includes('typescript')) {
          result.detectedLanguages.push('TypeScript');
        }
        if (result.devDependencies.includes('vitest')) result.testRunner = 'vitest';
        else if (result.devDependencies.includes('jest')) result.testRunner = 'jest';
      }
    } catch {
      // Ignorar error de parsing en package.json malformado
    }
  }

  // 2. Escanear Python
  const pyProject = path.join(projectRoot, 'pyproject.toml');
  const reqTxt = path.join(projectRoot, 'requirements.txt');
  if ((await fileExists(pyProject)) || (await fileExists(reqTxt))) {
    result.detectedLanguages.push('Python');
    if (result.ecosystem === 'unknown') result.ecosystem = 'python';
    else result.ecosystem = 'polyglot';
    result.testRunner = result.testRunner || 'pytest';
  }

  // 3. Escanear Rust
  const cargoToml = path.join(projectRoot, 'Cargo.toml');
  if (await fileExists(cargoToml)) {
    result.detectedLanguages.push('Rust');
    if (result.ecosystem === 'unknown') result.ecosystem = 'rust';
    else result.ecosystem = 'polyglot';
    result.testRunner = result.testRunner || 'cargo test';
  }

  // 4. Escanear Go
  const goMod = path.join(projectRoot, 'go.mod');
  if (await fileExists(goMod)) {
    result.detectedLanguages.push('Go');
    if (result.ecosystem === 'unknown') result.ecosystem = 'go';
    else result.ecosystem = 'polyglot';
    result.testRunner = result.testRunner || 'go test ./...';
  }

  // 5. Detectar carpetas de alto nivel
  try {
    const entries = await fs.readdir(projectRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        !['node_modules', '.git', 'dist', '.sdd', '.agents', '.venv'].includes(entry.name)
      ) {
        result.mainDirectories.push(entry.name);
      }
    }
  } catch {
    // Directorio no accesible
  }

  return result;
}

export function generateReverseConstitution(scan: ProjectScanResult): string {
  const langList = scan.detectedLanguages.length > 0 ? scan.detectedLanguages.join(', ') : 'No detectado';
  const testCmd = scan.testRunner || scan.packageScripts.test || 'npm test';

  return `# Constitución del Proyecto: ${scan.projectName} (Ingeniería Inversa SDD)

> **GENERADO AUTOMÁTICAMENTE:** Este documento fue generado a partir del análisis del código existente en el repositorio. Establece las directrices innegociables para cualquier IA que colabore en este proyecto.

---

## 1. Stack Tecnológico y Convenciones Observadas
- **Ecosistema Principal:** ${scan.ecosystem.toUpperCase()}
- **Lenguajes Detectados:** ${langList}
- **Comando de Testing Oficial:** \`${testCmd}\`
- **Módulos y Estructura Principal:**
${scan.mainDirectories.map((d) => `  - \`${d}/\``).join('\n') || '  - (Raíz del proyecto)'}

---

## 2. Principios Innegociables del Repositorio
1. **Preservación del Código Existente:** Prohibido realizar refactorizaciones no solicitadas en código preexistente sin una especificación delta aprobada.
2. **Compatibilidad hacia atrás:** Toda nueva funcionalidad debe mantener los contratos y pruebas existentes intactos.
3. **Flujo SDD para Nuevos Cambios:** Antes de modificar o añadir módulos, se debe redactar la especificación delta en \`.sdd/specs/\` en notación EARS.
4. **Pruebas Automatizadas:** Todo commit debe verificar que el comando \`${testCmd}\` continúe pasando exitosamente.
`;
}

export function generateReverseBaselineSpec(scan: ProjectScanResult): string {
  const testCmd = scan.testRunner || scan.packageScripts.test || 'npm test';

  return `# SPEC-000: Línea Base del Sistema Existente (${scan.projectName})

- **Estado:** APPROVED
- **Fecha:** ${new Date().toISOString().split('T')[0]}
- **Nivel de Severidad:** L2 (Standard)
- **Tipo de Especificación:** Línea Base / Brownfield Reverse-SDD

---

## 1. Contexto y Superficie Pública
Este documento describe el comportamiento y capacidades observables actuales del proyecto ${scan.projectName}. Actúa como el contrato de referencia para evitar regresiones.

---

## 2. Requerimientos de la Línea Base (Notación EARS)

### REQ-000-01: Integridad de la Suite de Pruebas Preexistente
- **Tipo EARS:** State-driven
- **Declaración:**
  > **MIENTRAS** se introduzcan cambios o extensiones al sistema, el sistema **deberá** mantener el 100% de éxito en la suite de pruebas existente ejecutada mediante \`${testCmd}\`.
- **Criterio de Aceptación:**
  - **DADO:** El estado base del repositorio verificado.
  - **CUANDO:** Se ejecuta \`${testCmd}\`.
  - **ENTONCES:** Todos los tests pasan sin regresiones.

### REQ-000-02: Compatibilidad de Interfaces y Dependencias
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** preservar la compatibilidad con el ecosistema ${scan.ecosystem} y las dependencias base declaradas.
- **Criterio de Aceptación:**
  - **DADO:** Las dependencias actuales del proyecto.
  - **CUANDO:** Se instala o compila el entorno.
  - **ENTONCES:** No se producen rupturas de tipos ni conflictos de dependencias no autorizadas.
`;
}
