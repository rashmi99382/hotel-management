require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const db = require("./db");
const { optionalAuth, requireAuth } = require("./auth");
const { createUploadUrl } = require("./s3");

const app = express();
const port = Number(process.env.PORT || 8080);
const publicRoot = path.resolve(__dirname, "..");
const stateJsonLimit = process.env.STATE_JSON_LIMIT || "25mb";

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: stateJsonLimit }));
app.use(morgan("combined"));
app.use(optionalAuth);

app.get("/health", async (_req, res) => {
  res.json({
    status: "ok",
    database: await db.health(),
    s3: Boolean(process.env.S3_UPLOAD_BUCKET),
    cognito: Boolean(process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID)
  });
});

app.post("/api/uploads/presign", requireAuth, async (req, res, next) => {
  try {
    const { tenantId, folder, fileName, contentType } = req.body;
    if (!fileName) return res.status(400).json({ error: "fileName is required" });
    res.json(await createUploadUrl({ tenantId, folder, fileName, contentType }));
  } catch (error) {
    next(error);
  }
});

app.get("/api/tenants/:tenantId/state/:moduleName", requireAuth, async (req, res, next) => {
  try {
    const { tenantId, moduleName } = req.params;
    const result = await db.query(
      "select data from tenant_module_state where tenant_id = $1 and module_name = $2",
      [tenantId, moduleName]
    );
    res.json(result.rows[0]?.data || {});
  } catch (error) {
    next(error);
  }
});

app.put("/api/tenants/:tenantId/state/:moduleName", requireAuth, async (req, res, next) => {
  try {
    const { tenantId, moduleName } = req.params;
    const data = req.body || {};
    const result = await db.query(
      `insert into tenant_module_state (tenant_id, module_name, data, updated_by)
       values ($1, $2, $3, $4)
       on conflict (tenant_id, module_name)
       do update set data = excluded.data, updated_by = excluded.updated_by, updated_at = now()
       returning *`,
      [tenantId, moduleName, data, req.user?.sub || "system"]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/tenants/:tenantId/state/:moduleName", requireAuth, async (req, res, next) => {
  try {
    const { tenantId, moduleName } = req.params;
    await db.query(
      "delete from tenant_module_state where tenant_id = $1 and module_name = $2",
      [tenantId, moduleName]
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/qr/:tenantId", async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const result = await db.query(
      "select data from tenant_module_state where tenant_id = $1 and module_name = 'qr-menu'",
      [tenantId]
    );
    res.json(result.rows[0]?.data || {});
  } catch (error) {
    next(error);
  }
});

app.use(express.static(publicRoot, {
  extensions: ["html"]
}));

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicRoot, "index.html"));
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({
    error: error.message || "Server error"
  });
});

app.listen(port, () => {
  console.log(`Smart Hotel Platform running on port ${port}`);
});
