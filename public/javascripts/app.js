const ViewManager = {
  // Helpers
  openForm() {
    document.querySelector('#modal_layer').style.display = "block";
    document.querySelector('#form_modal').style.display = "block";
  },

  clearform() {
    document.getElementById('title').value = '';
    document.querySelector('#due_day').selectedIndex = 0;
    document.querySelector('#due_month').selectedIndex = 0;
    document.querySelector('#due_year').selectedIndex = 0;
    document.getElementById('description').value = '';
  },

  todosOrderByCompletion(todos) {
    let completed = [];
    let notCompleted = [];
    if (todos) {
      for (const todo of todos) {
        if (todo.completed) {
          completed.push(todo);
        } else {
          notCompleted.push(todo);
        }
      } 
    }
    return notCompleted.concat(completed);
  },

  sortByDate(todos) {
    if (todos) {
      return todos.sort((a, b) => {
        let monthA, yearA, monthB, yearB;

        if (a.due_date === 'No Due Date') {
          [monthA, yearA] = ['99', '99'];
        } else {
          [monthA, yearA] = a.due_date.split('/');
        }
        
        if (b.due_date === 'No Due Date') {
          [monthB, yearB] = ['99', '99'];
        } else {
          [monthB, yearB] = b.due_date.split('/');
        }

        if (yearA < yearB) return -1;
        if (yearA > yearB) return 1;
        if (monthA < monthB) return -1;
        if (monthA > monthB) return 1;
      })
    }
  },

  sortByDateReversed(todos) {
    if (todos) {
      return todos.sort((a, b) => {
        let monthA, yearA, monthB, yearB;

        if (a.due_date === 'No Due Date') {
          [monthA, yearA] = ['00', '00'];
        } else {
          [monthA, yearA] = a.due_date.split('/');
        }
        
        if (b.due_date === 'No Due Date') {
          [monthB, yearB] = ['00', '00'];
        } else {
          [monthB, yearB] = b.due_date.split('/');
        }

        if (yearA < yearB) return -1;
        if (yearA > yearB) return 1;
        if (monthA < monthB) return -1;
        if (monthA > monthB) return 1;
      })
    }
  },

  addDueDate(todos) {
    if (todos) {
      for (let todo of todos) {
        let month = todo.month || "00";
        let year = todo.year || "0000";
        let dueDate = month + '/' + year.slice(2);
        todo['due_date'] = dueDate === "00/00" ? "No Due Date" : dueDate;
      }
    }
    return todos;
  },

  filterForCompletion(todos) {
    return todos.filter(todo => todo.completed);
  },

  groupByDate(todos, sortNoDueDateLast) {
    const withDueDate = this.addDueDate(todos);
    let orderedTodos;
    let groupedTodos = {};
    
    if (sortNoDueDateLast) {
      orderedTodos = this.sortByDate(withDueDate);
    } else {
      orderedTodos = this.sortByDateReversed(withDueDate);
    }
    
    for (const todo of orderedTodos) {
      const dueDate = todo['due_date'];

      if (Object.keys(groupedTodos).includes(dueDate)) {
        groupedTodos[dueDate].push(todo);
      } else {
        groupedTodos[dueDate] = [todo];
      }
    }
    return groupedTodos;
  },

  // Template rendering
  highlightNav() {
    if (this.renderAllBoolean && this.renderDate) {
      let element = document.querySelector('#all_lists');
      let currentElement = element.querySelector(`[data-title="${this.renderDate}"]`);
      if (currentElement) currentElement.classList.add('active');
    } else if (!this.renderAllBoolean && this.renderDate) {
      let element = document.querySelector('#completed_lists');
      let currentElement = element.querySelector(`[data-title="${this.renderDate}"]`);
      if (currentElement) currentElement.classList.add('active');
    } else if (!this.renderAllBoolean) {
      document.querySelector('#all_done_header').classList.add('active');
    } else {
      document.querySelector('#all_header').classList.add('active');
    }
  },

  renderTodos(todos) {
    const todosDueDate = this.addDueDate(todos);
    const orderedTodos = this.sortByDate(todosDueDate);
    const todosOrderByCompletion = this.todosOrderByCompletion(orderedTodos);
    const html = this.templates['list_template']({selected: todosOrderByCompletion});
    
    this.tableOfTodos.innerHTML = '';
    this.tableOfTodos.innerHTML += html;
  },

  renderHeaderAllTodosTemplate(todos) {
    const html = this.templates['all_todos_template']({todos});
    document.querySelector('#all_todos').innerHTML = '';
    document.querySelector('#all_todos').innerHTML += html;
  },

  renderListAllTodosTemplate(todos) {
    const groupedTodos = this.groupByDate(todos, false);
    const html = this.templates['all_list_template']({todos_by_date: groupedTodos});
    document.querySelector('#all_lists').innerHTML = '';
    document.querySelector('#all_lists').innerHTML += html;
  },

  renderHeaderCompletedTemplate(todos) {
    const completedTodos = this.filterForCompletion(todos);
    const html = this.templates['completed_todos_template']({done: completedTodos});
    document.querySelector('#completed_todos').innerHTML = '';
    document.querySelector('#completed_todos').innerHTML += html;
  },

  renderListCompletedTemplate(todos) {
    const completedTodos = this.filterForCompletion(todos);
    const sortedByDate = this.groupByDate(completedTodos, false);
    const html = this.templates['completed_list_template']({done_todos_by_date: sortedByDate});
    document.querySelector('#completed_lists').innerHTML = '';
    document.querySelector('#completed_lists').innerHTML += html;
  },

  renderHeadingTitle(title, data) {
    const html = this.templates['title_template']({current_section: {title, data}});
    document.querySelector('#items').firstElementChild.innerHTML = '';
    document.querySelector('#items').firstElementChild.innerHTML += html;
  },

  renderAllTodosTemplate(todos) {
    this.renderHeaderAllTodosTemplate(todos);
    this.renderListAllTodosTemplate(todos);
  },

  renderCompletedTodosTemplate(todos) {
    this.renderHeaderCompletedTemplate(todos);
    this.renderListCompletedTemplate(todos);
  },

  renderNav(todos) {
    this.renderAllTodosTemplate(todos);
    this.renderCompletedTodosTemplate(todos);
    this.highlightNav();
  },

  // Connect data with rendering functions
  async renderAllTodos() {
    const todos = await Controller.getTodos();
    this.renderNav(todos);
    this.renderTodos(todos);
    this.renderHeadingTitle('All Todos', todos.length);
  },

  async renderAllTodosByDate(date) {
    let todos = await Controller.getTodos();
    const byDate = this.groupByDate(todos, true);
    this.renderNav(todos);
    this.renderTodos(byDate[date], date);
    if (byDate[date]) {
      this.renderHeadingTitle(date, byDate[date].length);
    } else {
      this.renderHeadingTitle(date, 0);
    }
  },

  async renderAllCompleted() {
    let todos = await Controller.getTodos();
    const completed = this.filterForCompletion(todos);
    this.renderNav(todos);
    this.renderTodos(completed, 'Completed');
    this.renderHeadingTitle('Completed', completed.length);
  },

  async renderAllCompletedByDate (date) {
    let todos = await Controller.getTodos();
    const completed = this.filterForCompletion(todos);
    const completedBydate = this.groupByDate(completed);
    this.renderNav(todos);
    this.renderTodos(completedBydate[date], date );
    if (completedBydate[date]) {
      this.renderHeadingTitle(date, completedBydate[date].length);
    } else {
      this.renderHeadingTitle(date, 0);
    }
  },

  // Initial render orchestration
  compileTemplates() {
    let scripts = document.querySelectorAll('script[type="text/x-handlebars"]');

    for (const script of scripts) {
      const template = script.innerHTML;
      const compiledTemplate = Handlebars.compile(template);
      const name = script.id;
      if (script.dataset.type === 'partial') {
        Handlebars.registerPartial(name, template);
      }
      this.templates[name] = compiledTemplate;
    }
  },

  renderViewPort() {
    document.body.innerHTML = this.templates["main_template"]({});
    this.tableOfTodos = document.querySelector('#todo-table');
  },

  renderAllPartials() {
    if (this.renderAllBoolean && this.renderDate) {
      this.renderAllTodosByDate(this.renderDate);
    } else if (!this.renderAllBoolean && this.renderDate) {
      this.renderAllCompletedByDate(this.renderDate);
    } else if (!this.renderAllBoolean) {
      this.renderAllCompleted();
    } else {
      this.renderAllTodos();
    }
  },  

  init() {
    this.templates = {},
    this.renderAllBoolean = true;
    this.renderDate = null;
    this.compileTemplates();
    this.renderViewPort();
    this.renderAllPartials();
  }
};

const API = {
  createTodo(todo) {
    return fetch("api/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: todo,
    });
  },

  readTodos() {
    return fetch("/api/todos");
  },

  readTodo(id) {
    return fetch(`/api/todos/${id}`);
  },

  async updateTodo(id, json) {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json'
      },
      body: json
    });
    return await response.json();
  },

  async deleteTodo(id) {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'DELETE'
      })
      await response.text();
      return response.ok;
  },
};

const Controller = {
  // CRUD
  async getTodos() {
    try {
      const response = await API.readTodos();
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const todos = await response.json();
      return todos;
    } catch(err) {
      alert(err);
    }
  },

  async getTodo(id) {
    try {
      const response = await API.readTodo(id);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const todo = await response.json();
      return todo;
    } catch(err) {
      alert(err);
    }
  },

  async addTodo(json) {
    try {
      const response = await API.createTodo(json);
      ViewManager.renderAllBoolean = true;
      ViewManager.renderDate = null;
      ViewManager.renderAllPartials();
      this.modalClose();
      return response;
    } catch (err) {
      console.log(err);
    }
  },

  async update(id, json) {
    try {
      const response = await API.updateTodo(id, json);
      ViewManager.renderAllPartials();
      this.modalClose();
      this.currentTodoId = null;
      return response;
    } catch (err) {
      console.log(err);
    }
  },

  async delete(id) {
    try {
      const response = await API.deleteTodo(id);
      ViewManager.renderAllPartials();
      return response;
    } catch (err) {
      console.log(err);
    }
  },

  // Helpers
  getElementId(e) {
    return e.target.parentNode.parentNode.dataset.id;
  },

  fillForm(todo) {
    const title = document.querySelector('#title');
    const day = document.querySelector('#due_day');
    const month = document.querySelector('#due_month');
    const year = document.querySelector('#due_year');
    const description = document.getElementById('description');
    title.value = todo.title;
    day.value = todo.day;
    month.value = todo.month;
    year.value = todo.year;
    description.value = todo.description;
  },

  getElementIdFromToggle(e) {
    return e.target.parentNode.dataset.id
  },

  modalOpen() {
    document.querySelector('#modal_layer').style.display = 'block';
    document.querySelector('#form_modal').style.display = 'block';
  },

  modalClose() {
    document.querySelector('#modal_layer').style.display = 'none';
    document.querySelector('#form_modal').style.display = 'none';
  },

  getDateFromElement(e) {
    let date;
    let element = e.target;

    if (element.tagName === 'DL') {
      date = element.dataset.title;
    } else {
      while (element.tagName !== 'DL') {
        element = element.parentNode;
      }
      date = element.dataset.title;
    }
    return date;
  },

  // Event Handlers
  handleAddClick() {
    ViewManager.openForm();
    ViewManager.clearform();
  },

  handleModalClose(e) {
    if (e.target.id === 'modal_layer') {
      this.modalClose();
    }
  },

  async handleFormSubmit(e) {
    e.preventDefault();

    let formData = new FormData(this.form);
    let data = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    if (data['month'] === '00' || data['year'] === '0000') {
      data['month'] = '00';
      data['year'] = '0000';
    }

    let json = JSON.stringify(data);

    if (data['title'].length < 3) {
      alert('You must enter a title at least 3 characters long.');
    } else {
      if (!this.currentTodoId) {
        this.addTodo(json);
      } else {
        this.update(this.currentTodoId, json);
      }
    }
  },

  handleViewAllTodos() {
    ViewManager.renderAllBoolean = true;
    ViewManager.renderDate = null;
    ViewManager.renderAllTodos();
  },

  handleViewAllLists(e) {
    const date = this.getDateFromElement(e);
    ViewManager.renderAllBoolean = true;
    ViewManager.renderDate = date;
    ViewManager.renderAllTodosByDate(date);
  },

  handleViewCompletedTodos() {
    ViewManager.renderAllBoolean = false;
    ViewManager.renderDate = null;
    ViewManager.renderAllCompleted();
  },

  handleViewCompletedLists(e) {
    const date = this.getDateFromElement(e);
    ViewManager.renderAllBoolean = false;
    ViewManager.renderDate = date;
    ViewManager.renderAllCompletedByDate(date);
  },

  handleTodoToggle(e) {
    const id = this.getElementIdFromToggle(e);
    const state = e.target.firstElementChild.checked ? true : false;
    const currentState = {completed: !state};
    this.update(id, JSON.stringify(currentState));
  },

  async handleTodoEdit(e) {
    e.preventDefault();
    e.stopPropagation();
   
    this.currentTodoId = this.getElementId(e);
    const todo = await this.getTodo(this.currentTodoId);
    this.modalOpen();
    this.fillForm(todo);
  },

  handleMarkComplete() {
    if (!this.currentTodoId) {
     alert('Cannot mark as complete as item has not been created yet!');
    } else {
      let data = {completed: true};
      let json = JSON.stringify(data)
      this.update(this.currentTodoId, json);
    }
  },
   
  handleTodoDelete(e) {
    e.preventDefault();
    const id = e.target.parentNode.parentNode.dataset.id;
    this.delete(id);
    ViewManager.renderAllPartials();
  },

  parseTableClicks(e) {
    if (Array.from(e.target.parentNode.classList).includes('delete')) {
      this.handleTodoDelete(e);
    } else if (Array.from(e.target.classList).includes('list_item')) {
      this.handleTodoToggle(e);
    } else if (e.target.tagName === 'LABEL') {
      this.handleTodoEdit(e);
    } 
  },

  bindMainElements() {
    this.addBtn.addEventListener('click', this.handleAddClick.bind(this));
    document.querySelector('#todo-table').addEventListener('click', this.parseTableClicks.bind(this));
    document.body.addEventListener('click', this.handleModalClose.bind(this));
  },

  bindModalElements(){
    this.completeBtn.addEventListener('click', this.handleMarkComplete.bind(this));
    this.submitBtn.addEventListener('click', this.handleFormSubmit.bind(this));
  },

  bindNavbar() {
    document.querySelector('#all_todos').addEventListener('click', this.handleViewAllTodos.bind(this));
    document.querySelector('#all_lists').addEventListener('click', this.handleViewAllLists.bind(this));
    document.querySelector('#completed_todos').addEventListener('click', this.handleViewCompletedTodos.bind(this));
    document.querySelector('#completed_lists').addEventListener('click', this.handleViewCompletedLists.bind(this));
  },

  bindEvents() {
    this.addBtn = document.querySelector('label[for="new_item"]');
    this.form = document.querySelector('form');
    this.submitBtn = document.querySelector('input[type="submit"]');
    this.completeBtn = document.querySelector('#complete-btn');
    this.bindMainElements();
    this.bindModalElements();
    this.bindNavbar();
  },

  async init() {
    this.todos = await this.getTodos();
    this.bindEvents();
    return this;
  }
};

const App = {
  init() {
    ViewManager.init();
    Controller.init();
  }
}

App.init();