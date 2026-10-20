import { IncomingMessage, ServerResponse } from 'node:http';
import { parseJsonBody, sendJson } from './http-utils.js';
import { validateCreditCard } from '../validator.js';
import { validateLuhn } from '../luhn.js';
import { sanitizeCardNumber } from '../sanitizer.js';
import { detectCardBrand } from '../brands.js';
import { CardInput } from '../types.js';

export function handleHealth(_req: IncomingMessage, res: ServerResponse): void {
  sendJson(res, 200, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}

export async function handleValidate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await parseJsonBody<CardInput>(req);
  const result = validateCreditCard(body);
  sendJson(res, 200, result);
}

export async function handleLuhn(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await parseJsonBody<{ cardNumber: string }>(req);
  const rawNumber = typeof body?.cardNumber === 'string' ? body.cardNumber : '';
  const sanitized = sanitizeCardNumber(rawNumber);
  const luhnValid = validateLuhn(sanitized);

  sendJson(res, 200, {
    luhnValid,
    sanitizedNumber: sanitized,
  });
}

export async function handleBrand(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await parseJsonBody<{ cardNumber: string }>(req);
  const rawNumber = typeof body?.cardNumber === 'string' ? body.cardNumber : '';
  const sanitized = sanitizeCardNumber(rawNumber);
  const brand = detectCardBrand(sanitized);

  sendJson(res, 200, {
    brand,
  });
}
