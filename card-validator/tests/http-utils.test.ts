import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import { parseJsonBody, sendJson, createErrorResponse } from '../src/api/http-utils.js';

describe('HTTP Utilities Module (REQ-API-05)', () => {
  function createMockRequest(bodyString: string): Readable {
    const stream = new Readable();
    stream.push(bodyString);
    stream.push(null);
    return stream;
  }

  it('debe parsear un cuerpo JSON válido correctamente', async () => {
    const req = createMockRequest(JSON.stringify({ cardNumber: '4532' }));
    const result = await parseJsonBody(req);
    expect(result).toEqual({ cardNumber: '4532' });
  });

  it('debe arrojar error si el cuerpo no es un JSON válido', async () => {
    const req = createMockRequest('cuerpo-invalido-no-json');
    await expect(parseJsonBody(req)).rejects.toThrow('JSON_MALFORMED');
  });

  it('debe arrojar error si el cuerpo excede el límite máximo de bytes', async () => {
    const hugeString = 'a'.repeat(200);
    const req = createMockRequest(hugeString);
    await expect(parseJsonBody(req, 100)).rejects.toThrow('PAYLOAD_TOO_LARGE');
  });

  it('debe formatear respuestas de error consistentes', () => {
    const err = createErrorResponse('Ruta no encontrada');
    expect(err).toEqual({ error: 'Ruta no encontrada' });
  });
});
