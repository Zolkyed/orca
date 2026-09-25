const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const list = document.querySelector('#task-list');
const error = document.querySelector('#error');
let tasks = [];

async function api(path = '', options = {}) {
  const response = await fetch(`/api/tasks${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Could not save or load your tasks. Please try again.');
  return response.status === 204 ? null : response.json();
}

function showError(message) {
  error.textContent = message;
  error.hidden = !message;
}

function render() {
  list.replaceChildren();
  const remaining = tasks.filter(task => !task.completed).length;
  document.querySelector('#count').textContent = `${remaining} remaining`;
  document.querySelector('#empty').hidden = tasks.length > 0;
  document.querySelector('#progress').textContent = tasks.length
    ? `${tasks.length - remaining} of ${tasks.length} complete. Keep it up.`
    : 'A little progress goes a long way.';

  for (const task of tasks) {
    const row = document.createElement('li');
    row.className = `task${task.completed ? ' completed' : ''}`;
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    const title = document.createElement('span');
    title.textContent = task.title;
    const remove = document.createElement('button');
    remove.className = 'delete';
    remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete ${task.title}`);

    checkbox.addEventListener('change', async () => {
      checkbox.disabled = remove.disabled = true;
      showError('');
      try {
        const updated = await api(`/${task.id}`, {
          method: 'PATCH', body: JSON.stringify({ completed: checkbox.checked }),
        });
        tasks = tasks.map(item => item.id === task.id ? updated : item);
        render();
      } catch (err) {
        checkbox.checked = task.completed;
        showError(err.message);
      } finally { checkbox.disabled = remove.disabled = false; }
    });

    remove.addEventListener('click', async () => {
      checkbox.disabled = remove.disabled = true;
      showError('');
      try {
        await api(`/${task.id}`, { method: 'DELETE' });
        tasks = tasks.filter(item => item.id !== task.id);
        render();
      } catch (err) { showError(err.message); }
      finally { checkbox.disabled = remove.disabled = false; }
    });

    label.append(checkbox, title);
    row.append(label, remove);
    list.append(row);
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) { input.focus(); return; }
  const button = document.querySelector('#add-button');
  button.disabled = true;
  input.disabled = true;
  showError('');
  try {
    const task = await api('', { method: 'POST', body: JSON.stringify({ title }) });
    tasks.unshift(task);
    input.value = '';
    render();
  } catch (err) { showError(err.message); }
  finally { button.disabled = false; input.disabled = false; input.focus(); }
});

async function load() {
  form.querySelector('button').disabled = true;
  try { tasks = await api(); render(); }
  catch (err) {
    document.querySelector('#count').textContent = 'Offline';
    showError(`${err.message} Refresh the page to retry.`);
  } finally { form.querySelector('button').disabled = false; }
}
load();
