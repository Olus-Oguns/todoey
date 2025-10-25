import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, useScroll, useTransform } from 'framer-motion';
import './App.css';
import LOGO from "./assets/logo.jpeg";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newIsImportant, setNewIsImportant] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [newListName, setNewListName] = useState('');
  const [userLists, setUserLists] = useState([]);
  const [newItem, setNewItem] = useState('');

  const { scrollYProgress } = useScroll();
  const watermarkOpacity = useTransform(scrollYProgress, [0, 1], [0.1, 0.3]);

  useEffect(() => {
    axios.get('http://localhost:5000/tasks')
      .then(res => setTasks(res.data))
      .catch(err => console.error('Fetch tasks error:', err.message, err.response?.data));
  }, []);

  const addTask = () => {
    if (!newTask.trim()) {
      alert('Task cannot be empty');
      return;
    }
    const validCategories = ['general', 'home', 'work', 'groceries', 'movies', ...userLists];
    const category = validCategories.includes(activeTab) ? activeTab : newCategory;
    let dueDateTime = '';
    if (activeTab === 'today') {
      const date = new Date();
      const time = newTime || date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      dueDateTime = `${date.toISOString().split('T')[0]}T${time}:00.000Z`;
    } else if (newDueDate) {
      dueDateTime = `${newDueDate}T00:00:00.000Z`;
    }
    const isList = userLists.includes(category);
    const payload = { task: newTask, category, dueDateTime, isImportant: newIsImportant, items: isList ? [] : undefined };
    console.log('Sending POST payload:', payload);
    axios.post('http://localhost:5000/tasks', payload)
      .then(res => {
        console.log('Task added:', res.data);
        setTasks([...tasks, res.data]);
        setNewTask('');
        setNewDueDate('');
        setNewTime('');
        setNewIsImportant(false);
      })
      .catch(err => {
        console.error('Add task error:', err.message, err.response?.data, err.response?.status);
        alert('Error: ' + (err.response?.data?.message || 'Failed to add task. Check console for details.'));
      });
  };

  const addItemToList = (listId) => {
    if (!newItem.trim()) {
      alert('Item cannot be empty');
      return;
    }
    const task = tasks.find(t => t.id === listId);
    if (!task) {
      alert('Error: List not found');
      return;
    }
    const updatedItems = [...(task.items || []), newItem];
    axios.put(`http://localhost:5000/tasks/${listId}`, { ...task, items: updatedItems })
      .then(() => {
        setTasks(tasks.map(t => t.id === listId ? { ...t, items: updatedItems } : t));
        setNewItem('');
      })
      .catch(err => alert('Error: ' + (err.response?.data?.message || 'Failed to add item')));
  };

  const toggleTask = (id, task, completed, category, dueDateTime, isImportant, items) => {
    axios.put(`http://localhost:5000/tasks/${id}`, { task, completed: !completed, category, dueDateTime, isImportant, items })
      .then(() => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !completed } : t)))
      .catch(err => alert('Error: ' + (err.response?.data?.message || 'Failed to update task')));
  };

  const toggleImportant = (id, task, completed, category, dueDateTime, isImportant, items) => {
    axios.put(`http://localhost:5000/tasks/${id}`, { task, completed, category, dueDateTime, isImportant: !isImportant, items })
      .then(() => setTasks(tasks.map(t => t.id === id ? { ...t, isImportant: !isImportant } : t)))
      .catch(err => alert('Error: ' + (err.response?.data?.message || 'Failed to update task')));
  };

  const deleteTask = (id) => {
    axios.delete(`http://localhost:5000/tasks/${id}`)
      .then(() => {
        setTasks(tasks.filter(t => t.id !== id));
        const task = tasks.find(t => t.id === id);
        if (task && userLists.includes(task.category)) {
          setUserLists(userLists.filter(list => list !== task.category));
        }
      })
      .catch(err => alert('Error: ' + (err.response?.data?.message || 'Failed to delete task')));
  };

  const addList = () => {
    if (!newListName.trim()) {
      alert('List name cannot be empty');
      return;
    }
    axios.post('http://localhost:5000/tasks', { task: newListName, category: newListName, dueDateTime: '', isImportant: false, items: [] })
      .then(res => {
        setTasks([...tasks, res.data]);
        setUserLists([...userLists, newListName]);
        setNewListName('');
        setActiveTab(newListName);
        setNewItem('');
      })
      .catch(err => alert('Error: ' + (err.response?.data?.message || 'Failed to add list')));
  };

  const filteredTasks = tasks
    .filter(task => {
      if (activeTab === 'today') return task.dueDateTime && new Date(task.dueDateTime).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
      if (activeTab === 'important') return task.isImportant;
      if (activeTab === 'planned') return task.dueDateTime;
      if (activeTab === 'completed') return task.completed;
      if (activeTab !== 'all' && activeTab !== 'create-list') return task.category === activeTab;
      return activeTab === 'all';
    })
    .filter(task => {
      if (taskFilter === 'active') return !task.completed;
      if (taskFilter === 'completed') return task.completed;
      return true;
    })
    .filter(task => task.task.toLowerCase().includes(search.toLowerCase()));

  const completedCount = filteredTasks.filter(task => task.completed).length;
  const totalCount = filteredTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const defaultBottomLists = [
    { name: 'home', emoji: '🏠' },
    { name: 'work', emoji: '💼' },
    { name: 'groceries', emoji: '🛒' },
    { name: 'movies', emoji: '🎬' }
  ];

  return (
    <div className="app-container">
      <header className="header">
        <img src={LOGO} alt="Todoey Logo" className="logo" />
        <input type="text" className="search-bar" placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
      </header>
      <motion.div className="watermark" style={{ opacity: watermarkOpacity, backgroundImage: `url(${process.env.PUBLIC_URL + '/logo.jpeg'})`, backgroundRepeat: 'repeat', backgroundSize: '300px 150px', }} />
      <div className="main">
        <div className="sidebar">
          <div className="sidebar-top">
            <button className={`sidebar-button ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
              🌞 Today
            </button>
            <button className={`sidebar-button ${activeTab === 'important' ? 'active' : ''}`} onClick={() => setActiveTab('important')}>
              ⭐ Important
            </button>
            <button className={`sidebar-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              📋 All Tasks
            </button>
            <button className={`sidebar-button ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
              ✅ Completed
            </button>
          </div>
          <hr />
          <div className="sidebar-bottom">
            <button className={`sidebar-button ${activeTab === 'planned' ? 'active' : ''}`} onClick={() => setActiveTab('planned')}>
              🗓️ Planned
            </button>
            {defaultBottomLists.map(list => (
              <button
                key={list.name}
                className={`sidebar-button ${activeTab === list.name ? 'active' : ''}`}
                onClick={() => setActiveTab(list.name)}
              >
                {list.emoji} {(list.name || 'General').charAt(0).toUpperCase() + (list.name || 'General').slice(1)}
              </button>
            ))}
            <button className={`sidebar-button ${activeTab === 'create-list' ? 'active' : ''}`} onClick={() => setActiveTab('create-list')}>
              📚 Lists
            </button>
            {userLists.length > 0 && (
              <div className="user-lists-sidebar">
                {userLists.map(list => (
                  <button
                    key={list}
                    className={`sidebar-button ${activeTab === list ? 'active' : ''}`}
                    onClick={() => setActiveTab(list)}
                  >
                    📝 {(list || 'General').charAt(0).toUpperCase() + (list || 'General').slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={`content ${activeTab === 'today' ? 'content-today' : activeTab === 'create-list' || userLists.includes(activeTab) ? 'content-list' : ''}`}>
          <div className="progress-container">
            <motion.div
              className="progress-circle"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#E9ECEF" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#2A9D8F"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="283"
                  strokeDashoffset={283 * (1 - progress / 100)}
                />
              </svg>
              <span className="progress-text">{Math.round(progress)}%</span>
            </motion.div>
          </div>
          <h2 className={activeTab === 'today' ? 'content-today' : activeTab === 'create-list' || userLists.includes(activeTab) ? 'content-list' : ''}>
            {(activeTab || 'all').charAt(0).toUpperCase() + (activeTab || 'all').slice(1)} {activeTab === 'create-list' ? 'Lists' : 'Tasks'}
          </h2>
          {activeTab !== 'create-list' && activeTab !== 'today' && !userLists.includes(activeTab) && (
            <div className="task-filter">
              <button className={`task-filter-button ${taskFilter === 'all' ? 'active' : ''}`} onClick={() => setTaskFilter('all')}>
                All
              </button>
              <button className={`task-filter-button ${taskFilter === 'active' ? 'active' : ''}`} onClick={() => setTaskFilter('active')}>
                Active
              </button>
              <button className={`task-filter-button ${taskFilter === 'completed' ? 'active' : ''}`} onClick={() => setTaskFilter('completed')}>
                Completed
              </button>
            </div>
          )}
          {activeTab === 'create-list' ? (
            <motion.div
              className="new-list-form-content content-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list name"
                className="content-list"
              />
              <button className="content-list" onClick={addList}>Create List</button>
            </motion.div>
          ) : userLists.includes(activeTab) ? (
            <div className="list-items content-list">
              <motion.div
                className="new-item-form content-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="New item"
                  className="content-list"
                />
                <button className="content-list" onClick={() => {
                  const listTask = tasks.find(t => t.category === activeTab);
                  if (listTask) addItemToList(listTask.id);
                }}>
                  Add Item
                </button>
              </motion.div>
              <ul className="task-list">
                {filteredTasks
                  .filter(task => task.category === activeTab)
                  .map((task, index) => (
                    <motion.li
                      key={task.id}
                      className={task.completed ? 'completed' : ''}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id, task.task, task.completed, task.category, task.dueDateTime, task.isImportant, task.items)}
                      />
                      <span>
                        {task.task} {task.dueDateTime ? `(Due: ${new Date(task.dueDateTime).toLocaleString()})` : ''}
                      </span>
                      <button
                        className={activeTab === 'today' ? 'content-today' : 'content-list'}
                        onClick={() => toggleImportant(task.id, task.task, task.completed, task.category, task.dueDateTime, task.isImportant, task.items)}
                      >
                        {task.isImportant ? 'Unstar' : 'Star'}
                      </button>
                      <button
                        className={activeTab === 'today' ? 'content-today' : 'content-list'}
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </button>
                      {task.items && task.items.length > 0 && (
                        <ul className="item-list">
                          {task.items.map((item, index) => (
                            <motion.li
                              key={index}
                              className="content-list"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </motion.li>
                  ))}
              </ul>
            </div>
          ) : (
            <>
              {activeTab === 'today' ? (
                <motion.div
                  className="task-form content-today"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task" className="content-today" />
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="content-today" />
                  <label className="content-today">
                    <input type="checkbox" checked={newIsImportant} onChange={(e) => setNewIsImportant(e.target.checked)} />
                    Important
                  </label>
                  <button className="content-today" onClick={addTask}>Add</button>
                </motion.div>
              ) : (
                <motion.div
                  className="task-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task" />
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="home">Home</option>
                    <option value="groceries">Groceries</option>
                    <option value="movies">Movies to Watch</option>
                  </select>
                  <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                  <label>
                    <input type="checkbox" checked={newIsImportant} onChange={(e) => setNewIsImportant(e.target.checked)} />
                    Important
                  </label>
                  <button onClick={addTask}>Add</button>
                </motion.div>
              )}
              <ul className="task-list">
                {filteredTasks.map((task, index) => (
                  <motion.li
                    key={task.id}
                    className={`${task.completed ? 'completed' : ''} ${activeTab === 'today' ? 'content-today' : ''}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.task, task.completed, task.category, task.dueDateTime, task.isImportant, task.items)}
                    />
                    <span>
                      {activeTab === 'today' ? '🕒 ' : ''}{task.task} ({task.category || 'General'}) {task.dueDateTime ? `(Due: ${new Date(task.dueDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })})` : ''}
                    </span>
                    <button
                      className={activeTab === 'today' ? 'content-today' : activeTab === 'create-list' || userLists.includes(activeTab) ? 'content-list' : ''}
                      onClick={() => toggleImportant(task.id, task.task, task.completed, task.category, task.dueDateTime, task.isImportant, task.items)}
                    >
                      {task.isImportant ? 'Unstar' : 'Star'}
                    </button>
                    <button
                      className={activeTab === 'today' ? 'content-today' : activeTab === 'create-list' || userLists.includes(activeTab) ? 'content-list' : ''}
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </motion.li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;