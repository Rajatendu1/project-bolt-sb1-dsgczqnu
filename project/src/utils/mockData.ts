import { Task, TaskType, TaskStatus } from '../types';

// Customer ID generation helper
const generateCustomerId = () => {
  const prefix = 'HSBC';
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${randomDigits}`;
};

// Task description templates
const taskDescriptions = {
  'loan-approval': [
    'Review loan application for customer',
    'Process mortgage approval for',
    'Verify loan documents for',
    'Analyze credit history for loan application',
    'Finalize loan terms for customer'
  ],
  'kyc-check': [
    'Complete KYC verification for new customer',
    'Review customer identification documents',
    'Perform background check for client',
    'Update KYC records for customer',
    'Finalize KYC compliance check for'
  ],
  'transaction-review': [
    'Review high-value transaction for customer',
    'Verify international transfer details for',
    'Analyze suspicious transaction pattern for account',
    'Complete transaction approval for customer',
    'Finalize transaction security check for'
  ],
  'account-opening': [
    'Process new account application for',
    'Setup online banking for new account',
    'Complete account verification for client',
    'Initialize premium account for customer',
    'Finalize account opening procedure for'
  ],
  'credit-check': [
    'Perform credit score analysis for',
    'Review credit history for customer',
    'Complete credit risk assessment for',
    'Verify credit references for customer',
    'Finalize credit limit approval for'
  ]
};

// Create duplicate with slight variation
const createSimilarDescription = (original: string): string => {
  const variations = [
    original,
    original.replace('for customer', 'for client'),
    original.replace('Review', 'Check'),
    original.replace('Complete', 'Finish'),
    original.replace('Verify', 'Validate')
  ];
  return variations[Math.floor(Math.random() * variations.length)];
};

// Generate timestamp within the last 7 days
const generateRecentTimestamp = (): string => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 7); // 0-6 days ago
  const hoursAgo = Math.floor(Math.random() * 24); // 0-23 hours ago
  const minutesAgo = Math.floor(Math.random() * 60); // 0-59 minutes ago
  
  now.setDate(now.getDate() - daysAgo);
  now.setHours(now.getHours() - hoursAgo);
  now.setMinutes(now.getMinutes() - minutesAgo);
  
  return now.toISOString();
};

// Generate a set of mock tasks
export const generateMockTasks = (count: number): Task[] => {
  const tasks: Task[] = [];
  const taskTypes: TaskType[] = ['loan-approval', 'kyc-check', 'transaction-review', 'account-opening', 'credit-check'];
  const statuses: TaskStatus[] = ['pending', 'in-progress', 'completed', 'cancelled'];
  const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  const assignees = ['John Smith', 'Emma Wilson', 'Michael Chen', 'Priya Patel'];

  // Generate a pool of customer IDs, some with higher task volume
  const customerPool: string[] = Array.from({ length: Math.floor(count / 5) }, generateCustomerId);

  // Helper to get SLA (overdue) for a task
  const getSLA = (taskType: TaskType, priority: 'low' | 'medium' | 'high') => {
    const thresholds = {
      'loan-approval': { high: 4, medium: 8, low: 24 },
      'kyc-check': { high: 2, medium: 4, low: 8 },
      'transaction-review': { high: 1, medium: 2, low: 4 },
      'account-opening': { high: 2, medium: 4, low: 8 },
      'credit-check': { high: 4, medium: 8, low: 24 }
    };
    return thresholds[taskType][priority] * 60; // minutes
  };

  // Generate initial tasks
  for (let i = 0; i < count * 0.8; i++) {
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const descTemplate = taskDescriptions[taskType][Math.floor(Math.random() * taskDescriptions[taskType].length)];
    // Some customers get more tasks
    const customerId = customerPool[Math.floor(Math.pow(Math.random(), 2) * customerPool.length)];
    const description = descTemplate.includes('for customer') || descTemplate.includes('for client')
      ? descTemplate.replace(/for (customer|client)/, `for ${customerId}`)
      : `${descTemplate} ${customerId}`;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const assignedTo = assignees[Math.floor(Math.random() * assignees.length)];
    const timestamp = generateRecentTimestamp();

    // Realistic completion time for completed tasks
    let completionTime: number | undefined = undefined;
    if (status === 'completed') {
      const sla = getSLA(taskType, priority);
      // 70% within SLA, 30% over SLA
      if (Math.random() < 0.7) {
        completionTime = Math.round(sla * (0.5 + Math.random() * 0.5)); // 50-100% of SLA
      } else {
        completionTime = Math.round(sla * (1 + Math.random() * 0.5)); // 100-150% of SLA
      }
    }

    tasks.push({
      id: Math.random().toString(36).substring(2, 11),
      customerId,
      taskType,
      description,
      status,
      timestamp,
      priority,
      assignedTo,
      ...(completionTime !== undefined ? { completionTime } : {})
    });
  }
  
  // Add some duplicate/similar tasks (about 5% of total)
  const duplicatesCount = Math.floor(count * 0.05);
  for (let i = 0; i < duplicatesCount; i++) {
    // Randomly pick an existing task to duplicate
    const originalTask = tasks[Math.floor(Math.random() * tasks.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    let completionTime: number | undefined = undefined;
    if (status === 'completed') {
      const sla = getSLA(originalTask.taskType, originalTask.priority || 'medium');
      if (Math.random() < 0.7) {
        completionTime = Math.round(sla * (0.5 + Math.random() * 0.5));
      } else {
        completionTime = Math.round(sla * (1 + Math.random() * 0.5));
      }
    }
    const duplicateTask: Task = {
      ...originalTask,
      id: Math.random().toString(36).substring(2, 11),
      description: createSimilarDescription(originalTask.description),
      timestamp: generateRecentTimestamp(),
      status,
      ...(completionTime !== undefined ? { completionTime } : {})
    };
    tasks.push(duplicateTask);
  }
  
  return tasks;
};