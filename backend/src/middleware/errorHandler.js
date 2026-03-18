export function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);

  const status = Number(err?.status || 500);
  const message = err?.message || "Internal Server Error";
  res.status(status).json({ error: message });
}

