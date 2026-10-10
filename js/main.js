import { initNav } from "./nav.js";
import { initRouter } from "./router.js";

const root = document.querySelector("#main");

initNav();
initRouter(root);
