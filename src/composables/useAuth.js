import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
	getToken,
	removeToken,
	getUserData,
	setToken,
	setUserData,
} from "../utils/auth";

/**
 * Composable for authentication state and actions.
 */
export function useAuth() {
	const router = useRouter();

	// Reactive backing refs — localStorage is not trackable by Vue
	const _token = ref(getToken());
	const _userData = ref(getUserData());

	const token = computed(() => _token.value);
	const userData = computed(() => _userData.value);
	const isLoggedIn = computed(() => !!_token.value);

	function login(tokenValue, userDataValue) {
		setToken(tokenValue);
		if (userDataValue) setUserData(userDataValue);
		_token.value = tokenValue;
		_userData.value = userDataValue;
	}

	function logout() {
		removeToken();
		_token.value = null;
		_userData.value = null;
		router.replace("/");
	}

	function requireAuth() {
		if (!getToken()) {
			router.replace("/");
			return false;
		}
		return true;
	}

	return { token, userData, isLoggedIn, login, logout, requireAuth };
}
