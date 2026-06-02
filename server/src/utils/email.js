import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.gmail.com",
	port: Number(process.env.SMTP_PORT) || 465,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

/**
 * Send an email via SMTP.
 * @param {string|string[]} to - Recipient email(s)
 * @param {string} html       - HTML body
 * @param {string} text       - Plain-text fallback
 * @returns {Promise<boolean>}
 */
export async function sendEmail(to, html, text) {
	try {
		await transporter.sendMail({
			from: `"School AutoMailer" <${process.env.SMTP_USER}>`,
			to: Array.isArray(to) ? to.join(", ") : to,
			subject: "AutoMailer Service",
			html,
			text,
		});
		return true;
	} catch (err) {
		console.error("[SMTP ERROR]", err.message);
		return false;
	}
}
