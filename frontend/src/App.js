import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    axios.get('/tasks')
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
  }, []);

  const addTask = () => {
    if (newTask.trim()) {
      axios.post('/tasks', { task: newTask })
        .then(res => {
          setTasks([...tasks, res.data]);
          setNewTask('');
        })
        .catch(err => alert('Error: ' + (err.response?.data?.message || 'Failed to add task')));
    }
  };

  const toggleTask = (id, task, completed) => {
    axios.put(`/tasks/${id}`, { task, completed: !completed })
      .then(() => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !completed } : t));
      })
      .catch(err => alert('Error: ' + (err.response?.data?.message || 'Failed to update task')));
  };

  const deleteTask = (id) => {
    axios.delete(`/tasks/${id}`)
      .then(() => {
        setTasks(tasks.filter(t => t.id !== id));
      })
      .catch(err => alert('Error: ' + (err.response?.data?.message || 'Failed to delete task')));
  };

  return (
    <div className="container">
      <h1>Todoey</h1>
      <div className="input-group">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task"
        />
        <button onClick={addTask}>Add</button>
      </div>
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={task.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id, task.task, task.completed)}
            />
            <span>{task.task}</span>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;