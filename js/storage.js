/* storage.js
   Every "table" this project would normally keep in a backend database
   is kept here instead, in the browser's localStorage. Everything is
   scoped to this one browser/device — see the README for why. */

const DB = {
  USERS: "cc_users",
  RESULTS: "cc_results",
  SESSION: "cc_session",
  REGISTERED_FLAG: "cc_has_registered",
  EXAM_STATE: "cc_exam_state",
};

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Corrupt data for", key, e);
    return [];
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

const Users = {
  all() {
    return readList(DB.USERS);
  },
  save(user) {
    const users = Users.all();
    users.push(user);
    writeList(DB.USERS, users);
  },
  findByEmail(email) {
    return Users.all().find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  },
};

const Results = {
  all() {
    return readList(DB.RESULTS);
  },
  save(result) {
    const results = Results.all();
    results.push(result);
    writeList(DB.RESULTS, results);
  },
  latestForEmail(email) {
    const mine = Results.all().filter(
      (r) => r.email.toLowerCase() === email.toLowerCase()
    );
    return mine.length ? mine[mine.length - 1] : null;
  },
};

const Session = {
  set(email) {
    localStorage.setItem(DB.SESSION, email);
  },
  get() {
    return localStorage.getItem(DB.SESSION);
  },
  clear() {
    localStorage.removeItem(DB.SESSION);
  },
};

const ExamState = {
  key(email) {
    return `${DB.EXAM_STATE}_${email.toLowerCase()}`;
  },
  get(email) {
    const raw = localStorage.getItem(ExamState.key(email));
    return raw ? JSON.parse(raw) : null;
  },
  set(email, state) {
    localStorage.setItem(ExamState.key(email), JSON.stringify(state));
  },
  clear(email) {
    localStorage.removeItem(ExamState.key(email));
  },
};

function markRegistered() {
  localStorage.setItem(DB.REGISTERED_FLAG, "true");
}

function hasRegisteredBefore() {
  return localStorage.getItem(DB.REGISTERED_FLAG) === "true";
}

/* Dev/demo utility — wipes every trace of this project from the browser. */
function resetAllData() {
  Object.values(DB).forEach((k) => {
    if (k === DB.EXAM_STATE) {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(DB.EXAM_STATE))
        .forEach((key) => localStorage.removeItem(key));
    } else {
      localStorage.removeItem(k);
    }
  });
}
