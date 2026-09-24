/**
 * Default timeout for standard API requests (20 seconds).
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 20000;

/**
 * Custom error class representing network timeout errors.
 */
export class TimeoutError extends Error {
	constructor(
		message = "Request timed out. Please check your network connection and try again.",
	) {
		super(message);
		this.name = "TimeoutError";
		this.isTimeout = true;
	}
}

/**
 * Fetch wrapper that adds configurable timeout and AbortSignal support.
 *
 * @param {string} url - The URL to fetch.
 * @param {RequestInit & { timeout?: number }} [options={}] - Fetch options with optional timeout in milliseconds.
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}) {
	const {
		timeout = DEFAULT_REQUEST_TIMEOUT_MS,
		signal: externalSignal,
		...fetchOptions
	} = options;

	const controller = new AbortController();
	let isTimeoutTriggered = false;
	let removeExternalListener = null;

	// Link external signal if provided
	if (externalSignal) {
		if (externalSignal.aborted) {
			controller.abort(externalSignal.reason);
		} else {
			const onExternalAbort = () => {
				controller.abort(externalSignal.reason);
			};
			externalSignal.addEventListener("abort", onExternalAbort);
			removeExternalListener = () => {
				externalSignal.removeEventListener("abort", onExternalAbort);
			};
		}
	}

	let timeoutId = null;
	if (timeout && timeout > 0 && timeout !== Infinity) {
		timeoutId = setTimeout(() => {
			isTimeoutTriggered = true;
			controller.abort(
				new TimeoutError(
					`Request timed out after ${Math.round(timeout / 1000)} seconds. Please check your network connection and try again.`,
				),
			);
		}, timeout);
	}

	try {
		const response = await fetch(url, {
			...fetchOptions,
			signal: controller.signal,
		});
		return response;
	} catch (err) {
		if (
			isTimeoutTriggered ||
			err instanceof TimeoutError ||
			err?.name === "TimeoutError" ||
			(err?.name === "AbortError" && isTimeoutTriggered)
		) {
			throw new TimeoutError(
				`Request timed out after ${Math.round(timeout / 1000)} seconds. Please check your network connection and try again.`,
			);
		}
		throw err;
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		if (removeExternalListener) {
			removeExternalListener();
		}
	}
}
