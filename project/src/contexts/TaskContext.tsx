import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, DuplicateTask, DashboardMetrics, TaskType, TaskStatus } from '../types';
import { generateMockTasks } from '../utils/mockData';
import { detectDuplicates, TIME_THRESHOLDS } from '../utils/aiEngine';

interface TaskContextType {
  tasks: Task[];
  duplicateTasks: DuplicateTask[];
  metrics: DashboardMetrics;
  addTask: (task: Omit<Task, 'id' | 'timestamp'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  refreshDuplicateDetection: () => void;
  loading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [duplicateTasks, setDuplicateTasks] = useState<DuplicateTask[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalTasks: 0,
    duplicatesDetected: 0,
    timeSaved: 0,
    efficiencyGain: 0,
    tasksByType: {
      'loan-approval': 0,
      'kyc-check': 0,
      'transaction-review': 0,
      'account-opening': 0,
      'credit-check': 0
    },
    tasksByStatus: {
      'pending': 0,
      'in-progress': 0,
      'completed': 0,
      'cancelled': 0
    },
    duplicatesByDay: []
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize tasks on mount
  useEffect(() => {
    // Check if tasks exist in localStorage
    const storedTasks = localStorage.getItem('bankflowai_tasks');
    let parsedTasks;
    if (storedTasks) {
      try {
        parsedTasks = JSON.parse(storedTasks);
        // MIGRATION: Set completionTime for completed tasks without it
        let updated = false;
        const now = new Date().getTime();
        parsedTasks = parsedTasks.map((task: any) => {
          if (task.status === 'completed' && (task.completionTime === undefined || task.completionTime === null)) {
            const start = new Date(task.timestamp).getTime();
            // Only set if timestamp is valid
            if (!isNaN(start)) {
              task.completionTime = Math.round((now - start) / (1000 * 60));
              updated = true;
            }
          }
          return task;
        });
        if (updated) {
          localStorage.setItem('bankflowai_tasks', JSON.stringify(parsedTasks));
        }
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error parsing stored tasks:', error);
        // If error, generate new mock tasks
        const initialTasks = generateMockTasks(100);
        setTasks(initialTasks);
        localStorage.setItem('bankflowai_tasks', JSON.stringify(initialTasks));
      }
    } else {
      // Generate mock tasks if none exist
      const initialTasks = generateMockTasks(100);
      setTasks(initialTasks);
      localStorage.setItem('bankflowai_tasks', JSON.stringify(initialTasks));
    }
    setLoading(false);
  }, []);

  // Run AI engine to detect duplicates whenever tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      refreshDuplicateDetection();
    }
  }, [tasks]);

  // Calculate metrics whenever duplicates or tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      calculateMetrics();
    }
  }, [tasks, duplicateTasks]);

  // Helper to calculate metrics
  const calculateMetrics = () => {
    // Calculate tasks by type
    const tasksByType: Record<TaskType, number> = {
      'loan-approval': 0,
      'kyc-check': 0,
      'transaction-review': 0,
      'account-opening': 0,
      'credit-check': 0
    };
    
    // Calculate tasks by status
    const tasksByStatus: Record<TaskStatus, number> = {
      'pending': 0,
      'in-progress': 0,
      'completed': 0,
      'cancelled': 0
    };
    
    tasks.forEach(task => {
      tasksByType[task.taskType]++;
      tasksByStatus[task.status]++;
    });
    
    // Calculate total time saved using the proper calculation from aiEngine
    const timeSaved = duplicateTasks.reduce((total, duplicate) => {
      const task = tasks.find(t => t.id === duplicate.duplicateTaskId);
      return total + (task ? duplicate.timeSaved : 0);
    }, 0);
    
    // Calculate efficiency gain as percentage of time saved relative to total task time
    const totalTaskTime = tasks.reduce((total, task) => {
      const thresholds = TIME_THRESHOLDS[task.taskType][task.priority || 'medium'];
      return total + (thresholds.warning * 60); // Convert warning threshold to minutes
    }, 0);
    
    const efficiencyGain = totalTaskTime > 0 
      ? Math.round((timeSaved / totalTaskTime) * 100) 
      : 0;
    
    // Group duplicates by day
    const duplicatesByDay: Array<{ date: string; count: number }> = [];
    const duplicateDates = new Map<string, number>();
    
    duplicateTasks.forEach(duplicate => {
      const originalTask = tasks.find(t => t.id === duplicate.originalTaskId);
      if (originalTask) {
        const date = new Date(originalTask.timestamp).toISOString().split('T')[0];
        duplicateDates.set(date, (duplicateDates.get(date) || 0) + 1);
      }
    });
    
    duplicateDates.forEach((count, date) => {
      duplicatesByDay.push({ date, count });
    });
    
    duplicatesByDay.sort((a, b) => a.date.localeCompare(b.date));
    
    setMetrics({
      totalTasks: tasks.length,
      duplicatesDetected: duplicateTasks.length,
      timeSaved,
      efficiencyGain,
      tasksByType,
      tasksByStatus,
      duplicatesByDay
    });
  };

  // Run AI engine to detect duplicates
  const refreshDuplicateDetection = () => {
    setLoading(true);
    // Simulating an AI process with a small delay
    setTimeout(() => {
      const newDuplicates = detectDuplicates(tasks);
      setDuplicateTasks(newDuplicates);
      setLoading(false);
    }, 500);
  };

  // Add a new task
  const addTask = (task: Omit<Task, 'id' | 'timestamp'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString()
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('bankflowai_tasks', JSON.stringify(updatedTasks));
  };

  // Update an existing task
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    
    setTasks(updatedTasks);
    localStorage.setItem('bankflowai_tasks', JSON.stringify(updatedTasks));
  };

  // Delete a task
  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem('bankflowai_tasks', JSON.stringify(updatedTasks));
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      duplicateTasks,
      metrics,
      addTask,
      updateTask,
      deleteTask,
      refreshDuplicateDetection,
      loading
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};