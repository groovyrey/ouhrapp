const STORAGE_KEY = "ouhrapp:session:v1";

const ACCOUNTS = [
  { username: "admin", password: "admin123", name: "HR admin", role: "Administrator" },
];

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function authenticate(username, password) {
  const account = ACCOUNTS.find((a) => a.username === username && a.password === password);
  if (!account) return null;
  const session = {
    username: account.username,
    name: account.name,
    role: account.role,
    startedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn("ouhrapp: failed to store session", error);
  }
  return session;
}

export function getRole() {
  return getSession()?.role ?? null;
}

export function logout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("ouhrapp: failed to clear session", error);
  }
}
