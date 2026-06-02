/**
 * Global error handler middleware.
 * Catches unhandled errors and returns a standardised JSON response.
 */
export function errorHandler(err, _req, res, _next) {
	console.error("[ERROR]", err.stack || err);

	const statusCode = err.statusCode || 500;
	res.status(statusCode).json({
		success: false,
		error:
			process.env.NODE_ENV === "production"
				? "Internal server error"
				: err.message,
	});
}
