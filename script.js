const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'style.css';
document.head.appendChild(link);

const STORAGE_KEY = 'todo_items';
let items = [];
let asc = true;
let filter = 'all';
let search = '';

document.addEventListener('DOMContentLoaded', () => {
  const root = buildLayout();
  const refs = getRefs(root);
  load();
  render(refs.list);

  refs.addBtn.addEventListener('click', () => add(refs));
  refs.search.addEventListener('input', e => {
    search = e.target.value.trim().toLowerCase();
    render(refs.list);
  });
  refs.status.addEventListener('change', e => {
    filter = e.target.value;
    render(refs.list);
  });
  refs.sortBtn.addEventListener('click', () => {
    sortItems();
    render(refs.list);
  });
});

function buildLayout(){
  const app = document.createElement('div');
  app.className = 'todo-root';
  document.body.appendChild(app);

  const title = document.createElement('h1');
  title.textContent = 'Список задач';
  app.appendChild(title);

  const form = document.createElement('div');
  form.className = 'todo-form';
  app.appendChild(form);

  const input = document.createElement('input');
  input.placeholder = 'Название задачи';
  input.className = 'todo-title';
  form.appendChild(input);

  const label = document.createElement('label');
  label.textContent = 'Дата выполнения:';
  label.htmlFor = 'date';
  form.appendChild(label);

  const date = document.createElement('input');
  date.type = 'date';
  date.id = 'date';
  date.className = 'todo-date';
  form.appendChild(date);

  const add = document.createElement('button');
  add.textContent = 'Добавить';
  add.className = 'btn-add';
  form.appendChild(add);

  const controls = document.createElement('div');
  controls.className = 'todo-controls';
  app.appendChild(controls);

  const searchInput = document.createElement('input');
  searchInput.placeholder = 'Поиск...';
  searchInput.className = 'ctrl-search';
  controls.appendChild(searchInput);

  const select = document.createElement('select');
  select.className = 'ctrl-status';
  select.add(new Option('Все','all'));
  select.add(new Option('Выполненные','completed'));
  select.add(new Option('Невыполненные','incomplete'));
  controls.appendChild(select);

  const sort = document.createElement('button');
  sort.textContent = 'Сортировать по дате';
  sort.className = 'btn-sort';
  controls.appendChild(sort);

  const list = document.createElement('ul');
  list.className = 'todo-list';
  app.appendChild(list);

  return app;
}

function getRefs(root){
  return {
    titleInput: root.querySelector('.todo-title'),
    dateInput: root.querySelector('.todo-date'),
    addBtn: root.querySelector('.btn-add'),
    search: root.querySelector('.ctrl-search'),
    status: root.querySelector('.ctrl-status'),
    sortBtn: root.querySelector('.btn-sort'),
    list: root.querySelector('.todo-list')
  };
}

function add({titleInput,dateInput,list}){
  const text = titleInput.value.trim();
  const date = dateInput.value;
  if(!text){
    alert('Введите название задачи!');
    return;
  }
  items.push({
    id: Date.now(),
    title: text,
    due: date,
    done: false
  });
  save();
  titleInput.value = '';
  dateInput.value = '';
  render(list);
}

function render(list){
  while (list.firstChild) list.removeChild(list.firstChild);
  const data = items.filter(i => {
    if(filter === 'completed' && !i.done) return false;
    if(filter === 'incomplete' && i.done) return false;
    if(search && !i.title.toLowerCase().includes(search)) return false;
    return true;
  });
  data.forEach(i => {
    const li = document.createElement('li');
    li.className = 'task-row';
    li.draggable = true;
    li.dataset.id = i.id;
    if(i.done) li.classList.add('done');

    const left = document.createElement('div');
    left.className = 'row-left';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = i.done;
    check.addEventListener('change', () => toggle(i.id));

    const title = document.createElement('span');
    title.className = 'row-title';
    title.textContent = i.title;

    const date = document.createElement('span');
    date.className = 'row-date';
    date.textContent = i.due;

    left.append(check, title, date);

    const right = document.createElement('div');
    right.className = 'row-right';

    const edit = document.createElement('button');
    edit.textContent = 'Редактировать';
    edit.className = 'btn-edit';
    edit.onclick = () => editItem(i.id);

    const del = document.createElement('button');
    del.textContent = 'Удалить';
    del.className = 'btn-del';
    del.onclick = () => removeItem(i.id);

    right.append(edit, del);

    li.appendChild(left);
    li.appendChild(right);

    li.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', i.id);
      li.classList.add('dragging');
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
    });

    li.addEventListener('dragover', e => e.preventDefault());

    li.addEventListener('drop', e => {
      e.preventDefault();
      const drag = Number(e.dataTransfer.getData('text/plain'));
      const drop = Number(li.dataset.id);
      if(drag === drop) return;
      const a = items.findIndex(x => x.id === drag);
      const b = items.findIndex(x => x.id === drop);
      if(a < 0 || b < 0) return;
      const [m] = items.splice(a, 1);
      items.splice(b, 0, m);
      save();
      render(document.querySelector('.todo-list'));
    });

    list.appendChild(li);
  });
}

function toggle(id){
  const t = items.find(x => x.id === id);
  if(!t) return;
  t.done = !t.done;
  save();
  render(document.querySelector('.todo-list'));
}

function removeItem(id){
  items = items.filter(x => x.id !== id);
  save();
  render(document.querySelector('.todo-list'));
}

function editItem(id){
  const t = items.find(x => x.id === id);
  if(!t) return;
  const title = prompt('Редактировать название задачи:', t.title);
  if(title !== null) t.title = title;
  const date = prompt('Редактировать дату задачи (YYYY-MM-DD):', t.due);
  if(date !== null) t.due = date;
  save();
  render(document.querySelector('.todo-list'));
}

function sortItems(){
  items.sort((a,b)=>{
    if(a.due && b.due) return new Date(a.due) - new Date(b.due);
    if(a.due && !b.due) return -1;
    if(!a.due && b.due) return 1;
    return 0;
  });
  if(!asc) items.reverse();
  asc = !asc;
  save();
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) items = JSON.parse(raw);
}
