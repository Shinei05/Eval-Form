import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/jwt.js";

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header and verifies it.
 * Attaches decoded payload to req.user.
 */
export function authenticate(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ success: false, error: "No token provided" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, jwtSecret);
		req.user = decoded;
		next();
	} catch (err) {
		return res
			.status(401)
			.json({ success: false, error: "Invalid or expired token" });
	}
}
