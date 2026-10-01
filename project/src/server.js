'use strict';
const { createApp } = require('./app');
const { NAMES } = require('./flags');

const port = parseInt(process.env.PORT || '4000', 10);
const app = createApp({ dbPath: process.env.DB_PATH });

app.listen(port, () => {
  console.log(`Clinic Task Board listening on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api/docs  OpenAPI: http://localhost:${port}/api/v1/openapi.json`);
  const active = NAMES.filter((n) => app.locals.flags[n]);
  console.log(active.length ? `ACTIVE DEFECT FLAGS: ${active.join(', ')}` : 'Defect flags: none active (all OFF)');
});
