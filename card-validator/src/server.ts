import http, { Server } from 'node:http';
import { dispatchRoute } from './api/router.js';

/**
 * Crea una instancia desacoplada del servidor HTTP para el validador de tarjetas.
 *
 * @returns Instancia de http.Server configurada con el router REST
 */
export function createCardServer(): Server {
  return http.createServer((req, res) => {
    void dispatchRoute(req, res);
  });
}
