export function getUser() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem("token");
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  window.location.href = "/caja/";
}

export function requireAuth() {
  if (typeof window === "undefined") return;
  if (!getUser()) window.location.href = "/caja/";
}
