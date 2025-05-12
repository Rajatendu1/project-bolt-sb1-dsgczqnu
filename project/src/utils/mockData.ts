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
  
  // Generate initial tasks
  for (let i = 0; i < count * 0.8; i++) {
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const descTemplate = taskDescriptions[taskType][Math.floor(Math.random() * taskDescriptions[taskType].length)];
    const customerId = generateCustomerId();
    
    // Add customer ID to description if template contains placeholder
    const description = descTemplate.includes('for customer') || descTemplate.includes('for client')
      ? descTemplate.replace(/for (customer|client)/, `for ${customerId}`)
      : `${descTemplate} ${customerId}`;
    
    tasks.push({
      id: Math.random().toString(36).substring(2, 11),
      customerId,
      taskType,
      description,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: generateRecentTimestamp(),
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      assignedTo: ['John Smith', 'Emma Wilson', 'Michael Chen', 'Priya Patel'][Math.floor(Math.random() * 4)]
    });
  }
  
  // Add some duplicate/similar tasks (about 20% of total)
  const duplicatesCount = count - tasks.length;
  for (let i = 0; i < duplicatesCount; i++) {
    // Randomly pick an existing task to duplicate
    const originalTask = tasks[Math.floor(Math.random() * tasks.length)];
    
    // Create a duplicate with slight variations
    const duplicateTask: Task = {
      ...originalTask,
      id: Math.random().toString(36).substring(2, 11),
      description: createSimilarDescription(originalTask.description),
      timestamp: generateRecentTimestamp(), // Different timestamp
      status: statuses[Math.floor(Math.random() * statuses.length)], // Possibly different status
    };
    
    tasks.push(duplicateTask);
  }
  
  return tasks;
};