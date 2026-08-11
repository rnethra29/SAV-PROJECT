'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SAV ERP - Commercial Lifecycle Module API',
      version: '1.0.0',
      description:
        'RFQ -> Estimation -> Market Price Analysis -> Actual vs Quoted -> Profit Analysis -> ' +
        'Quotation -> Client Offer/Negotiation -> BOQ -> Purchase Order. ' +
        'See /src/docs/api.md for the full endpoint reference.',
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
  apis: [path.join(__dirname, '../routes/*.js')],
};

module.exports = swaggerJsdoc(options);
