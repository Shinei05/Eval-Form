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

/**
 * Given a schedule row from the DB, return the currently active period number (1-4),
 * or 0 if no period is currently active.
 * @param {object} schedule - A row from the schedules table
 * @returns {number} Active period (1-4) or 0
 */
export function getCurrentPeriod(schedule) {
	if (!schedule) return 0;
	const now = new Date();
	for (let i = 1; i <= 4; i++) {
		const dateStart = schedule[`p${i}_date_start`];
		const timeStart = schedule[`p${i}_time_start`];
		const dateEnd = schedule[`p${i}_date_end`];
		const timeEnd = schedule[`p${i}_time_end`];
		if (!dateStart || !timeStart || !dateEnd || !timeEnd) continue;
		const startDate = new Date(`${dateStart}T${timeStart}`);
		const endDate = new Date(`${dateEnd}T${timeEnd}`);
		if (now >= startDate && now <= endDate) return i;
	}
	return 0;
}
