import { IncomingMessage, ServerResponse } from 'node:http';
import { handleHealth, handleValidate, handleLuhn, handleBrand } from './handlers.js';
import { sendJson, createErrorResponse } from './http-utils.js';

type RouteHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

interface RouteDefinition {
  method: string;
  handler: RouteHandler;
}

const ROUTE_TABLE: Record<string, RouteDefinition> = {
  '/health': { method: 'GET', handler: handleHealth },
  '/api/v1/cards/validate': { method: 'POST', handler: handleValidate },
  '/api/v1/cards/luhn': { method: 'POST', handler: handleLuhn },
  '/api/v1/cards/brand': { method: 'POST', handler: handleBrand },
};

function handleRouteError(err: unknown, res: ServerResponse): void {
  const errorMsg = err instanceof Error ? err.message : String(err);

  if (errorMsg === 'JSON_MALFORMED') {
    sendJson(res, 400, createErrorResponse('Cuerpo de solicitud inválido o no es JSON'));
    return;
  }

  if (errorMsg === 'PAYLOAD_TOO_LARGE') {
    sendJson(res, 413, createErrorResponse('El cuerpo de la solicitud excede el límite permitido (1MB)'));
    return;
  }

  sendJson(res, 500, createErrorResponse('Error interno del servidor'));
}

export async function dispatchRoute(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method?.toUpperCase();

  try {
    const route = ROUTE_TABLE[pathname];
    if (!route) {
      sendJson(res, 404, createErrorResponse(`Ruta no encontrada: ${pathname}`));
      return;
    }

    if (method !== route.method) {
      sendJson(res, 405, createErrorResponse(`Método no permitido. Use ${route.method}.`));
      return;
    }

    await route.handler(req, res);
  } catch (err: unknown) {
    handleRouteError(err, res);
  }
}
