import { Task, DuplicateTask, TaskType, TaskPriority } from '../types';

// Helper function to calculate Levenshtein distance for string similarity
const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

// Calculate similarity score between 0 and 1 (1 being identical)
const calculateSimilarity = (a: string, b: string): number => {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return maxLength > 0 ? 1 - distance / maxLength : 1;
};

// Check if tasks are within 24 hours of each other
const isWithin24Hours = (date1: string, date2: string): boolean => {
  const time1 = new Date(date1).getTime();
  const time2 = new Date(date2).getTime();
  const hoursDiff = Math.abs(time1 - time2) / (1000 * 60 * 60);
  return hoursDiff <= 24;
};

// Add time thresholds for different task types and priorities
export const TIME_THRESHOLDS: Record<TaskType, Record<TaskPriority, { overdue: number; warning: number }>> = {
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

// Calculate time saved based on task type and priority
const calculateTimeSaved = (task: Task): number => {
  const priority = task.priority || 'medium'; // Default to medium priority if not specified
  const thresholds = TIME_THRESHOLDS[task.taskType][priority];
  // Use the warning threshold as the base time saved (in hours)
  // Convert to minutes and add some variation based on task complexity
  const baseTime = thresholds.warning * 60;
  // Add 20% variation to make it more realistic
  const variation = baseTime * 0.2;
  return Math.round(baseTime + (Math.random() * variation - variation / 2));
};

// Main duplicate detection algorithm
export const detectDuplicates = (tasks: Task[]): DuplicateTask[] => {
  const duplicates: DuplicateTask[] = [];
  const processedPairs = new Set<string>(); // To avoid duplicate pairs
  
  // Group tasks by customer ID for faster processing
  const tasksByCustomer: Record<string, Task[]> = {};
  tasks.forEach(task => {
    if (!tasksByCustomer[task.customerId]) {
      tasksByCustomer[task.customerId] = [];
    }
    tasksByCustomer[task.customerId].push(task);
  });
  
  // For each customer, check their tasks for duplicates
  Object.values(tasksByCustomer).forEach(customerTasks => {
    // Skip if customer has only one task
    if (customerTasks.length <= 1) return;
    
    // Check each task against others for the same customer
    for (let i = 0; i < customerTasks.length; i++) {
      const task1 = customerTasks[i];
      
      for (let j = i + 1; j < customerTasks.length; j++) {
        const task2 = customerTasks[j];
        
        // Generate unique pair ID to avoid duplicates
        const pairId = [task1.id, task2.id].sort().join('_');
        if (processedPairs.has(pairId)) continue;
        processedPairs.add(pairId);
        
        // Check if tasks are potential duplicates
        const sameType = task1.taskType === task2.taskType;
        const timeMatch = isWithin24Hours(task1.timestamp, task2.timestamp);
        const descriptionSimilarity = calculateSimilarity(task1.description, task2.description);
        
        // Determine if these are duplicates based on rules
        const isDuplicate = (
          // Rule 1: Same customer, same task type, within 24 hours
          (sameType && timeMatch) ||
          // Rule 2: Very similar description (>80% similarity)
          descriptionSimilarity > 0.8
        );
        
        if (isDuplicate) {
          // Determine which task is likely the original based on timestamp
          const [originalTask, duplicateTask] = 
            new Date(task1.timestamp) < new Date(task2.timestamp) 
              ? [task1, task2] 
              : [task2, task1];
          
          // Generate reason for flagging
          let reason = '';
          if (sameType && timeMatch) {
            reason = `Same task type for customer within 24 hours`;
          } else if (descriptionSimilarity > 0.8) {
            reason = `Very similar task description (${Math.round(descriptionSimilarity * 100)}% match)`;
          }
          
          // Determine suggested action based on similarity and status
          let suggestedAction: 'merge' | 'review' | 'delete';
          if (descriptionSimilarity > 0.9) {
            suggestedAction = 'delete';
          } else if (descriptionSimilarity > 0.85) {
            suggestedAction = 'merge';
          } else {
            suggestedAction = 'review';
          }
          
          // Add to duplicates list
          duplicates.push({
            originalTaskId: originalTask.id,
            duplicateTaskId: duplicateTask.id,
            reason,
            similarityScore: descriptionSimilarity,
            suggestedAction,
            timeSaved: calculateTimeSaved(duplicateTask)
          });
        }
      }
    }
  });
  
  return duplicates;
};

// Get original task details for a duplicate
export const getOriginalTaskDetails = (
  tasks: Task[], 
  duplicateTasks: DuplicateTask[], 
  duplicateId: string
): Task | null => {
  const duplicate = duplicateTasks.find(d => d.duplicateTaskId === duplicateId);
  if (!duplicate) return null;
  
  return tasks.find(t => t.id === duplicate.originalTaskId) || null;
};

// Extract insights by task type
export const getInsightsByTaskType = (
  tasks: Task[], 
  duplicateTasks: DuplicateTask[]
): Record<TaskType, { count: number; duplicates: number; timeSaved: number }> => {
  const insights: Record<TaskType, { count: number; duplicates: number; timeSaved: number }> = {
    'loan-approval': { count: 0, duplicates: 0, timeSaved: 0 },
    'kyc-check': { count: 0, duplicates: 0, timeSaved: 0 },
    'transaction-review': { count: 0, duplicates: 0, timeSaved: 0 },
    'account-opening': { count: 0, duplicates: 0, timeSaved: 0 },
    'credit-check': { count: 0, duplicates: 0, timeSaved: 0 }
  };
  
  // Count tasks by type
  tasks.forEach(task => {
    insights[task.taskType].count++;
  });
  
  // Count duplicates by type
  duplicateTasks.forEach(duplicate => {
    const duplicateTask = tasks.find(t => t.id === duplicate.duplicateTaskId);
    if (duplicateTask) {
      insights[duplicateTask.taskType].duplicates++;
      insights[duplicateTask.taskType].timeSaved += duplicate.timeSaved;
    }
  });
  
  return insights;
};