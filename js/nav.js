const MOBILE_QUERY = "(max-width: 900px)";

export function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const sidebar = document.querySelector("#sidebar");
  const scrim = document.querySelector(".nav-scrim");
  const pill = document.querySelector(".topbar__user");
  const slot = document.querySelector("#sidebar-user");
  const signout = document.querySelector("#signout");

  if (!toggle || !sidebar || !scrim) return;

  const mobile = window.matchMedia(MOBILE_QUERY);
  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
  const focusables = () => [...sidebar.querySelectorAll("a[href]"), toggle];

  const open = () => {
    if (isOpen()) return;
    sidebar.classList.add("is-open");
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => scrim.classList.add("is-visible"));
    sidebar.querySelector("a[href]")?.focus();
  };

  const close = ({ restoreFocus = false } = {}) => {
    if (!isOpen()) return;
    sidebar.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    scrim.classList.remove("is-visible");
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    isOpen() ? close({ restoreFocus: true }) : open();
  });

  scrim.addEventListener("click", () => close({ restoreFocus: true }));

  sidebar.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;

    if (event.key === "Escape") {
      close({ restoreFocus: true });
      return;
    }

    if (event.key !== "Tab") return;

    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  mobile.addEventListener("change", (event) => {
    placeUser();
    if (!event.matches) close();
  });

  placeUser();
  highlight();
  document.addEventListener("route:change", highlight);

  function placeUser() {
    if (!pill || !slot || !signout) return;
    if (mobile.matches) {
      if (pill.parentElement !== slot) slot.append(pill);
      if (signout.parentElement !== slot) slot.append(signout);
    } else {
      if (signout.parentElement !== document.querySelector(".topbar__inner")) {
        document.querySelector(".topbar__inner")?.append(signout);
      }
      if (signout.previousElementSibling !== pill) {
        signout.before(pill);
      }
    }
  }

  function highlight() {
    const key = window.location.hash.replace(/^#\/?/, "") || "dashboard";
    sidebar.querySelectorAll(".sidebar__link").forEach((link) => {
      const target = link.getAttribute("href").replace(/^#\/?/, "") || "dashboard";
      link.classList.toggle("is-active", target === key);
    });
  }
}
