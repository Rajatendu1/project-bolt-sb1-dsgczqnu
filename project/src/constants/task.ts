import { TaskType, TaskStatus, TaskPriority } from '../types';

export const TASK_TYPES: TaskType[] = [
  'loan-approval',
  'kyc-check',
  'transaction-review',
  'account-opening',
  'credit-check'
];

export const TASK_STATUSES: TaskStatus[] = [
  'pending',
  'in-progress',
  'completed',
  'cancelled'
];

export const TASK_PRIORITIES: TaskPriority[] = [
  'low',
  'medium',
  'high'
];

export const INITIAL_TASKS_BY_TYPE: Record<TaskType, number> = {
  'loan-approval': 0,
  'kyc-check': 0,
  'transaction-review': 0,
  'account-opening': 0,
  'credit-check': 0
};

export const INITIAL_TASKS_BY_STATUS: Record<TaskStatus, number> = {
  'pending': 0,
  'in-progress': 0,
  'completed': 0,
  'cancelled': 0
}; 