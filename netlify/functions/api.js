import serverless from 'serverless-http';
import app from '../../server/src/server.js';

export const handler = serverless(app);
