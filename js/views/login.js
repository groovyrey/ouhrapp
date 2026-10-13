import { authenticate } from "../auth/index.js";

export function loginView(root, onSuccess) {
  root.innerHTML = `
    <form class="login" id="login-form" novalidate>
      <h1 class="login__title">Sign in</h1>
      <label class="field">Username
        <input class="input" name="username" autocomplete="username" autofocus required />
      </label>
      <label class="field">Password
        <input class="input" type="password" name="password" autocomplete="current-password" required />
      </label>
      <p class="login__error" hidden>Wrong username or password.</p>
      <button class="btn btn--primary login__submit" type="submit">Sign in</button>
    </form>`;

  const form = root.querySelector("#login-form");
  const error = root.querySelector(".login__error");
  const password = form.querySelector("input[name=password]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const session = authenticate(data.username, data.password);
    if (!session) {
      error.hidden = false;
      password.value = "";
      password.focus();
      return;
    }
    onSuccess(session);
  });
}
