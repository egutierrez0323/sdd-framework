#!/usr/bin/env node

import { createCardServer } from '../server.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = createCardServer();

server.listen(PORT, HOST, () => {
  console.log(`🚀 Card Validator REST API escuchando en http://${HOST}:${PORT}`);
  console.log(`   • GET  /health`);
  console.log(`   • POST /api/v1/cards/validate`);
  console.log(`   • POST /api/v1/cards/luhn`);
  console.log(`   • POST /api/v1/cards/brand`);
});
