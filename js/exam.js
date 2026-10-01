const EXAM_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const email = Session.get();
const user = email ? Users.findByEmail(email) : null;

if (!email || !user) {
  Session.clear();
  window.location.replace("login.html");
  throw new Error("No active session — redirecting to sign in.");
}

document.getElementById(
  "student-name"
).textContent = `${user.firstName} ${user.lastName}`;

// A result already on file means this student shouldn't be re-sitting
// the exam — send them to their grade instead.
const existingResult = Results.latestForEmail(email);
if (existingResult) {
  sessionStorage.setItem("cc_last_result", JSON.stringify(existingResult));
  window.location.replace(
    existingResult.status === "timeout" ? "timeout.html" : "grades.html"
  );
  throw new Error("Exam already completed — redirecting to results.");
}

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let questions = []; // array of Question objects, in original (id) order
let state = null;
let timerHandle = null;

// --- fetch the question bank via AJAX and build the Question array ---
fetch("data/questions.json")
  .then((res) => {
    if (!res.ok) throw new Error("Could not load questions.json");
    return res.json();
  })
  .then((data) => {
    questions = data; // array of Question Objects {id, question, choices, answer}
    initExamState();
    render();
    timerHandle = setInterval(tick, 1000);
    tick();
  })
  .catch((err) => {
    document.getElementById("exam-progress").textContent =
      "Couldn't load the exam questions. Please refresh the page.";
    console.error(err);
  });

function initExamState() {
  const saved = ExamState.get(email);
  if (saved) {
    state = saved;
    return;
  }
  state = {
    order: shuffle(questions.map((q) => q.id)),
    answers: {}, // { [questionId]: choiceIndex }
    marked: [], // [questionId]
    currentIndex: 0,
    startTime: Date.now(),
    duration: EXAM_DURATION_MS,
  };
  ExamState.set(email, state);
}

function questionById(id) {
  return questions.find((q) => q.id === id);
}

function saveState() {
  ExamState.set(email, state);
}

// ---------------- rendering ----------------

function render() {
  document.getElementById("exam-grid").hidden = false;

  const total = state.order.length;
  const idx = state.currentIndex;
  const qid = state.order[idx];
  const q = questionById(qid);

  document.getElementById(
    "exam-progress"
  ).textContent = `Question ${idx + 1} of ${total} · ${
    Object.keys(state.answers).length
  } answered`;
  document.getElementById("question-number").textContent = `Question ${
    idx + 1
  }`;
  document.getElementById("question-text").textContent = q.question;
  document.getElementById("qnum-chip").textContent = idx + 1;

  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";
  q.choices.forEach((choiceText, choiceIndex) => {
    const selected = state.answers[qid] === choiceIndex;
    const label = document.createElement("label");
    label.className = "choice" + (selected ? " selected" : "");
    label.innerHTML = `
      <input type="radio" name="choice" ${selected ? "checked" : ""}>
      <span>${choiceText}</span>
    `;
    label.addEventListener("click", () => {
      state.answers[qid] = choiceIndex;
      saveState();
      render();
    });
    choicesEl.appendChild(label);
  });

  document.getElementById("prev-btn").disabled = idx === 0;
  document.getElementById("next-btn").disabled = idx === total - 1;

  const markBtn = document.getElementById("mark-btn");
  const isMarked = state.marked.includes(qid);
  markBtn.textContent = isMarked ? "Unmark" : "Mark";
  markBtn.style.borderColor = isMarked ? "var(--amber)" : "";
  markBtn.style.color = isMarked ? "var(--amber-soft)" : "";

  renderMarkList();
  renderJumpGrid();
}

function renderMarkList() {
  const el = document.getElementById("mark-list");
  if (state.marked.length === 0) {
    el.innerHTML = '<p class="mark-empty">Nothing marked yet.</p>';
    return;
  }
  el.innerHTML = "";
  state.marked.forEach((qid) => {
    const position = state.order.indexOf(qid) + 1;
    const chip = document.createElement("button");
    chip.className = "mark-chip";
    chip.textContent = `Marked — Question ${position}`;
    chip.addEventListener("click", () => {
      state.currentIndex = state.order.indexOf(qid);
      render();
    });
    el.appendChild(chip);
  });
}

function renderJumpGrid() {
  const el = document.getElementById("jump-grid");
  el.innerHTML = "";
  state.order.forEach((qid, i) => {
    const btn = document.createElement("button");
    btn.className = "jump-dot";
    if (i === state.currentIndex) btn.classList.add("current");
    else if (state.marked.includes(qid)) btn.classList.add("marked");
    else if (state.answers[qid] !== undefined) btn.classList.add("answered");
    btn.textContent = i + 1;
    btn.addEventListener("click", () => {
      state.currentIndex = i;
      render();
    });
    el.appendChild(btn);
  });
}

// ---------------- navigation ----------------

document.getElementById("prev-btn").addEventListener("click", () => {
  if (state.currentIndex > 0) {
    state.currentIndex -= 1;
    saveState();
    render();
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  if (state.currentIndex < state.order.length - 1) {
    state.currentIndex += 1;
    saveState();
    render();
  }
});

document.getElementById("mark-btn").addEventListener("click", () => {
  const qid = state.order[state.currentIndex];
  const pos = state.marked.indexOf(qid);
  if (pos === -1) state.marked.push(qid);
  else state.marked.splice(pos, 1);
  saveState();
  render();
});

document.getElementById("submit-btn").addEventListener("click", () => {
  finishExam("submitted");
});

// ---------------- timer ----------------

function tick() {
  const elapsed = Date.now() - state.startTime;
  const remaining = state.duration - elapsed;

  if (remaining <= 0) {
    finishExam("timeout");
    return;
  }

  const totalSeconds = Math.ceil(remaining / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  document.getElementById("timer-text").textContent = `${mm}:${ss}`;

  const pct = Math.max(0, (remaining / state.duration) * 100);
  const ring = document.getElementById("timer-ring");
  ring.style.setProperty("--pct", pct.toFixed(1));
  ring.classList.toggle("low", pct < 20);
}

// ---------------- grading / finish ----------------

function scoreExam() {
  let correct = 0;
  state.order.forEach((qid) => {
    const q = questionById(qid);
    if (state.answers[qid] === q.answer) correct += 1;
  });
  return { correct, total: state.order.length };
}

function finishExam(status) {
  if (timerHandle) clearInterval(timerHandle);

  const { correct, total } = scoreExam();
  const result = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    score: correct,
    total,
    status, // "submitted" | "timeout"
    date: new Date().toISOString(),
  };

  Results.save(result);
  ExamState.clear(email);
  sessionStorage.setItem("cc_last_result", JSON.stringify(result));

  window.location.replace(status === "timeout" ? "timeout.html" : "grades.html");
}
