const { CognitoJwtVerifier } = require("aws-jwt-verify");

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

const verifier = userPoolId && clientId
  ? CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: "access",
      clientId
    })
  : null;

async function optionalAuth(req, _res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !verifier) return next();

  try {
    req.user = await verifier.verify(token);
  } catch {
    req.user = null;
  }
  return next();
}

async function requireAuth(req, res, next) {
  if (!verifier) {
    return res.status(503).json({ error: "Cognito is not configured on this server" });
  }

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Missing Cognito access token" });
  }

  try {
    req.user = await verifier.verify(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired Cognito token" });
  }
}

module.exports = {
  optionalAuth,
  requireAuth
};
