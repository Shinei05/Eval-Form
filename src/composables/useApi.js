import { ref } from "vue";
import { getToken } from "../utils/auth";
import {
	fetchWithTimeout,
	DEFAULT_REQUEST_TIMEOUT_MS,
	TimeoutError,
} from "../utils/fetchWithTimeout";

/**
 * Composable for making authenticated API calls with loading/error state and timeout handling.
 */
export function useApi() {
	const isLoading = ref(false);
	const error = ref(null);

	/**
	 * Make an API request with automatic auth headers, timeout, and error handling.
	 * @param {string} url - API endpoint URL
	 * @param {object} options - Fetch options (body, method, timeout, signal, headers, etc.)
	 * @returns {Promise<object>} Parsed JSON response
	 */
	async function request(
		url,
		{
			method = "POST",
			body = null,
			auth = true,
			timeout = DEFAULT_REQUEST_TIMEOUT_MS,
			signal = null,
			headers: customHeaders = {},
		} = {},
	) {
		isLoading.value = true;
		error.value = null;

		try {
			const headers = {
				"Content-Type": "application/json",
				...customHeaders,
			};

			if (auth) {
				const token = getToken();
				if (token) {
					headers["Authorization"] = `Bearer ${token}`;
				}
			}

			const fetchOptions = {
				method,
				headers,
				timeout,
				signal,
			};

			if (body) {
				fetchOptions.body = JSON.stringify(body);
			}

			const response = await fetchWithTimeout(url, fetchOptions);
			const result = await response.json();

			if (!result.success) {
				error.value =
					result.error || result.message || "Request failed";
			}

			return result;
		} catch (err) {
			if (
				err instanceof TimeoutError ||
				err?.name === "TimeoutError" ||
				err?.isTimeout
			) {
				error.value =
					err.message ||
					"Request timed out. Please check your network connection and try again.";
			} else {
				error.value = err.message || "Network error. Please try again.";
			}
			console.error(`API Error [${url}]:`, err);
			return { success: false, error: error.value };
		} finally {
			isLoading.value = false;
		}
	}

	return { isLoading, error, request };
}

