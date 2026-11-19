"use strict";

const $ = (s) => document.querySelector(s),
  key = "daylight-tasks";
const form = $("#add-form"),
  input = $("#task-input"),
  list = $("#task-list");
const empty = $("#empty-state"),
  count = $("#remaining-count"),
  label = $("#remaining-label");
const clear = $("#clear-completed"),
  notice = $("#announcements"),
  filters = [...document.querySelectorAll(".filter-button")];
const fill = $("#progress-fill"),
  track = $(".progress-track"),
  percentLabel = $("#progress-label");
let tasks = load(),
  filter = "all";

$("#today-label").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data)
      ? data.filter(
          (t) =>
            t &&
            typeof t.id === "string" &&
            typeof t.text === "string" &&
            typeof t.completed === "boolean",
        )
      : [];
  } catch {
    return [];
  }
}
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(tasks));
  } catch {
    notice.textContent = "Your changes could not be saved on this device.";
  }
}
function announce(message) {
  notice.textContent = message;
}
function button(className, label, title, handler) {
  const el = document.createElement("button");
  el.className = className;
  el.type = "button";
  el.setAttribute("aria-label", label);
  el.title = title;
  el.onclick = handler;
  return el;
}
function taskRow(task) {
  const row = document.createElement("li");
  row.className = `task-row${task.completed ? " is-completed" : ""}`;
  row.dataset.id = task.id;
  const check = button(
    "task-check",
    `${task.completed ? "Mark as not done" : "Complete"}: ${task.text}`,
    "",
    () => toggle(task.id),
  );
  check.setAttribute("aria-pressed", task.completed);
  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;
  const actions = document.createElement("div");
  actions.className = "task-actions";
  const edit = button("icon-button", `Edit ${task.text}`, "Edit task", () =>
    editTask(row, task),
  );
  edit.textContent = "\u270e";
  const remove = button(
    "icon-button delete-button",
    `Delete ${task.text}`,
    "Delete task",
    () => removeTask(task.id),
  );
  remove.textContent = "\u00d7";
  actions.append(edit, remove);
  row.append(check, text, actions);
  return row;
}
function render() {
  const visible = tasks.filter(
    (t) =>
      filter === "all" || (filter === "active" ? !t.completed : t.completed),
  );
  const left = tasks.filter((t) => !t.completed).length,
    done = tasks.length - left,
    progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  count.textContent = left;
  label.textContent = left === 1 ? "thing left to do" : "things left to do";
  fill.style.width = `${progress}%`;
  track.setAttribute("aria-valuenow", progress);
  percentLabel.textContent = `${progress}% complete`;
  list.replaceChildren(...visible.map(taskRow));
  empty.hidden = visible.length > 0;
  clear.hidden = !done;
  filters.forEach((el) => {
    const active = el.dataset.filter === filter;
    el.classList.toggle("is-active", active);
    el.setAttribute("aria-pressed", active);
  });
}
function add(text) {
  tasks.unshift({ id: crypto.randomUUID(), text, completed: false });
  save();
  render();
  announce(`Added task: ${text}`);
}
function toggle(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  save();
  render();
  announce(`${task.completed ? "Completed" : "Reopened"} task: ${task.text}`);
}
function editTask(row, task) {
  const input = document.createElement("input"),
    original = row.querySelector(".task-text");
  input.className = "edit-input";
  input.type = "text";
  input.value = task.text;
  input.maxLength = 160;
  input.setAttribute("aria-label", `Edit task: ${task.text}`);
  original.replaceWith(input);
  input.focus();
  input.select();
  let finished = false;
  const finish = (saveChanges) => {
    if (finished) return;
    finished = true;
    const value = input.value.trim();
    if (saveChanges && value) {
      task.text = value;
      save();
      announce(`Updated task: ${value}`);
    } else if (saveChanges)
      announce("Task was not changed because its text cannot be empty.");
    render();
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  };
  input.addEventListener("blur", () => finish(true), { once: true });
}
function removeTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  tasks = tasks.filter((t) => t.id !== id);
  save();
  render();
  announce(`Deleted task: ${task.text}`);
}
form.onsubmit = (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return input.focus();
  add(text);
  input.value = "";
  input.focus();
};
filters.forEach((el) => {
  el.onclick = () => {
    filter = el.dataset.filter;
    render();
  };
});
clear.onclick = () => {
  const done = tasks.filter((t) => t.completed).length;
  tasks = tasks.filter((t) => !t.completed);
  save();
  render();
  announce(`Cleared ${done} completed ${done === 1 ? "task" : "tasks"}.`);
};
render();
