import React, { useState } from 'react';
import { initialTasks } from '../data/mockData';
import TaskFormModal from '../components/TaskFormModal';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  User, 
  CheckSquare, 
  Trash2, 
  Edit2
} from 'lucide-react';

export default function Tasks() {
 
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('crm_tasks_list');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return initialTasks;
  });

  const [filterTab, setFilterTab] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);


  const saveAndSyncTasks = (newTasks) => {
    setTasks(newTasks);
    localStorage.setItem('crm_tasks_list', JSON.stringify(newTasks));
  };

  const toggleTaskStatus = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveAndSyncTasks(updated);
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (savedData) => {
    let updated;
    if (editingTask) {
      updated = tasks.map(t => t.id === editingTask.id ? { ...savedData, id: t.id } : t);
    } else {
      const newTask = {
        ...savedData,
        id: `task-${Date.now()}`,
        completed: false
      };
      updated = [newTask, ...tasks];
    }
    saveAndSyncTasks(updated);
  };

  const handleDeleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    saveAndSyncTasks(updated);
  };

  const filteredTasks = tasks.filter(t => {
    if (filterTab === 'Pending') return !t.completed;
    if (filterTab === 'Completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Task Management & Follow-ups
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily sales agendas, scheduled meetings, and client follow-ups.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/25 transition-all text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {completedCount} of {tasks.length} tasks completed
            </h3>
            <p className="text-xs text-slate-400">Status is automatically saved in real-time</p>
          </div>
        </div>

        <div className="w-full sm:w-64 bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
          <div 
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex gap-2">
          {['All', 'Pending', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                filterTab === tab
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab} ({
                tab === 'All' ? tasks.length :
                tab === 'Pending' ? tasks.filter(t => !t.completed).length :
                completedCount
              })
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
            No tasks found in this section.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/60 border rounded-2xl transition-all ${
                task.completed 
                  ? 'border-slate-800/40 opacity-70' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/80'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  className="mt-0.5 sm:mt-0 text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div>
                  <h4 className={`text-sm font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                    {task.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                    {task.relatedDeal && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]">
                        Deal: {task.relatedDeal}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {task.dueDate}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-slate-500" />
                      {task.assignedTo}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  task.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {task.priority} Priority
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        initialData={editingTask}
      />
    </div>
  );
}