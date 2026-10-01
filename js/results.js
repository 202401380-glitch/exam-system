function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function render() {
  const users = Users.all();
  const results = Results.all();

  document.getElementById(
    "summary-line"
  ).textContent = `${users.length} registered · ${results.length} exam attempt${
    results.length === 1 ? "" : "s"
  }`;

  const slot = document.getElementById("table-slot");

  if (results.length === 0) {
    slot.innerHTML = `<div class="empty-state">No exam attempts recorded yet on this browser.</div>`;
    return;
  }

  const rows = results
    .slice()
    .reverse()
    .map((r) => {
      const pct = Math.round((r.score / r.total) * 100);
      return `
        <tr>
          <td>${r.firstName} ${r.lastName}</td>
          <td>${r.email}</td>
          <td>${r.score} / ${r.total} (${pct}%)</td>
          <td><span class="status-pill ${r.status}">${
        r.status === "timeout" ? "timed out" : "submitted"
      }</span></td>
          <td>${formatDate(r.date)}</td>
        </tr>
      `;
    })
    .join("");

  slot.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Email</th>
          <th>Score</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("This clears every registered user and exam result stored in this browser. Continue?")) {
    resetAllData();
    render();
  }
});

render();
