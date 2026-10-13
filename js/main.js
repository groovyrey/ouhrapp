import { getSession, logout } from "./auth/index.js";
import { initNav } from "./nav.js";
import { initRouter } from "./router.js";
import { loginView } from "./views/login.js";

const root = document.querySelector("#main");

function mountApp(session) {
  document.body.classList.remove("auth-screen");

  const user = document.querySelector("#topbar-user");
  if (user) user.textContent = session.name;

  const signout = document.querySelector("#signout");
  if (signout) {
    signout.addEventListener("click", () => {
      logout();
      window.location.reload();
    });
  }

  initNav();
  initRouter(root);
}

function mountLogin() {
  document.body.classList.add("auth-screen");
  loginView(root, () => window.location.reload());
}

const session = getSession();
if (session) mountApp(session);
else mountLogin();
