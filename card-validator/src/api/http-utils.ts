import { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

export const DEFAULT_MAX_BODY_BYTES = 1024 * 1024; // 1 MB

export interface ApiErrorResponse {
  error: string;
}

/**
 * Lee y parsea de forma segura el cuerpo JSON de una petición HTTP entrante.
 *
 * @param req - Flujo de la petición entrante
 * @param maxBytes - Límite máximo de tamaño en bytes (por defecto 1 MB)
 * @returns Promesa con el objeto JSON parseado
 */
export async function parseJsonBody<T = unknown>(
  req: IncomingMessage | Readable,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES
): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = '';
    let totalBytes = 0;

    req.on('data', (chunk: Buffer | string) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      raw += chunk.toString();
    });

    req.on('end', () => {
      if (!raw || raw.trim().length === 0) {
        resolve({} as T);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed as T);
      } catch {
        reject(new Error('JSON_MALFORMED'));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Envía una respuesta HTTP con cabecera application/json.
 *
 * @param res - Objeto ServerResponse
 * @param statusCode - Código de estado HTTP (200, 400, etc.)
 * @param data - Objeto de datos a serializar en JSON
 */
export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * Crea un objeto estructurado de respuesta de error.
 *
 * @param message - Descripción del error
 * @returns ApiErrorResponse
 */
export function createErrorResponse(message: string): ApiErrorResponse {
  return { error: message };
}
