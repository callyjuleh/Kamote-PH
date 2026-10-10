require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`[roadwise-api] listening on http://localhost:${port}`);
});
