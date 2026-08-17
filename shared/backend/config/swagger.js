'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const env = require('./env');

// The underlying `glob` dependency swagger-jsdoc uses expects forward-slash
// patterns even on Windows - path.join()'s backslashes silently match zero
// files there instead of erroring, so build these with posix.join on a
// forward-slash-normalized __dirname rather than path.join directly.
const posixDirname = __dirname.split(path.sep).join('/');
function apiGlob(...segments) {
  return path.posix.join(posixDirname, ...segments);
}

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SAV ERP API',
      version: '1.0.0',
      description:
        '01 Commercial Lifecycle (RFQ -> Estimation -> Market/Actual Price -> Quotation -> Negotiation -> BOQ -> PO) + ' +
        '02 Site (Client Management, Vendor Management & Procurement) + shared Documents/Approvals/Audit/RBAC. ' +
        'See shared/backend/docs/api.md for the full endpoint reference.',
    },
    servers: [{ url: `${env.apiPrefix}`, description: 'Current environment' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Route files carrying @openapi JSDoc tags now live under each module's own
  // folder (module-based reorg) instead of one flat routes/ directory.
  apis: [
    apiGlob('../routes/*.js'),
    apiGlob('../documents-approvals-audit/routes/*.js'),
    apiGlob('../../rbac/backend/routes/*.js'),
    apiGlob('../../../01-commercial-lifecycle/backend/**/*.routes.js'),
    apiGlob('../../../02-site/01-client-management/backend/routes/*.js'),
    apiGlob('../../../02-site/02-vendor-management/backend/routes/*.js'),
  ],
};

module.exports = swaggerJsdoc(options);
