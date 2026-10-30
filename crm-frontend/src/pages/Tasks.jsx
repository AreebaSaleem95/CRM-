import React, { useState, useEffect } from 'react';
import TaskFormModal from "../components/tasks/TaskFormModal";
import api from '../services/api';
import { tokenStore } from '../lib/apiClient';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  User, 
  CheckSquare, 
  Trash2, 
  Edit2,
  Loader2,
  Briefcase,
  Tag,
  AlertTriangle
} from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Delete Confirmation Modal State
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Centralized robust token getter
  const getAuthHeaders = () => {
    let token = '';
    try {
      if (tokenStore && typeof tokenStore.getAccess === 'function') {
        token = tokenStore.getAccess();
      }
    } catch (e) {}

    if (!token) {
      token = localStorage.getItem('token') || localStorage.getItem('crm_token');
    }

    if (!token) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('crm_current_user') || localStorage.getItem('user') || '{}');
        token = storedUser.token || storedUser.accessToken;
      } catch (e) {}
    }

    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch tasks from backend (Role isolated)
  const fetchTasks = async () => {
    try {
      setLoading(true);

      // Primary: Direct authenticated fetch with token
      const res = await fetch('http://localhost:5000/api/tasks', {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          setLoading(false);
          return;
        }
      }

      // Secondary: Axios instance
      try {
        const axiosRes = await api.get('/tasks');
        if (axiosRes?.data?.success && Array.isArray(axiosRes.data.tasks)) {
          setTasks(axiosRes.data.tasks);
          setLoading(false);
          return;
        }
      } catch (axiosErr) {}

      setTasks([]);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Toggle complete / pending
  const toggleTaskStatus = async (id) => {
    const currentTask = tasks.find(t => t.id === id);
    if (!currentTask) return;

    const nextCompleted = !currentTask.completed;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: nextCompleted } : t));

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ completed: nextCompleted })
      });

      if (!res.ok) {
        try {
          await api.patch(`/tasks/${id}/toggle`, { completed: nextCompleted });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
      fetchTasks();
    }
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Create or Update task
  const handleSaveTask = async (savedData) => {
    try {
      const payload = {
        title: savedData.title?.trim() || 'New Task',
        relatedDeal: savedData.relatedDeal?.trim() || '',
        dueDate: savedData.dueDate || new Date().toISOString().split('T')[0],
        priority: savedData.priority || 'Medium',
        category: savedData.category || 'Follow-up'
      };

      if (editingTask) {
        let updated = false;
        try {
          const res = await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) updated = true;
        } catch (e) {}

        if (!updated) {
          try {
            const res = await api.put(`/tasks/${editingTask.id}`, payload);
            if (res?.data?.success) updated = true;
          } catch (e) {}
        }
        await fetchTasks();
      } else {
        let created = false;
        try {
          const res = await fetch('http://localhost:5000/api/tasks', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            created = true;
            if (data.task) {
              setTasks(prev => [data.task, ...prev]);
            } else {
              await fetchTasks();
            }
          }
        } catch (e) {}

        if (!created) {
          try {
            const res = await api.post('/tasks', payload);
            if (res?.data?.success && res.data.task) {
              setTasks(prev => [res.data.task, ...prev]);
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  // Open Delete Confirmation
  const handleOpenDelete = (task) => {
    setTaskToDelete(task);
  };

  // Execute Delete from DB
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      setIsDeleting(true);
      try {
        await fetch(`http://localhost:5000/api/tasks/${taskToDelete.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (e) {
        try {
          await api.delete(`/tasks/${taskToDelete.id}`);
        } catch (err) {}
      }
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
      fetchTasks();
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterTab === 'Pending') return !t.completed;
    if (filterTab === 'Completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  const getCategoryBadge = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'proposal':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'meeting':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'call':
        return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'billing':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Task Management & Follow-ups
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily sales agendas, scheduled meetings, and client follow-ups.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Progress Metric Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {completedCount} of {tasks.length} tasks completed
            </h3>
            <p className="text-xs text-slate-500">Status is automatically saved in real-time</p>
          </div>
        </div>

        <div className="w-full sm:w-64 bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {['All', 'Pending', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterTab === tab
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading tasks from database...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 bg-white rounded-xl text-slate-400 text-sm shadow-sm">
            No tasks found in this section.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all ${
                task.completed ? 'bg-slate-50/70 opacity-75' : ''
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task.id)}
                  className="mt-0.5 sm:mt-0 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-sm font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    {task.category && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getCategoryBadge(task.category)}`}>
                        <Tag className="w-2.5 h-2.5" />
                        {task.category}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-slate-500">
                    {task.relatedDeal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        Deal: {task.relatedDeal}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {task.dueDate}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-slate-400" />
                      {task.assignedTo || 'Admin User'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                  {task.priority} Priority
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(task)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Task Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialData={editingTask}
      />

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Task</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to delete <span className="text-slate-800 font-semibold">"{taskToDelete.title}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}