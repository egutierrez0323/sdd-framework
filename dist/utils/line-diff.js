const DEFAULT_CONTEXT = 3;
function splitLines(text) {
    if (text.length === 0)
        return [];
    const lines = text.split(/\r?\n/);
    if (lines[lines.length - 1] === '')
        lines.pop();
    return lines;
}
function countCommonPrefix(a, b) {
    let count = 0;
    while (count < a.length && count < b.length && a[count] === b[count])
        count++;
    return count;
}
function countCommonSuffix(a, b, prefix) {
    let count = 0;
    while (count < a.length - prefix &&
        count < b.length - prefix &&
        a[a.length - 1 - count] === b[b.length - 1 - count]) {
        count++;
    }
    return count;
}
function formatRange(start, count) {
    return count === 0 ? `${start},0` : `${start + 1},${count}`;
}
function mark(lines, sign) {
    return lines.map((line) => `${sign}${line}`);
}
/**
 * Diff unificado de presentación para `--dry-run`. Recorta las líneas comunes al principio y al final
 * y emite un único hunk: es exacto para los cambios de SDD, que afectan a una sola región contigua.
 * Las diferencias que solo están en los finales de línea no se muestran.
 */
export function unifiedDiff(relPath, before, after, context = DEFAULT_CONTEXT) {
    const a = splitLines(before);
    const b = splitLines(after);
    const prefix = countCommonPrefix(a, b);
    if (prefix === a.length && prefix === b.length)
        return '';
    const suffix = countCommonSuffix(a, b, prefix);
    const start = Math.max(0, prefix - context);
    const oldEnd = Math.min(a.length, a.length - suffix + context);
    const newEnd = Math.min(b.length, b.length - suffix + context);
    const hunk = [
        ...mark(a.slice(start, prefix), ' '),
        ...mark(a.slice(prefix, a.length - suffix), '-'),
        ...mark(b.slice(prefix, b.length - suffix), '+'),
        ...mark(a.slice(a.length - suffix, oldEnd), ' '),
    ];
    const header = `@@ -${formatRange(start, oldEnd - start)} +${formatRange(start, newEnd - start)} @@`;
    return [`--- a/${relPath}`, `+++ b/${relPath}`, header, ...hunk, ''].join('\n');
}
//# sourceMappingURL=line-diff.js.map