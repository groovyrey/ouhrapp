import { getSession, logout } from "./auth/index.js";
import { initNav } from "./nav.js";
import { initRouter } from "./router.js";

const root = document.querySelector("#main");

const session = getSession();
if (!session) {
  window.location.replace("login.html");
} else {
  const user = document.querySelector("#topbar-user");
  if (user) user.textContent = session.name;

  const menuButton = document.querySelector("#user-menu-button");
  const menu = document.querySelector("#user-menu");
  const signout = document.querySelector("#signout");

  if (menuButton && menu) {
    const setOpen = (open) => {
      menu.hidden = !open;
      menuButton.setAttribute("aria-expanded", String(open));
      if (open) signout?.focus();
    };

    menuButton.addEventListener("click", () => setOpen(menu.hidden));

    document.addEventListener("click", (event) => {
      if (menu.hidden) return;
      if (menu.contains(event.target) || menuButton.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || menu.hidden) return;
      setOpen(false);
      menuButton.focus();
    });
  }

  if (signout) {
    signout.addEventListener("click", () => {
      logout();
      window.location.replace("login.html");
    });
  }

  initNav();
  initRouter(root);
}
