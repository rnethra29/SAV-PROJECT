'use strict';

require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.cors.origin }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(env.apiPrefix, routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SAV ERP - Commercial Lifecycle Module API',
    docs: '/api-docs',
    api: env.apiPrefix,
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
