import { useState, useRef, useEffect } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { formatRelativeTime } from '../utils/reports';
import { 
  Plus, 
  Filter, 
  ChevronDown, 
  X, 
  Edit,
  Trash2,
  AlertTriangle,
  Search,
  Check,
  Clock,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { Task, TaskType, TaskStatus } from '../types';
import { createPortal } from 'react-dom';
import Joyride, { Step } from 'react-joyride';

const calculateTaskAge = (timestamp: string | number): { hours: number; minutes: number } => {
  const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  const now = new Date();
  const taskDate = new Date(timestampNum);
  
  // If timestamp is invalid, return 0
  if (isNaN(taskDate.getTime())) {
    return { hours: 0, minutes: 0 };
  }

  const diffMs = now.getTime() - taskDate.getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  
  // Cap the maximum display time to 999 hours
  if (hours > 999) {
    return { hours: 999, minutes: 0 };
  }
  
  return { hours, minutes };
};

const formatTimeValue = (value: number, unit: 'hours' | 'minutes'): string => {
  if (value === 0) return `0 ${unit}`;
  if (value === 1) return `1 ${unit.slice(0, -1)}`;
  return `${value} ${unit}`;
};

const formatTimeInProgress = (hours: number, minutes: number): string => {
  if (hours === 0) {
    return `${formatTimeValue(minutes, 'minutes')}`;
  }
  if (minutes === 0) {
    return `${formatTimeValue(hours, 'hours')}`;
  }
  return `${formatTimeValue(hours, 'hours')}, ${formatTimeValue(minutes, 'minutes')}`;
};

// Update the TIME_THRESHOLDS type definition
type TaskPriority = 'high' | 'medium' | 'low';
type TimeThreshold = { overdue: number; warning: number };

const TIME_THRESHOLDS: Record<TaskType, Record<TaskPriority, TimeThreshold>> = {
  'loan-approval': {
    high: { overdue: 4, warning: 2 },
    medium: { overdue: 8, warning: 4 },
    low: { overdue: 24, warning: 12 }
  },
  'kyc-check': {
    high: { overdue: 2, warning: 1 },
    medium: { overdue: 4, warning: 2 },
    low: { overdue: 8, warning: 4 }
  },
  'transaction-review': {
    high: { overdue: 1, warning: 0.5 },
    medium: { overdue: 2, warning: 1 },
    low: { overdue: 4, warning: 2 }
  },
  'account-opening': {
    high: { overdue: 2, warning: 1 },
    medium: { overdue: 4, warning: 2 },
    low: { overdue: 8, warning: 4 }
  },
  'credit-check': {
    high: { overdue: 4, warning: 2 },
    medium: { overdue: 8, warning: 4 },
    low: { overdue: 24, warning: 12 }
  }
};

// Update the getTimeStatus function with proper type checking
const getTimeStatus = (task: Task, hours: number): { 
  status: 'overdue' | 'warning' | 'normal';
  message: string;
} => {
  const taskType = task.taskType as TaskType;
  const priority = task.priority as TaskPriority;
  const thresholds = TIME_THRESHOLDS[taskType][priority];
  const warningHours = thresholds.warning;
  const overdueHours = thresholds.overdue;

  if (hours >= overdueHours) {
    return {
      status: 'overdue',
      message: `Overdue by ${formatTimeValue(hours - overdueHours, 'hours')}`
    };
  }
  if (hours >= warningHours) {
    return {
      status: 'warning',
      message: `Due in ${formatTimeValue(overdueHours - hours, 'hours')}`
    };
  }
  return {
    status: 'normal',
    message: `Due in ${formatTimeValue(overdueHours - hours, 'hours')}`
  };
};

const WorkflowManagement = () => {
  const { tasks, duplicateTasks, addTask, updateTask, deleteTask } = useTasks();
  
  // State for filtering and forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Active filters state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  
  // Temporary filter state for the filter dropdown
  const [tempStatusFilter, setTempStatusFilter] = useState<TaskStatus | 'all'>(statusFilter);
  const [tempTypeFilter, setTempTypeFilter] = useState<TaskType | 'all'>(typeFilter);
  const [tempShowDuplicatesOnly, setTempShowDuplicatesOnly] = useState(showDuplicatesOnly);

  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [filterPosition, setFilterPosition] = useState({ top: 0, left: 0, width: 0 });

  // Reset temporary filters when opening the filter dropdown
  const handleFilterOpen = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setFilterPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 320)
      });
    }
    setTempStatusFilter(statusFilter);
    setTempTypeFilter(typeFilter);
    setTempShowDuplicatesOnly(showDuplicatesOnly);
    setFilterOpen(true);
  };

  // Apply filters when clicking the Apply Filters button
  const handleApplyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setTypeFilter(tempTypeFilter);
    setShowDuplicatesOnly(tempShowDuplicatesOnly);
    setFilterOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setTempStatusFilter('all');
    setTempTypeFilter('all');
    setTempShowDuplicatesOnly(false);
    setStatusFilter('all');
    setTypeFilter('all');
    setShowDuplicatesOnly(false);
  };
  
  // Add form state
  const [newTask, setNewTask] = useState({
    customerId: '',
    taskType: 'loan-approval' as TaskType,
    description: '',
    status: 'pending' as TaskStatus,
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: ''
  });
  
  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter(task => {
    // Check if it's a duplicate if filter is active
    if (showDuplicatesOnly) {
      const isDuplicate = duplicateTasks.some(d => 
        d.duplicateTaskId === task.id || d.originalTaskId === task.id
      );
      if (!isDuplicate) return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    
    // Apply type filter
    if (typeFilter !== 'all' && task.taskType !== typeFilter) {
      return false;
    }
    
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        task.customerId.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.id.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Handle adding a new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    addTask(newTask);
    
    // Reset form and close
    setNewTask({
      customerId: '',
      taskType: 'loan-approval',
      description: '',
      status: 'pending',
      priority: 'medium',
      assignedTo: ''
    });
    setShowAddForm(false);
  };
  
  // Start editing a task
  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setShowEditForm(true);
  };
  
  // Handle updating a task
  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      updateTask(editingTask.id, editingTask);
      setEditingTask(null);
      setShowEditForm(false);
    }
  };
  
  // Check if task is flagged as duplicate
  const isDuplicate = (taskId: string) => {
    return duplicateTasks.some(d => 
      d.duplicateTaskId === taskId || d.originalTaskId === taskId
    );
  };
  
  // Get duplicate info for a task
  const getDuplicateInfo = (taskId: string) => {
    return duplicateTasks.find(d => 
      d.duplicateTaskId === taskId || d.originalTaskId === taskId
    );
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterOpen && !(event.target as Element).closest('.filter-dropdown')) {
        setFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const [tourOpen, setTourOpen] = useState(false);
  const tourSteps: Step[] = [
    {
      target: '.main-navbar',
      content: 'Use the navigation bar to access all major sections.',
      placement: 'bottom',
    },
    {
      target: '.workflow-filters',
      content: 'Filter and search tasks here.',
      placement: 'bottom',
    },
    {
      target: '.workflow-table',
      content: 'This table shows all workflow tasks.',
      placement: 'top',
    },
    {
      target: '.add-task-btn',
      content: 'Click here to add a new task.',
      placement: 'left',
    },
    {
      target: '.actions-column',
      content: 'Edit or delete tasks using these actions.',
      placement: 'left',
    },
  ];

  return (
    <div className="space-y-6 relative">
      {/* Onboarding Tour */}
      {/* @ts-expect-error Joyride JSX type incompatibility workaround */}
      <Joyride
        steps={tourSteps}
        run={tourOpen}
        continuous
        showSkipButton
        showProgress
        styles={{ options: { zIndex: 10000 } }}
        callback={(data) => {
          if (data.status === 'finished' || data.status === 'skipped') {
            setTourOpen(false);
          }
        }}
      />
      {/* Subtle Help Icon Button in the top-right corner */}
      <button
        className="fixed top-6 right-8 z-50 bg-white/80 hover:bg-hsbc-primary/90 text-hsbc-primary hover:text-white rounded-full p-2 shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-hsbc-primary group"
        style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
        onClick={() => setTourOpen(true)}
        aria-label="Take a tour"
        title="Take a tour"
      >
        <HelpCircle size={22} className="transition-colors duration-200" />
        <span className="sr-only">Take a tour</span>
      </button>
      {/* Header section with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-hsbc-primary via-hsbc-dark to-hsbc-primary rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center main-navbar">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-3">Workflow Management</h1>
            <p className="text-white/90 text-lg max-w-2xl">
              Manage banking tasks and leverage AI to detect duplicates, ensuring efficient workflow processing.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="add-task-btn mt-4 md:mt-0 inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
          >
            <Plus size={20} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
            Add New Task
          </button>
        </div>
      </div>

      {/* Search and Filter controls */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in workflow-filters" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, customer, or description"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-hsbc-primary/20 focus:border-hsbc-primary transition-all duration-200 sm:text-sm"
            />
          </div>
          
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={handleFilterOpen}
              className="w-full md:w-auto inline-flex justify-between items-center px-4 py-3 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <Filter size={18} className="mr-2 text-gray-400 group-hover:text-hsbc-primary transition-colors duration-200" />
                <span>
                  {statusFilter !== 'all' || typeFilter !== 'all' || showDuplicatesOnly
                    ? 'Filters Applied'
                    : 'Filter Tasks'}
                </span>
              </div>
              <ChevronDown 
                size={16} 
                className={`ml-2 text-gray-500 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {filterOpen && createPortal(
              <div 
                className="fixed z-[9999] filter-dropdown bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 animate-scale-in origin-top-right"
                style={{
                  top: `${filterPosition.top}px`,
                  left: `${filterPosition.left}px`,
                  width: `${filterPosition.width}px`,
                }}
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-hsbc-primary hover:text-hsbc-dark transition-colors duration-200"
                    >
                      Clear all
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={tempStatusFilter}
                        onChange={(e) => setTempStatusFilter(e.target.value as TaskStatus | 'all')}
                        className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hsbc-primary/20 focus:border-hsbc-primary transition-all duration-200"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Type
                      </label>
                      <select
                        value={tempTypeFilter}
                        onChange={(e) => setTempTypeFilter(e.target.value as TaskType | 'all')}
                        className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hsbc-primary/20 focus:border-hsbc-primary transition-all duration-200"
                      >
                        <option value="all">All Types</option>
                        <option value="loan-approval">Loan Approval</option>
                        <option value="kyc-check">KYC Check</option>
                        <option value="transaction-review">Transaction Review</option>
                        <option value="account-opening">Account Opening</option>
                        <option value="credit-check">Credit Check</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="duplicatesOnly"
                        type="checkbox"
                        checked={tempShowDuplicatesOnly}
                        onChange={(e) => setTempShowDuplicatesOnly(e.target.checked)}
                        className="h-4 w-4 text-hsbc-primary focus:ring-hsbc-primary border-gray-300 rounded transition-colors duration-200"
                      />
                      <label htmlFor="duplicatesOnly" className="ml-2 block text-sm text-gray-700">
                        Show duplicates only
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="px-4 py-2 text-sm font-medium text-white bg-hsbc-primary hover:bg-hsbc-dark border border-transparent rounded-lg shadow-sm focus:outline-none transition-all duration-200"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>

      {/* Task list with improved scrolling */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {filteredTasks.length > 0 ? (
          <div className="flex flex-col h-[calc(100vh-300px)]">
            {/* Table container with consistent structure */}
            <div className="relative flex-1 overflow-auto">
              <table className="w-full border-collapse workflow-table">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-30 bg-gray-50 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">
                      Task ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Customer Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Type & Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[250px]">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">
                      Status & Timeline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Performance
                    </th>
                    <th className="sticky right-0 z-30 bg-gray-50 px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px] actions-column">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task, index) => {
                    // Calculate customer metrics
                    const customerTasks = tasks.filter(t => t.customerId === task.customerId);
                    const customerCompletedTasks = customerTasks.filter(t => t.status === 'completed').length;
                    const customerDuplicateTasks = customerTasks.filter(t => isDuplicate(t.id)).length;
                    const customerCompletionRate = Math.round((customerCompletedTasks / customerTasks.length) * 100);
                    const customerDuplicateRate = Math.round((customerDuplicateTasks / customerTasks.length) * 100);
                    
                    // Calculate task performance with fixed timestamp calculation
                    const { hours, minutes } = calculateTaskAge(task.timestamp);
                    const isOverdue = hours >= 24;
                    const timeToComplete = task.completionTime || 0;
                    
                    return (
                      <tr 
                        key={task.id} 
                        className={`hover:bg-gray-50 transition-colors duration-200 ${
                          isDuplicate(task.id) ? 'bg-red-50/50' : 
                          isOverdue ? 'bg-yellow-50/50' : ''
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="sticky left-0 z-20 bg-white px-6 py-4 whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[180px]">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {task.id.substring(0, 8)}
                            </span>
                            {isDuplicate(task.id) && (
                              <div className="ml-2 flex items-center text-hsbc-accent bg-red-50 px-2 py-1 rounded-full text-xs">
                                <AlertTriangle size={14} className="mr-1" />
                                <span>Duplicate</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[200px]">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">{task.customerId}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center text-xs">
                                <Check size={12} className="mr-1 text-green-600" />
                                <span className="text-gray-600">{customerCompletionRate}% completion</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <AlertTriangle size={12} className="mr-1 text-red-600" />
                                <span className="text-gray-600">{customerDuplicateRate}% duplicates</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {customerTasks.length} total tasks
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[150px]">
                          <div className="flex flex-col space-y-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-hsbc-primary/10 text-hsbc-primary">
                              {task.taskType.replace('-', ' ')}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              task.priority === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {task.priority} priority
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 w-[250px]">
                          <div className="text-sm text-gray-500">
                            <div className="truncate">{task.description}</div>
                            {task.assignedTo && (
                              <div className="text-xs text-gray-400 mt-1">
                                Assigned to: {task.assignedTo}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[180px]">
                          <div className="flex flex-col space-y-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : task.status === 'in-progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : task.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status.replace('-', ' ')}
                            </span>
                            <div className="flex flex-col">
                              <div className="text-xs text-gray-500">
                                Created: {formatRelativeTime(task.timestamp)}
                              </div>
                              {task.status === 'completed' && task.completionTime && (
                                <div className="text-xs text-gray-500">
                                  Completed in: {task.completionTime} minutes
                                </div>
                              )}
                              {isOverdue && task.status !== 'completed' && (
                                <div className="text-xs text-red-600 flex items-center">
                                  <AlertTriangle size={12} className="mr-1" />
                                  Overdue
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[150px]">
                          <div className="flex flex-col space-y-2">
                            {task.status === 'completed' ? (
                              <>
                                {task.completionTime && task.completionTime > 0 ? (
                                  <>
                                    <div className="flex items-center text-xs">
                                      <Clock size={12} className="mr-1 text-green-600" />
                                      <span className="text-gray-600">
                                        {formatTimeValue(Math.min(task.completionTime, 999), 'minutes')} to complete
                                      </span>
                                    </div>
                                    <div className="flex items-center text-xs">
                                      <TrendingUp size={12} className="mr-1 text-blue-600" />
                                      <span className="text-gray-600">
                                        {formatTimeValue(Math.min(Math.round(task.completionTime / 60), 999), 'hours')} saved
                                      </span>
                                    </div>
                                    {(() => {
                                      const thresholds = TIME_THRESHOLDS[task.taskType as TaskType][task.priority as TaskPriority];
                                      const completionHours = task.completionTime / 60;
                                      const isEfficient = completionHours <= thresholds.overdue;
                                      return isEfficient ? (
                                        <div className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                          Within SLA
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                                          Exceeded SLA
                                        </div>
                                      );
                                    })()}
                                  </>
                                ) : (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock size={12} className="mr-1" />
                                    <span>Completion time not recorded</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {(() => {
                                  const { hours, minutes } = calculateTaskAge(task.timestamp);
                                  const timeStatus = getTimeStatus(task, hours);
                                  const timeDisplay = formatTimeInProgress(hours, minutes);
                                  
                                  return (
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex items-center text-xs">
                                        <Clock 
                                          size={12} 
                                          className={`mr-1 ${
                                            timeStatus.status === 'overdue' 
                                              ? 'text-red-600' 
                                              : timeStatus.status === 'warning'
                                              ? 'text-yellow-600'
                                              : 'text-gray-400'
                                          }`} 
                                        />
                                        <span className={
                                          timeStatus.status === 'overdue'
                                            ? 'text-red-600'
                                            : timeStatus.status === 'warning'
                                            ? 'text-yellow-600'
                                            : 'text-gray-500'
                                        }>
                                          {timeDisplay} in progress
                                        </span>
                                      </div>
                                      {timeStatus.status !== 'normal' && (
                                        <div className={`text-[10px] px-1.5 py-0.5 rounded ${
                                          timeStatus.status === 'overdue'
                                            ? 'text-red-600 bg-red-50'
                                            : 'text-yellow-600 bg-yellow-50'
                                        }`}>
                                          {timeStatus.message}
                                        </div>
                                      )}
                                      <div className="text-[10px] text-gray-500">
                                        SLA: {formatTimeValue(TIME_THRESHOLDS[task.taskType as TaskType][task.priority as TaskPriority].overdue, 'hours')}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="sticky right-0 z-20 bg-white px-4 py-4 whitespace-nowrap w-[100px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] actions-column">
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditClick(task)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors duration-200"
                                title="Edit task"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this task?")) {
                                    deleteTask(task.id);
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors duration-200"
                                title="Delete task"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            {isDuplicate(task.id) && (
                              <div className="flex items-center text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                <AlertTriangle size={10} className="mr-1 flex-shrink-0" />
                                <span className="truncate">
                                  {getDuplicateInfo(task.id)?.suggestedAction === 'delete' ? 'Delete' : 'Review'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No tasks found matching your filters
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {filteredTasks.length > 0 && (
        <div className="py-4 flex justify-between items-center border-t border-gray-200 mt-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredTasks.length}</span> tasks
          </div>
        </div>
      )}
      
      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20 flex items-center justify-center animate-fade-in">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Task</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTask}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    id="customerId"
                    required
                    value={newTask.customerId}
                    onChange={(e) => setNewTask({...newTask, customerId: e.target.value})}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="taskType" className="block text-sm font-medium text-gray-700">
                    Task Type
                  </label>
                  <select
                    id="taskType"
                    required
                    value={newTask.taskType}
                    onChange={(e) => setNewTask({...newTask, taskType: e.target.value as TaskType})}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                  >
                    <option value="loan-approval">Loan Approval</option>
                    <option value="kyc-check">KYC Check</option>
                    <option value="transaction-review">Transaction Review</option>
                    <option value="account-opening">Account Opening</option>
                    <option value="credit-check">Credit Check</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    required
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      required
                      value={newTask.status}
                      onChange={(e) => setNewTask({...newTask, status: e.target.value as TaskStatus})}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      required
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    id="assignedTo"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                  />
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-hsbc-primary border border-transparent rounded-md shadow-sm hover:bg-hsbc-dark focus:outline-none"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Task Modal */}
      {showEditForm && editingTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20 flex items-center justify-center animate-fade-in">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Task</h3>
              <button 
                onClick={() => {
                  setShowEditForm(false);
                  setEditingTask(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTask}>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">Task ID:</span>
                  <span className="text-sm text-gray-900">{editingTask.id.substring(0, 8)}</span>
                  
                  {isDuplicate(editingTask.id) && (
                    <div className="ml-auto flex items-center text-hsbc-accent bg-red-50 px-2 py-1 rounded text-xs">
                      <AlertTriangle size={14} className="mr-1" />
                      <span>Potential Duplicate</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="edit-customerId" className="block text-sm font-medium text-gray-700">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    id="edit-customerId"
                    required
                    value={editingTask.customerId}
                    onChange={(e) => setEditingTask({...editingTask, customerId: e.target.value})}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-taskType" className="block text-sm font-medium text-gray-700">
                    Task Type
                  </label>
                  <select
                    id="edit-taskType"
                    required
                    value={editingTask.taskType}
                    onChange={(e) => setEditingTask({...editingTask, taskType: e.target.value as TaskType})}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                  >
                    <option value="loan-approval">Loan Approval</option>
                    <option value="kyc-check">KYC Check</option>
                    <option value="transaction-review">Transaction Review</option>
                    <option value="account-opening">Account Opening</option>
                    <option value="credit-check">Credit Check</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    required
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="edit-status"
                      required
                      value={editingTask.status}
                      onChange={(e) => setEditingTask({...editingTask, status: e.target.value as TaskStatus})}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="edit-priority"
                      required
                      value={editingTask.priority || 'medium'}
                      onChange={(e) => setEditingTask({
                        ...editingTask, 
                        priority: e.target.value as 'low' | 'medium' | 'high'
                      })}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="edit-assignedTo" className="block text-sm font-medium text-gray-700">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    id="edit-assignedTo"
                    value={editingTask.assignedTo || ''}
                    onChange={(e) => setEditingTask({...editingTask, assignedTo: e.target.value})}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-hsbc-primary focus:border-hsbc-primary sm:text-sm"
                  />
                </div>
                
                {isDuplicate(editingTask.id) && (
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <h4 className="text-sm font-medium text-red-800 mb-1">Duplicate Information</h4>
                    <p className="text-xs text-red-700">
                      {getDuplicateInfo(editingTask.id)?.reason || 'Similar task detected in the system'}
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Suggested action: {getDuplicateInfo(editingTask.id)?.suggestedAction.charAt(0).toUpperCase() + 
                      (getDuplicateInfo(editingTask.id)?.suggestedAction.slice(1) || '')}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingTask(null);
                    }}
                    className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-hsbc-primary border border-transparent rounded-md shadow-sm hover:bg-hsbc-dark focus:outline-none"
                  >
                    Update Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowManagement;