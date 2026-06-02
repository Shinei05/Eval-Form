import { ref } from "vue";
import { getToken } from "../utils/auth";

/**
 * Composable for making authenticated API calls with loading/error state.
 */
export function useApi() {
	const isLoading = ref(false);
	const error = ref(null);

	/**
	 * Make an API request with automatic auth headers and error handling.
	 * @param {string} url - API endpoint URL
	 * @param {object} options - Fetch options (body, method, etc.)
	 * @returns {Promise<object>} Parsed JSON response
	 */
	async function request(
		url,
		{ method = "POST", body = null, auth = true } = {},
	) {
		isLoading.value = true;
		error.value = null;

		try {
			const headers = { "Content-Type": "application/json" };

			if (auth) {
				const token = getToken();
				if (token) {
					headers["Authorization"] = `Bearer ${token}`;
				}
			}

			const fetchOptions = { method, headers };
			if (body) {
				fetchOptions.body = JSON.stringify(body);
			}

			const response = await fetch(url, fetchOptions);
			const result = await response.json();

			if (!result.success) {
				error.value =
					result.error || result.message || "Request failed";
			}

			return result;
		} catch (err) {
			error.value = err.message || "Network error. Please try again.";
			console.error(`API Error [${url}]:`, err);
			return { success: false, error: error.value };
		} finally {
			isLoading.value = false;
		}
	}

	return { isLoading, error, request };
}
