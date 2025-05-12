export interface Task {
  id: string;
  customerId: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  priority?: 'low' | 'medium' | 'high';
  taskType?: 'loan-approval' | 'kyc-check' | 'transaction-review' | 'account-opening' | 'credit-check';
}

export interface TaskMetrics {
  totalTasks: number;
  duplicateTasks: number;
  uniqueCustomers: number;
  averageTasksPerCustomer: number;
  taskDistribution: Record<string, number>;
  duplicateDistribution: Record<string, number>;
} 