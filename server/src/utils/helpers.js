import crypto from "crypto";

/**
 * Generate a random alphanumeric string of length n.
 */
export function getRandomString(n = 10) {
	const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let result = "";
	const bytes = crypto.randomBytes(n);
	for (let i = 0; i < n; i++) {
		result += chars[bytes[i] % chars.length];
	}
	return result;
}

/**
 * Compute sentiment label from average score.
 */
export function getSentiment(average) {
	if (average < 1.5) return "Very Poor";
	if (average < 2.5) return "Poor";
	if (average < 3.5) return "Average";
	if (average < 4.5) return "Good";
	if (average <= 5) return "Very Good";
	return "Out of range";
}
