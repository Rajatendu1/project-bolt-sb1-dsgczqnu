import { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { formatTimeSaved } from '../utils/reports';
import { TaskType } from '../types';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Users,
  Timer,
  Activity,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Zap,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Map,
  Filter,
  ChevronDown,
  DollarSign
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, RadialLinearScale } from 'chart.js';
import { Bar, Pie, Line, Radar } from 'react-chartjs-2';
import { detectDuplicates, TIME_THRESHOLDS } from '../utils/aiEngine';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, RadialLinearScale);

const Dashboard = () => {
  const { tasks, duplicateTasks, metrics, refreshDuplicateDetection, loading } = useTasks();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshDuplicateDetection();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Prepare chart data
  const taskTypeChartData = {
    labels: Object.keys(metrics.tasksByType).map((type: string) => 
      type.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    ),
    datasets: [
      {
        label: 'Tasks by Type',
        data: Object.values(metrics.tasksByType),
        backgroundColor: [
          'rgba(0, 48, 135, 0.8)',  // HSBC primary
          'rgba(0, 48, 135, 0.6)',
          'rgba(0, 48, 135, 0.4)',
          'rgba(219, 0, 17, 0.8)',  // HSBC accent
          'rgba(219, 0, 17, 0.6)',
        ],
        borderColor: [
          'rgba(0, 48, 135, 1)',
          'rgba(0, 48, 135, 1)',
          'rgba(0, 48, 135, 1)',
          'rgba(219, 0, 17, 1)',
          'rgba(219, 0, 17, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const taskStatusChartData = {
    labels: Object.keys(metrics.tasksByStatus).map(status => 
      status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    ),
    datasets: [
      {
        label: 'Tasks by Status',
        data: Object.values(metrics.tasksByStatus),
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',  // Success/Completed
          'rgba(245, 158, 11, 0.7)',  // Warning/In-progress
          'rgba(239, 68, 68, 0.7)',   // Error/Cancelled
          'rgba(107, 114, 128, 0.7)', // Gray/Pending
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare duplicate trend data
  const duplicateTrendData = {
    labels: metrics.duplicatesByDay.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Duplicates Detected',
        data: metrics.duplicatesByDay.map(d => d.count),
        backgroundColor: 'rgba(219, 0, 17, 0.7)',
        borderColor: 'rgba(219, 0, 17, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner with quick actions */}
      <div className="relative overflow-hidden bg-gradient-to-r from-hsbc-primary via-hsbc-dark to-hsbc-primary rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-3">Welcome to BankFlowAI</h1>
            <p className="text-white/90 text-lg max-w-2xl mb-4">
          BankFlowAI leverages AI to eliminate duplicate tasks, saving time and boosting efficiency for HSBC's banking workflows.
        </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
              >
                <RefreshCw size={18} className={`mr-2 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="text-right">
              <p className="text-white/80 text-sm">Last Updated</p>
              <p className="text-white font-medium">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-scale-in group">
          <div className="flex items-center">
            <div className="rounded-xl bg-hsbc-primary/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle size={24} className="text-hsbc-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Tasks</p>
              <h3 className="text-2xl font-bold text-gray-800">{metrics.totalTasks}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-scale-in group" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center">
            <div className="rounded-xl bg-hsbc-accent/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle size={24} className="text-hsbc-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Duplicates Detected</p>
              <h3 className="text-2xl font-bold text-gray-800">{metrics.duplicatesDetected}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-scale-in group" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center">
            <div className="rounded-xl bg-hsbc-success/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Clock size={24} className="text-hsbc-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Time Saved</p>
              <h3 className="text-2xl font-bold text-gray-800">{formatTimeSaved(metrics.timeSaved)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-scale-in group" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center">
            <div className="rounded-xl bg-hsbc-secondary/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={24} className="text-hsbc-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Efficiency Gain</p>
              <h3 className="text-2xl font-bold text-gray-800">{metrics.efficiencyGain}%</h3>
            </div>
          </div>
        </div>

        {/* New KPI: Average Task Completion Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-scale-in group" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center">
            <div className="rounded-xl bg-hsbc-info/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Timer size={24} className="text-hsbc-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg. Completion Time</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {metrics.totalTasks > 0 
                  ? Math.round(tasks.reduce((sum, task) => sum + (task.completionTime || 0), 0) / metrics.totalTasks)
                  : 0}m
              </h3>
            </div>
          </div>
        </div>

        {/* New KPI: Active Customers */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-scale-in group" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center">
            <div className="rounded-xl bg-hsbc-warning/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Users size={24} className="text-hsbc-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Customers</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {new Set(tasks.map(task => task.customerId)).size}
              </h3>
            </div>
          </div>
        </div>

        {/* New KPI: SLA Compliance */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-scale-in group" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center">
            <div className="rounded-xl bg-hsbc-success/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Target size={24} className="text-hsbc-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">SLA Compliance</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {metrics.totalTasks > 0
                  ? (() => {
                      const compliant = tasks.filter(task => {
                        if (task.status !== 'completed' || !task.completionTime) return false;
                        const priority = task.priority || 'medium';
                        const thresholds = TIME_THRESHOLDS[task.taskType][priority];
                        const slaMinutes = thresholds.overdue * 60;
                        return task.completionTime <= slaMinutes;
                      }).length;
                      return Math.round((compliant / metrics.totalTasks) * 100);
                    })()
                  : 0}%
              </h3>
            </div>
          </div>
        </div>

        {/* New KPI: Risk Score */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-scale-in group" style={{ animationDelay: '0.7s' }}>
          <div className="flex items-center">
            <div className="rounded-xl bg-hsbc-accent/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Shield size={24} className="text-hsbc-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Risk Score</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {Math.round((metrics.duplicatesDetected / metrics.totalTasks) * 100)}%
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="rounded-lg bg-hsbc-primary/10 p-2 mr-3">
                <BarChartIcon size={20} className="text-hsbc-primary" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Tasks by Type</h2>
            </div>
            <button 
              onClick={handleRefresh}
              className="text-sm text-hsbc-primary hover:text-hsbc-dark flex items-center px-3 py-1.5 rounded-lg hover:bg-hsbc-light/50 transition-all duration-200"
              disabled={isRefreshing || loading}
            >
              <RefreshCw size={16} className={`mr-1.5 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <div className="h-64">
            <Bar 
              data={taskTypeChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
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
                        const total = taskTypeChartData.datasets[0].data.reduce((a, b) => (a as number) + (b as number), 0) as number;
                        const percentage = Math.round((value / total) * 100);
                        return `${value} tasks (${percentage}%)`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                      font: {
                        size: 11
                      }
                    },
                    grid: {
                      color: '#F3F4F6'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: 11
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Tasks by Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="rounded-lg bg-hsbc-primary/10 p-2 mr-3">
                <PieChartIcon size={20} className="text-hsbc-primary" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Tasks by Status</h2>
            </div>
          </div>
          <div className="h-64">
            <Pie 
              data={{
                labels: Object.keys(metrics.tasksByStatus).map(status => 
                  status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                ),
                datasets: [{
                  data: Object.values(metrics.tasksByStatus),
                  backgroundColor: [
                    'rgba(16, 185, 129, 0.7)',  // Completed - Green
                    'rgba(245, 158, 11, 0.7)',  // In Progress - Yellow
                    'rgba(59, 130, 246, 0.7)',  // Pending - Blue
                    'rgba(239, 68, 68, 0.7)'    // Cancelled - Red
                  ],
                  borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)'
                  ],
                  borderWidth: 1
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      padding: 20,
                      usePointStyle: true
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Duplicates Detected Over Time Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="rounded-lg bg-hsbc-accent/10 p-2 mr-3">
                <AlertTriangle size={20} className="text-hsbc-accent" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Duplicates Detected Over Time</h2>
      </div>
            <div className="text-sm text-gray-500">Last 7 days</div>
        </div>
        <div className="h-64">
            <Bar
              data={{
                labels: metrics.duplicatesByDay.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                  {
                    label: 'Duplicates Detected',
                    data: metrics.duplicatesByDay.map(d => d.count),
                    backgroundColor: 'rgba(219, 0, 17, 0.7)',
                    borderColor: 'rgba(219, 0, 17, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.raw} duplicates`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    title: {
                      display: true,
                      text: 'Duplicates'
                    }
                  },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* New Chart: Task Completion Trends */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="rounded-lg bg-hsbc-info/10 p-2 mr-3">
                <TrendingUp size={20} className="text-hsbc-info" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Task Completion Trends</h2>
            </div>
            <div className="text-sm text-gray-500">
              Last 7 days
            </div>
          </div>
          <div className="h-64">
            <Line 
              data={{
                labels: useMemo(() => {
                  const dates = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  });
                  return dates;
                }, []),
                datasets: [
                  {
                    label: 'Completion Rate',
                    data: useMemo(() => {
                      const last7Days = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        
                        const dayTasks = tasks.filter(task => {
                          const taskDate = new Date(task.timestamp).toISOString().split('T')[0];
                          return taskDate === dateStr;
                        });
                        
                        const completedTasks = dayTasks.filter(task => task.status === 'completed');
                        return dayTasks.length > 0 
                          ? Math.round((completedTasks.length / dayTasks.length) * 100)
                          : 0;
                      });
                      return last7Days;
                    }, [tasks]),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                  },
                  {
                    label: 'Avg. Processing Time (hours)',
                    data: useMemo(() => {
                      const last7Days = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        
                        const completedTasks = tasks.filter(task => {
                          const taskDate = new Date(task.timestamp).toISOString().split('T')[0];
                          return taskDate === dateStr && task.status === 'completed' && task.completionTime;
                        });
                        
                        if (completedTasks.length === 0) return 0;
                        
                        const avgTime = completedTasks.reduce((sum, task) => 
                          sum + (task.completionTime || 0), 0
                        ) / completedTasks.length;
                        
                        return Math.round((avgTime / 60) * 10) / 10; // Convert to hours with 1 decimal
                      });
                      return last7Days;
                    }, [tasks]),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value}${label.includes('Rate') ? '%' : 'h'}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Completion Rate (%)'
                    },
                    min: 0,
                    max: 100
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Processing Time (hours)'
                    },
                    min: 0,
                    grid: {
                      drawOnChartArea: false
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Average Completion Rate</div>
              <div className="text-lg font-bold text-hsbc-success">
                {useMemo(() => {
                  const completedTasks = tasks.filter(t => t.status === 'completed');
                  return Math.round((completedTasks.length / tasks.length) * 100);
                }, [tasks])}%
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Average Processing Time</div>
              <div className="text-lg font-bold text-hsbc-info">
                {useMemo(() => {
                  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completionTime);
                  if (completedTasks.length === 0) return '0h';
                  const avgTime = completedTasks.reduce((sum, task) => 
                    sum + (task.completionTime || 0), 0
                  ) / completedTasks.length;
                  return `${Math.round((avgTime / 60) * 10) / 10}h`;
                }, [tasks])}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time-based Analytics */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
          <div className="flex items-center mb-4">
            <div className="rounded-lg bg-hsbc-primary/10 p-2 mr-3">
              <ClockIcon size={20} className="text-hsbc-primary" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Time-based Analytics</h2>
          </div>
          <div className="space-y-6">
            {/* Peak Activity Hours */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Peak Activity Hours</h3>
              <div className="h-40">
                <Bar 
                  data={{
                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                    datasets: [{
                      label: 'Tasks Created',
                      data: useMemo(() => {
                        const hourlyTasks = Array(24).fill(0);
                        tasks.forEach(task => {
                          const hour = new Date(task.timestamp).getHours();
                          hourlyTasks[hour]++;
                        });
                        return hourlyTasks;
                      }, [tasks]),
                      backgroundColor: 'rgba(0, 48, 135, 0.7)',
                      borderColor: 'rgba(0, 48, 135, 1)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.raw} tasks`
                        }
                      }
                    },
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0 } },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>

            {/* Task Completion Trends */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Task Completion Trends</h3>
              <div className="h-40">
                <Line 
                  data={{
                    labels: useMemo(() => {
                      const last7Days = Array.from({length: 7}, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }).reverse();
                      return last7Days;
                    }, []),
                    datasets: [{
                      label: 'Completion Time (min)',
                      data: useMemo(() => {
                        const dailyAvg = Array(7).fill(0);
                        const dailyCount = Array(7).fill(0);
                        
                        tasks.forEach(task => {
                          if (task.status === 'completed' && task.completionTime) {
                            const date = new Date(task.timestamp);
                            const dayIndex = 6 - Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
                            if (dayIndex >= 0 && dayIndex < 7) {
                              dailyAvg[dayIndex] += task.completionTime;
                              dailyCount[dayIndex]++;
                            }
                          }
                        });
                        
                        return dailyAvg.map((sum, i) => 
                          dailyCount[i] ? Math.round(sum / dailyCount[i]) : 0
                        );
                      }, [tasks]),
                      borderColor: 'rgba(16, 185, 129, 1)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.raw} minutes average`
                        }
                      }
                    },
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0 } },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Analytics */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
          <div className="flex items-center mb-4">
            <div className="rounded-lg bg-hsbc-success/10 p-2 mr-3">
              <Users size={20} className="text-hsbc-success" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Customer Analytics</h2>
          </div>
          <div className="space-y-6">
            {/* Top Customers */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Top Customers by Task Volume</h3>
              <div className="space-y-3">
                {useMemo(() => {
                  const customerTasks = tasks.reduce((acc, task) => {
                    acc[task.customerId] = (acc[task.customerId] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  return Object.entries(customerTasks)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([customerId, count]) => (
                      <div key={customerId} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-hsbc-primary/10 flex items-center justify-center mr-3">
                            <Users size={16} className="text-hsbc-primary" />
                          </div>
                          <span className="text-sm text-gray-600">{customerId}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden mr-2">
                            <div 
                              className="h-full bg-hsbc-primary rounded-full"
                              style={{ width: `${(count / Math.max(...Object.values(customerTasks))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-800">{count}</span>
                        </div>
                      </div>
                    ));
                }, [tasks])}
              </div>
            </div>

            {/* Customer Risk Assessment */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Customer Risk Assessment</h3>
              <div className="h-64">
                <Radar 
                  data={{
                    labels: ['Task Volume', 'Duplicate Rate', 'Completion Time', 'SLA Compliance', 'Risk Score'],
                    datasets: [{
                      label: 'Average Customer Profile',
                      data: useMemo(() => {
                        const MAX_COMPLETION_TIME = 120; // 120 minutes (2 hours) as reasonable max
                        const customerMetrics = tasks.reduce((acc, task) => {
                          if (!acc[task.customerId]) {
                            acc[task.customerId] = {
                              taskCount: 0,
                              duplicateCount: 0,
                              completionTime: 0,
                              completedCount: 0,
                              slaCompliantCount: 0
                            };
                          }
                          acc[task.customerId].taskCount++;
                          if (task.status === 'completed') {
                            acc[task.customerId].completedCount++;
                            acc[task.customerId].completionTime += task.completionTime || 0;
                            if (task.completionTime && task.completionTime <= 30) {
                              acc[task.customerId].slaCompliantCount++;
                            }
                          }
                          return acc;
                        }, {} as Record<string, any>);

                        const duplicateCounts = duplicateTasks.reduce((acc, dup) => {
                          const task = tasks.find(t => t.id === dup.duplicateTaskId);
                          if (task) {
                            acc[task.customerId] = (acc[task.customerId] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>);

                        const metrics = Object.entries(customerMetrics).map(([customerId, metrics]) => {
                          const avgCompletion = metrics.completedCount ? metrics.completionTime / metrics.completedCount : 0;
                          // Normalize completion time: 100 is best (fastest), 0 is slowest
                          const normalizedCompletion = Math.max(0, 100 - (avgCompletion / MAX_COMPLETION_TIME) * 100);
                          return {
                            taskVolume: metrics.taskCount,
                            duplicateRate: (duplicateCounts[customerId] || 0) / metrics.taskCount,
                            completionTime: normalizedCompletion,
                            slaCompliance: metrics.completedCount ? metrics.slaCompliantCount / metrics.completedCount : 0,
                            riskScore: (duplicateCounts[customerId] || 0) / metrics.taskCount
                          };
                        });

                        const averages = metrics.reduce((acc, curr) => ({
                          taskVolume: acc.taskVolume + curr.taskVolume,
                          duplicateRate: acc.duplicateRate + curr.duplicateRate,
                          completionTime: acc.completionTime + curr.completionTime,
                          slaCompliance: acc.slaCompliance + curr.slaCompliance,
                          riskScore: acc.riskScore + curr.riskScore
                        }), {
                          taskVolume: 0,
                          duplicateRate: 0,
                          completionTime: 0,
                          slaCompliance: 0,
                          riskScore: 0
                        });

                        const count = metrics.length;
                        return [
                          Math.round(averages.taskVolume / count),
                          Math.round((averages.duplicateRate / count) * 100),
                          Math.round(averages.completionTime / count),
                          Math.round((averages.slaCompliance / count) * 100),
                          Math.round((averages.riskScore / count) * 100)
                        ];
                      }, [tasks, duplicateTasks]),
                      backgroundColor: 'rgba(0, 48, 135, 0.2)',
                      borderColor: 'rgba(0, 48, 135, 1)',
                      pointBackgroundColor: 'rgba(0, 48, 135, 1)',
                      pointBorderColor: '#fff',
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: 'rgba(0, 48, 135, 1)'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: 30 }, // Add padding to prevent lines from crossing text
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { display: false },
                        pointLabels: {
                          font: { size: 14 },
                          padding: 16 // More space for labels
                        }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const labels = ['tasks', '%', 'score', '%', '%'];
                            return `${context.raw}${labels[context.dataIndex]}`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Complexity Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
          <div className="flex items-center mb-4">
            <div className="rounded-lg bg-hsbc-warning/10 p-2 mr-3">
              <Filter size={20} className="text-hsbc-warning" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Task Complexity Analysis</h2>
          </div>
          <div className="space-y-6">
            {/* Priority Distribution */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Priority Distribution</h3>
              <div className="h-40">
                <Pie 
                  data={{
                    labels: ['High', 'Medium', 'Low'],
                    datasets: [{
                      data: useMemo(() => {
                        const priorities = tasks.reduce((acc, task) => {
                          if (task.priority) {
                            acc[task.priority] = (acc[task.priority] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>);
                        return [
                          priorities.high || 0,
                          priorities.medium || 0,
                          priorities.low || 0
                        ];
                      }, [tasks]),
                      backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',   // High - Red
                        'rgba(245, 158, 11, 0.7)',  // Medium - Yellow
                        'rgba(16, 185, 129, 0.7)'   // Low - Green
                      ],
                      borderColor: [
                        'rgba(239, 68, 68, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(16, 185, 129, 1)'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          boxWidth: 15,
                          padding: 15,
                          font: { size: 11 }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = Math.round((context.raw as number / total) * 100);
                            return `${context.raw} tasks (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Task Resolution Patterns */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Task Resolution Patterns</h3>
              <div className="space-y-3">
                {useMemo(() => {
                  const taskTypes = Object.keys(metrics.tasksByType) as TaskType[];
                  return taskTypes.map(type => {
                    const typeTasks = tasks.filter(t => t.taskType === type);
                    const completedTasks = typeTasks.filter(t => t.status === 'completed');
                    const avgCompletionTime = completedTasks.length > 0
                      ? completedTasks.reduce((sum, task) => sum + (task.completionTime || 0), 0) / completedTasks.length
                      : 0;
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-hsbc-primary/10 flex items-center justify-center mr-3">
                            <CheckCircle size={16} className="text-hsbc-primary" />
                          </div>
                          <span className="text-sm text-gray-600">
                            {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Avg. Time</div>
                            <div className="text-sm font-medium text-gray-800">
                              {Math.round(avgCompletionTime)}m
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Completion Rate</div>
                            <div className="text-sm font-medium text-gray-800">
                              {typeTasks.length > 0 ? Math.round((completedTasks.length / typeTasks.length) * 100) : 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                }, [tasks, metrics])}
              </div>
            </div>
          </div>
        </div>

        {/* Cost Savings Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
          <div className="flex items-center mb-4">
            <div className="rounded-lg bg-hsbc-success/10 p-2 mr-3">
              <DollarSign size={20} className="text-hsbc-success" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Cost Savings Analysis</h2>
          </div>
          <div className="space-y-6">
            {/* Time Saved by Task Type */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Time Saved by Task Type</h3>
              <div className="h-40">
                <Bar 
                  data={{
                    labels: Object.keys(metrics.tasksByType).map(type => 
                      type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                    ),
                    datasets: [{
                      label: 'Time Saved (hours)',
                      data: useMemo(() => {
                        const timeByType = duplicateTasks.reduce((acc, dup) => {
                          const task = tasks.find(t => t.id === dup.duplicateTaskId);
                          if (task) {
                            acc[task.taskType] = (acc[task.taskType] || 0) + dup.timeSaved;
                          }
                          return acc;
                        }, {} as Record<TaskType, number>);
                        
                        return Object.keys(metrics.tasksByType).map(type => 
                          Math.round((timeByType[type as TaskType] || 0) / 60)
                        );
                      }, [duplicateTasks, tasks, metrics]),
                      backgroundColor: 'rgba(16, 185, 129, 0.7)',
                      borderColor: 'rgba(16, 185, 129, 1)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.raw} hours saved`
                        }
                      }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        title: {
                          display: true,
                          text: 'Hours'
                        }
                      },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>

            {/* Cost Impact Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Total Time Saved</div>
                <div className="text-2xl font-bold text-hsbc-success">
                  {Math.round(metrics.timeSaved / 60)}h
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {Math.round(metrics.timeSaved / 60 / 8)} working days
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Efficiency Gain</div>
                <div className="text-2xl font-bold text-hsbc-primary">
                  {metrics.efficiencyGain}%
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {Math.round(metrics.duplicatesDetected / metrics.totalTasks * 100)}% duplicate rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent duplicates */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-hsbc-accent/10 p-2 mr-3">
              <AlertTriangle size={20} className="text-hsbc-accent" />
            </div>
          <h2 className="text-lg font-bold text-gray-800">Recently Detected Duplicates</h2>
          </div>
          <a 
            href="/insights"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/insights';
            }}
            className="text-sm text-hsbc-primary hover:text-hsbc-dark px-3 py-1.5 rounded-lg hover:bg-hsbc-light/50 transition-all duration-200"
          >
            View All
          </a>
        </div>
        
        {duplicateTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Similarity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggested Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {duplicateTasks.slice(0, 5).map((duplicate, index) => {
                  const duplicateTask = tasks.find(t => t.id === duplicate.duplicateTaskId);
                  if (!duplicateTask) return null;
                  
                  return (
                    <tr 
                      key={duplicate.duplicateTaskId} 
                      className="hover:bg-gray-50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {duplicate.duplicateTaskId.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {duplicateTask.customerId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {duplicateTask.taskType.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-hsbc-accent/10 text-hsbc-accent">
                        {Math.round(duplicate.similarityScore * 100)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-hsbc-success/10 text-hsbc-success">
                          {duplicate.suggestedAction.charAt(0).toUpperCase() + duplicate.suggestedAction.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <AlertTriangle size={24} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No duplicates detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;