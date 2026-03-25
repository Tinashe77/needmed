export const storage = {
  get(key) {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
        return;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore local storage failures in private mode or restricted contexts
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
