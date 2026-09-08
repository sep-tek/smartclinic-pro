const jwt = require("jsonwebtoken");
const pool = require("../db");

async function authenticate(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({
      message: "Authorization header is required.",
    });
  }

  const [scheme, token, ...extraParts] = authorizationHeader
    .trim()
    .split(/\s+/);

  if (
    scheme !== "Bearer" ||
    !token ||
    extraParts.length > 0
  ) {
    return res.status(401).json({
      message: "Authorization header must use Bearer token format.",
    });
  }

  try {
    const decodedUser = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decodedUser.id) {
      return res.status(401).json({
        message: "Invalid or expired token.",
      });
    }

    const userResult = await pool.query(
      `SELECT id, role, is_active
       FROM users
       WHERE id = $1`,
      [decodedUser.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: "User account no longer exists.",
      });
    }

    const user = userResult.rows[0];

    if (user.is_active === false) {
      return res.status(403).json({
        message: "Your account has been deactivated.",
      });
    }

    req.user = {
      ...decodedUser,
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token.",
      });
    }

    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      message: "Unable to authenticate request.",
    });
  }
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorizeRole,
};
