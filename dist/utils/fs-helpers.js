import fs from 'node:fs/promises';
import path from 'node:path';
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}
export async function readFileUtf8(filePath) {
    return await fs.readFile(filePath, 'utf-8');
}
export async function writeFileUtf8(filePath, content) {
    const dir = path.dirname(filePath);
    await ensureDir(dir);
    await fs.writeFile(filePath, content, 'utf-8');
}
export async function listFilesRecursive(dir, extension) {
    const results = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
                    results.push(...(await listFilesRecursive(fullPath, extension)));
                }
            }
            else if (entry.isFile()) {
                if (!extension || entry.name.endsWith(extension)) {
                    results.push(fullPath);
                }
            }
        }
    }
    catch {
        // Directorio no existe o no accesible
    }
    return results;
}
//# sourceMappingURL=fs-helpers.js.map