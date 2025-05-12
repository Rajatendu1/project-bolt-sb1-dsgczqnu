import React, { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { formatTimeSaved } from '../utils/reports';
import { getInsightsByTaskType } from '../utils/aiEngine';
import { 
  Lightbulb, 
  RefreshCw, 
  ArrowUpRight,
  Eye, 
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Task, DuplicateTask, TaskType } from '../types';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AiInsights = () => {
  const { tasks, duplicateTasks, refreshDuplicateDetection, loading, metrics } = useTasks();
  
  const [showDuplicateDetails, setShowDuplicateDetails] = useState<string | null>(null);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshDuplicateDetection();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  // Get insights by task type
  const taskTypeInsights = getInsightsByTaskType(tasks, duplicateTasks);
  
  // Prepare insights chart data
  const insightsChartData = {
    labels: Object.keys(taskTypeInsights).map(type => 
      type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    ),
    datasets: [
      {
        label: 'Total Tasks',
        data: Object.values(taskTypeInsights).map(insight => insight.count),
        backgroundColor: 'rgba(0, 48, 135, 0.7)',
        borderColor: 'rgba(0, 48, 135, 1)',
        borderWidth: 1,
      },
      {
        label: 'Duplicates',
        data: Object.values(taskTypeInsights).map(insight => insight.duplicates),
        backgroundColor: 'rgba(219, 0, 17, 0.7)',
        borderColor: 'rgba(219, 0, 17, 1)',
        borderWidth: 1,
      }
    ],
  };
  
  // Filter duplicates by selected task type
  const filteredDuplicates = duplicateTasks.filter(duplicate => {
    if (selectedTaskType === 'all') return true;
    
    const duplicateTask = tasks.find(t => t.id === duplicate.duplicateTaskId);
    return duplicateTask?.taskType === selectedTaskType;
  });
  
  // Get task details by ID
  const getTaskById = (taskId: string): Task | undefined => {
    return tasks.find(t => t.id === taskId);
  };
  
  // Render duplicate pair details
  const renderDuplicateDetails = (duplicate: DuplicateTask) => {
    const originalTask = getTaskById(duplicate.originalTaskId);
    const duplicateTask = getTaskById(duplicate.duplicateTaskId);
    
    if (!originalTask || !duplicateTask) return null;
    
    // Function to highlight the differences between two strings
    const highlightDifferences = (str1: string, str2: string) => {
      let result = '';
      let i = 0;
      let j = 0;
      
      while (i < str1.length && j < str2.length) {
        if (str1[i] === str2[j]) {
          result += str1[i];
          i++;
          j++;
        } else {
          // Find the next matching character
          let nextMatchI = i;
          let nextMatchJ = j;
          let found = false;
          
          for (let k = i; k < i + 10 && k < str1.length; k++) {
            for (let l = j; l < j + 10 && l < str2.length; l++) {
              if (str1[k] === str2[l]) {
                nextMatchI = k;
                nextMatchJ = l;
                found = true;
                break;
              }
            }
            if (found) break;
          }
          
          if (found) {
            result += `<span class="text-hsbc-accent font-medium">${str1.substring(i, nextMatchI)}</span>`;
            i = nextMatchI;
            j = nextMatchJ;
          } else {
            result += `<span class="text-hsbc-accent font-medium">${str1.substring(i)}</span>`;
            break;
          }
        }
      }
      
      if (i < str1.length) {
        result += `<span class="text-hsbc-accent font-medium">${str1.substring(i)}</span>`;
      }
      
      return result;
    };
    
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-sm font-medium text-gray-700">Original Task</h5>
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                ID: {originalTask.id.substring(0, 8)}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Customer:</span>
                <span className="text-gray-900">{originalTask.customerId}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Type:</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-hsbc-primary/10 text-hsbc-primary">
                  {originalTask.taskType.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Status:</span>
                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  originalTask.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : originalTask.status === 'in-progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : originalTask.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {originalTask.status.replace('-', ' ')}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-600 block mb-1">Description:</span>
                <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                  {originalTask.description}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-sm font-medium text-red-600">Duplicate Task</h5>
              <span className="text-xs text-gray-500 bg-red-50 px-2 py-1 rounded-full">
                ID: {duplicateTask.id.substring(0, 8)}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Customer:</span>
                <span className="text-gray-900">{duplicateTask.customerId}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Type:</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-hsbc-primary/10 text-hsbc-primary">
                  {duplicateTask.taskType.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Status:</span>
                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  duplicateTask.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : duplicateTask.status === 'in-progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : duplicateTask.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {duplicateTask.status.replace('-', ' ')}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-600 block mb-1">Description:</span>
                <p 
                  className="text-gray-900 bg-red-50/50 rounded-lg p-3"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightDifferences(duplicateTask.description, originalTask.description) 
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 shadow-sm">
          <h5 className="text-sm font-medium text-blue-700 mb-3">AI Analysis</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <span className="text-xs font-medium text-blue-600 block mb-1">Similarity Score</span>
              <div className="flex items-center">
                <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden mr-2">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.round(duplicate.similarityScore * 100)}%`,
                      backgroundColor: duplicate.similarityScore > 0.9 
                        ? '#EF4444' 
                        : duplicate.similarityScore > 0.8 
                        ? '#F59E0B' 
                        : '#3B82F6'
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-blue-900">
                  {Math.round(duplicate.similarityScore * 100)}%
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <span className="text-xs font-medium text-blue-600 block mb-1">Detected Pattern</span>
              <p className="text-sm text-blue-900">
                {duplicate.reason}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <span className="text-xs font-medium text-blue-600 block mb-1">Suggested Action</span>
              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                duplicate.suggestedAction === 'delete' 
                  ? 'bg-red-100 text-red-800' 
                  : duplicate.suggestedAction === 'merge'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {duplicate.suggestedAction.charAt(0).toUpperCase() + duplicate.suggestedAction.slice(1)}
              </span>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <span className="text-xs font-medium text-blue-600 block mb-1">Time Saved</span>
              <p className="text-sm font-medium text-blue-900">
                {duplicate.timeSaved} minutes
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-hsbc-primary via-hsbc-dark to-hsbc-primary rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center">
            <div className="rounded-full bg-white/10 p-3 mr-4 backdrop-blur-sm">
              <Lightbulb size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">AI Insights</h1>
              <p className="text-white/90 text-lg max-w-2xl">
                Leverage AI-powered analytics to detect duplicates and optimize workflow efficiency
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw 
              size={20} 
              className={`mr-2 group-hover:scale-110 transition-transform duration-300 ${loading || isRefreshing ? 'animate-spin' : ''}`} 
            />
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 animate-scale-in group">
          <div className="flex items-center">
            <div className="rounded-full bg-hsbc-primary/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle size={24} className="text-hsbc-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Duplicates Detected</p>
              <h2 className="text-2xl font-bold text-hsbc-primary">{metrics.duplicatesDetected}</h2>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 animate-scale-in group" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center">
            <div className="rounded-full bg-hsbc-success/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Clock size={24} className="text-hsbc-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Time Saved</p>
              <h2 className="text-2xl font-bold text-hsbc-success">{formatTimeSaved(metrics.timeSaved)}</h2>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 animate-scale-in group" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center">
            <div className="rounded-full bg-hsbc-warning/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <ArrowUpRight size={24} className="text-hsbc-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Efficiency Gain</p>
              <h2 className="text-2xl font-bold text-hsbc-warning">{metrics.efficiencyGain}%</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Insights chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Task Duplication by Type</h3>
          <div className="text-sm text-gray-500">
            Hover over bars for detailed insights
          </div>
        </div>
        <div className="h-96">
          <Bar 
            data={insightsChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                    font: {
                      family: "'Inter', sans-serif"
                    }
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    font: {
                      family: "'Inter', sans-serif"
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    font: {
                      family: "'Inter', sans-serif"
                    },
                    padding: 20
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  titleColor: '#1F2937',
                  bodyColor: '#4B5563',
                  borderColor: '#E5E7EB',
                  borderWidth: 1,
                  padding: 12,
                  boxPadding: 6,
                  usePointStyle: true,
                  callbacks: {
                    label: function(context) {
                      const value = context.raw as number;
                      const datasetLabel = context.dataset.label || '';
                      
                      if (datasetLabel === 'Duplicates' && value > 0) {
                        const taskType = Object.keys(taskTypeInsights)[context.dataIndex] as TaskType;
                        const timeSaved = taskTypeInsights[taskType].timeSaved;
                        return [`${datasetLabel}: ${value}`, `Time Saved: ${timeSaved} minutes`];
                      }
                      
                      return `${datasetLabel}: ${value}`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>
      
      {/* Duplicate task list */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h3 className="text-xl font-bold text-gray-800">Detected Duplicates</h3>
            
            <div className="w-full md:w-64">
              <select
                value={selectedTaskType}
                onChange={(e) => setSelectedTaskType(e.target.value as TaskType | 'all')}
                className="block w-full pl-4 pr-10 py-2.5 text-sm border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-hsbc-primary/20 focus:border-hsbc-primary transition-all duration-200"
              >
                <option value="all">All Task Types</option>
                <option value="loan-approval">Loan Approval</option>
                <option value="kyc-check">KYC Check</option>
                <option value="transaction-review">Transaction Review</option>
                <option value="account-opening">Account Opening</option>
                <option value="credit-check">Credit Check</option>
              </select>
            </div>
          </div>
        </div>
        
        {filteredDuplicates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duplicate Task
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Task
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Similarity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suggested Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDuplicates.map((duplicate, index) => {
                  const duplicateTask = getTaskById(duplicate.duplicateTaskId);
                  const originalTask = getTaskById(duplicate.originalTaskId);
                  
                  if (!duplicateTask || !originalTask) return null;
                  
                  return (
                    <React.Fragment key={`${duplicate.originalTaskId}_${duplicate.duplicateTaskId}`}>
                      <tr 
                        className="hover:bg-gray-50 transition-colors duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {duplicate.duplicateTaskId.substring(0, 8)}
                            </span>
                            <div className="ml-2 flex items-center text-hsbc-accent bg-red-50 px-2 py-1 rounded-full text-xs">
                              <AlertTriangle size={14} className="mr-1" />
                              <span>Duplicate</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {duplicate.originalTaskId.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {duplicateTask.customerId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-hsbc-primary/10 text-hsbc-primary">
                            {duplicateTask.taskType.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.round(duplicate.similarityScore * 100)}%`,
                                  backgroundColor: duplicate.similarityScore > 0.9 
                                    ? '#EF4444' 
                                    : duplicate.similarityScore > 0.8 
                                    ? '#F59E0B' 
                                    : '#3B82F6'
                                }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {Math.round(duplicate.similarityScore * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            duplicate.suggestedAction === 'delete' 
                              ? 'bg-red-100 text-red-800' 
                              : duplicate.suggestedAction === 'merge'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {duplicate.suggestedAction.charAt(0).toUpperCase() + duplicate.suggestedAction.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setShowDuplicateDetails(
                              showDuplicateDetails === `${duplicate.originalTaskId}_${duplicate.duplicateTaskId}` 
                                ? null 
                                : `${duplicate.originalTaskId}_${duplicate.duplicateTaskId}`
                            )}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-lg text-hsbc-primary hover:bg-hsbc-primary hover:text-white transition-colors duration-200"
                          >
                            {showDuplicateDetails === `${duplicate.originalTaskId}_${duplicate.duplicateTaskId}` 
                              ? <CheckCircle size={16} className="mr-1.5" /> 
                              : <Eye size={16} className="mr-1.5" />
                            }
                            {showDuplicateDetails === `${duplicate.originalTaskId}_${duplicate.duplicateTaskId}` 
                              ? 'Hide' 
                              : 'View'
                            }
                          </button>
                        </td>
                      </tr>
                      {showDuplicateDetails === `${duplicate.originalTaskId}_${duplicate.duplicateTaskId}` && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50/50">
                            {renderDuplicateDetails(duplicate)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50/50">
            {loading ? (
              <div className="flex justify-center items-center space-x-3">
                <RefreshCw size={20} className="animate-spin text-hsbc-primary" />
                <span className="text-gray-600">Analyzing tasks...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-gray-400 mb-2">
                  <AlertTriangle size={48} className="mx-auto" />
                </div>
                <p className="text-gray-600">No duplicates found for the selected task type</p>
                <button
                  onClick={() => setSelectedTaskType('all')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-hsbc-primary hover:text-hsbc-dark transition-colors duration-200"
                >
                  View all task types
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiInsights;