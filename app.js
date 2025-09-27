// Simple Todo App with localStorage persistence
const STORAGE_KEY = "todo_app_v1";
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const listEl = document.getElementById("todo-list");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));

let todos = loadTodos();
let filter = "all";

render();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const due = dateInput.value || null;
  const newTodo = {
    id: Date.now().toString(),
    text,
    due,
    completed: false,
    createdAt: new Date().toISOString()
  };
  todos.unshift(newTodo); // newest first
  saveTodos();
  input.value = "";
  dateInput.value = "";
  render();
});

clearBtn.addEventListener("click", () => {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  render();
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

// Storage helpers
function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load todos", err);
    return [];
  }
}
function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (err) {
    console.error("Failed to save todos", err);
  }
}

// Render list
function render() {
  // clear
  listEl.innerHTML = "";

  const visible = todos.filter(todo => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  if (visible.length === 0) {
    listEl.innerHTML = <div class="empty">No tasks. Add your first todo above.</div>;
    updateCount();
    return;
  }

  visible.forEach(todo => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = todo.id;

    const left = document.createElement("div");
    left.className = "left";

    const checkbox = document.createElement("button");
    checkbox.className = "checkbox" + (todo.completed ? " checked" : "");
    checkbox.setAttribute("aria-pressed", todo.completed ? "true" : "false");
    checkbox.title = "Toggle complete";
    checkbox.innerHTML = todo.completed ? "✓" : "";

    checkbox.addEventListener("click", () => {
      toggleComplete(todo.id);
    });

    const textWrap = document.createElement("div");
    textWrap.style.display = "flex";
    textWrap.style.alignItems = "center";
    textWrap.style.gap = "8px";
    textWrap.style.flex = "1";

    const textEl = document.createElement("div");
    textEl.className = "todo-text" + (todo.completed ? " completed" : "");
    textEl.textContent = todo.text;
    textEl.title = "Double click to edit";

    // double click to edit
    textEl.addEventListener("dblclick", () => {
      startEdit(todo.id, textEl);
    });

    const dueEl = document.createElement("div");
    dueEl.className = "due";
    if (todo.due) {
      // show in more friendly format
      const d = new Date(todo.due + "T00:00:00");
      dueEl.textContent = d.toLocaleDateString();
    } else {
      dueEl.textContent = "";
    }

    textWrap.appendChild(textEl);
    textWrap.appendChild(dueEl);

    left.appendChild(checkbox);
    left.appendChild(textWrap);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.title = "Edit";
    editBtn.innerHTML = "✎";
    editBtn.addEventListener("click", () => startEdit(todo.id, textEl));

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.title = "Delete";
    delBtn.innerHTML = "🗑";
    delBtn.addEventListener("click", () => {
      deleteTodo(todo.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);

    listEl.appendChild(li);
  });

  updateCount();
}

function updateCount() {
  const remaining = todos.filter(t => !t.completed).length;
  countEl.textContent = `${remaining} task${remaining === 1 ? "" : "s"}`;
}

// Toggle complete by id
function toggleComplete(id) {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  render();
}

// Edit UI
function startEdit(id, textEl) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const li = textEl.closest(".todo-item");
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.value = todo.text;
  editInput.className = "edit-input";
  editInput.placeholder = "Edit todo";
  // replace textEl with input
  textEl.replaceWith(editInput);
  editInput.focus();
  // move caret to end
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  function finish(save) {
    if (save) {
      const newText = editInput.value.trim();
      if (newText) {
        todos = todos.map(t => t.id === id ? { ...t, text: newText } : t);
        saveTodos();
      }
    }
    render();
  }

  editInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") finish(true);
    else if (ev.key === "Escape") finish(false);
  });

  // blur saves
  editInput.addEventListener("blur", () => finish(true));
}

// Utility: when pressing Enter in input, form handles it
// nothing else needed