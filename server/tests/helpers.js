/**
 * Reusable mock helpers for controller tests.
 * Creates Express-compatible req/res mocks.
 */

/**
 * Build a mock Express request object.
 */
export function mockReq(overrides = {}) {
	return {
		body: {},
		headers: {},
		params: {},
		query: {},
		file: null,
		user: null,
		...overrides,
	};
}

/**
 * Build a mock Express response object that tracks calls.
 */
export function mockRes() {
	const res = {
		_status: 200,
		_json: null,
		_sent: null,
		_headers: {},
	};

	res.status = vi.fn((code) => {
		res._status = code;
		return res;
	});

	res.json = vi.fn((data) => {
		res._json = data;
		return res;
	});

	res.send = vi.fn((data) => {
		res._sent = data;
		return res;
	});

	res.setHeader = vi.fn((key, value) => {
		res._headers[key] = value;
		return res;
	});

	return res;
}
