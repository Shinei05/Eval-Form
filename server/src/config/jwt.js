const secret = process.env.JWT_SECRET?.trim();

if (!secret) {
	throw new Error("JWT_SECRET must be configured before starting the server");
}

export const jwtSecret = secret;
