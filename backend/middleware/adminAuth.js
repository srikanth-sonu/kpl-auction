module.exports = function adminAuth(req, res, next) {
  const username = req.headers.username;
  const password = req.headers.password;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
};
