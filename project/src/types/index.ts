// Task types
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export type TaskType = 'loan-approval' | 'kyc-check' | 'transaction-review' | 'account-opening' | 'credit-check';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  customerId: string;
  taskType: TaskType;
  description: string;
  status: TaskStatus;
  timestamp: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  completionTime?: number; // in minutes
}

// Duplicate detection types
export interface DuplicateTask {
  originalTaskId: string;
  duplicateTaskId: string;
  reason: string;
  similarityScore: number;
  suggestedAction: 'merge' | 'review' | 'delete';
  timeSaved: number; // in minutes
}

// User types
export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  department: string;
}

// Stats and metrics
export interface DashboardMetrics {
  totalTasks: number;
  duplicatesDetected: number;
  timeSaved: number; // in minutes
  efficiencyGain: number; // percentage
  tasksByType: Record<TaskType, number>;
  tasksByStatus: Record<TaskStatus, number>;
  duplicatesByDay: Array<{ date: string; count: number }>;
}

// Report types
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  taskType?: TaskType | 'all';
}

export interface ReportData {
  metrics: DashboardMetrics;
  duplicateTasks: DuplicateTask[];
  generatedAt: string;
}