const form = document.getElementById("login-form");
const bannerSlot = document.getElementById("banner-slot");

function showBanner(message, type = "error") {
  bannerSlot.innerHTML = `<div class="banner ${type}">${message}</div>`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showBanner("Enter both your email and password.");
    return;
  }

  const user = Users.findByEmail(email);

  if (!user || user.password !== password) {
    showBanner("That email and password don't match our records.");
    return;
  }

  Session.set(user.email);

  // If this student already has a result on file, don't let them retake
  // the exam — send them straight to their existing grade.
  const existing = Results.latestForEmail(user.email);
  if (existing) {
    sessionStorage.setItem("cc_last_result", JSON.stringify(existing));
    window.location.replace(
      existing.status === "timeout" ? "timeout.html" : "grades.html"
    );
    return;
  }

  window.location.replace("exam.html");
});
