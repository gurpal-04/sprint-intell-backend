const app = require("./app");

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Sprint Intelligence Agent Server listening on PORT ${PORT}`);
  console.log(`   Healthcheck: http://localhost:${PORT}/`);
  console.log(`====================================================`);
});
