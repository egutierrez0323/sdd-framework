export declare function fileExists(filePath: string): Promise<boolean>;
export declare function ensureDir(dirPath: string): Promise<void>;
export declare function readFileUtf8(filePath: string): Promise<string>;
export declare function writeFileUtf8(filePath: string, content: string): Promise<void>;
export declare function listFilesRecursive(dir: string, extension?: string): Promise<string[]>;
//# sourceMappingURL=fs-helpers.d.ts.map