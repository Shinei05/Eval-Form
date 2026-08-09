function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage
  }
  if (!globalThis._mockStorage) {
    const store = new Map()
    globalThis._mockStorage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, val) => store.set(key, String(val)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
    }
  }
  return globalThis._mockStorage
}

export const isAuthenticated = () => {
  const token = getStorage().getItem('token')
  return Boolean(token)
}

export const getToken = () => getStorage().getItem('token')

export const setToken = (token) => {
  getStorage().setItem('token', token)
}

export const removeToken = () => {
  getStorage().removeItem('token')
  getStorage().removeItem('userData')
}

export const getUserData = () => {
  const userData = getStorage().getItem('userData')
  return userData ? JSON.parse(userData) : null
}

export const setUserData = (data) => {
  getStorage().setItem('userData', JSON.stringify(data))
}
