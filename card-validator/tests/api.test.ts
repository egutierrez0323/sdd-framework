import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { createCardServer } from '../src/server.js';

describe('Card Validator REST API Integration Tests (REQ-API-01 to REQ-API-05)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createCardServer();
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET /health debe retornar 200 con estado ok (REQ-API-01)', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(typeof data.timestamp).toBe('string');
  });

  it('POST /api/v1/cards/validate debe validar una tarjeta completa correctamente (REQ-API-02)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/cards/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardNumber: '4532 0151 1283 0366',
        expMonth: 12,
        expYear: 2030,
        cvv: '123',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isValid).toBe(true);
    expect(data.brand).toBe('VISA');
    expect(data.luhnValid).toBe(true);
    expect(data.expirationValid).toBe(true);
    expect(data.cvvValid).toBe(true);
  });

  it('POST /api/v1/cards/luhn debe verificar solo el algoritmo de Luhn (REQ-API-03)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/cards/luhn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardNumber: '5555 5555 5555 4444' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.luhnValid).toBe(true);
    expect(data.sanitizedNumber).toBe('5555555555554444');
  });

  it('POST /api/v1/cards/brand debe detectar la franquicia correspondiente (REQ-API-04)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/cards/brand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardNumber: '3782-8224-6310-005' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.brand).toBe('AMEX');
  });

  it('POST /api/v1/cards/validate con JSON malformado debe responder 400 Bad Request (REQ-API-05)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/cards/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ json_roto: ',
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('JSON');
  });

  it('GET en ruta desconocida debe retornar 404 Not Found (REQ-API-05)', async () => {
    const res = await fetch(`${baseUrl}/ruta-inexistente`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('no encontrada');
  });

  it('POST en /health debe retornar 405 Method Not Allowed (REQ-API-05)', async () => {
    const res = await fetch(`${baseUrl}/health`, { method: 'POST' });
    expect(res.status).toBe(405);
  });
});
