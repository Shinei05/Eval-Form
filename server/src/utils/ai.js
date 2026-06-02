import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

function getClient() {
	if (!genAI) {
		genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
	}
	return genAI;
}

/**
 * Summarise evaluation data using Google Gemini.
 * @param {string} feedback   – Concatenated feedback text
 * @param {string} questions  – Concatenated question text
 * @param {string} answers    – Concatenated answer/score text
 * @returns {Promise<string>}
 */
export async function aiSummarize(feedback, questions, answers) {
	try {
		const model = getClient().getGenerativeModel({
			model: "gemini-2.0-flash",
		});

		const prompt =
			`Give me a summary of this evaluation. Here is the feedback: ${feedback}. ` +
			`Here are the questions: ${questions}. Here are the answers: ${answers}. ` +
			`Give a brief but detailed comment regarding this evaluation.`;

		const result = await model.generateContent(prompt);
		return result.response.text();
	} catch (err) {
		console.error("[AI ERROR]", err.message);
		throw err;
	}
}
