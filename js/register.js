const NAME_RE = /^[A-Za-z]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Requirement: "After registration, the user cannot navigate to this
   page again." Once a registration has completed successfully on this
   browser, we redirect this page straight to sign in from then on. */
if (hasRegisteredBefore()) {
  window.location.replace("login.html");
}

const form = document.getElementById("register-form");
const bannerSlot = document.getElementById("banner-slot");

function showFieldError(id, show) {
  const input = document.getElementById(id);
  const error = document.getElementById(`${id}-error`);
  input.classList.toggle("invalid", show);
  error.hidden = !show;
}

function showBanner(message, type = "error") {
  bannerSlot.innerHTML = `<div class="banner ${type}">${message}</div>`;
}

function clearBanner() {
  bannerSlot.innerHTML = "";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearBanner();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  let valid = true;

  const firstNameOk = NAME_RE.test(firstName);
  showFieldError("firstName", !firstNameOk);
  valid = valid && firstNameOk;

  const lastNameOk = NAME_RE.test(lastName);
  showFieldError("lastName", !lastNameOk);
  valid = valid && lastNameOk;

  const emailOk = EMAIL_RE.test(email);
  showFieldError("email", !emailOk);
  valid = valid && emailOk;

  const passwordOk = password.length >= 8;
  showFieldError("password", !passwordOk);
  valid = valid && passwordOk;

  const matchOk = password === confirmPassword && confirmPassword.length > 0;
  showFieldError("confirmPassword", !matchOk);
  valid = valid && matchOk;

  if (!valid) return;

  if (Users.findByEmail(email)) {
    showBanner("That email is already registered. Try signing in instead.");
    return;
  }

  Users.save({ firstName, lastName, email, password });
  markRegistered();

  showBanner(`Welcome, ${firstName}! Redirecting you to sign in…`, "info");
  form.querySelector("button").disabled = true;
  setTimeout(() => window.location.replace("login.html"), 900);
});
