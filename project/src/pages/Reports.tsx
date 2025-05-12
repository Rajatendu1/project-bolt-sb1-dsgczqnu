import { useState, useMemo } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { generatePdfReport } from '../utils/reports';
import { 
  FileText, 
  Download, 
  Calendar, 
  RefreshCw,
  ChevronDown,
  BarChart2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Timer,
  Users,
  TrendingUp,
  Shield,
  Activity,
  HelpCircle
} from 'lucide-react';
import { TaskType, ReportFilter, TaskStatus, DashboardMetrics } from '../types';
import Joyride, { Step } from 'react-joyride';

const Reports = () => {
  const { tasks, duplicateTasks, metrics, loading } = useTasks();
  
  // State for report filters
  const [reportFilter, setReportFilter] = useState<ReportFilter>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    taskType: 'all'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);

  const tourSteps: Step[] = [
    {
      target: '.main-navbar',
      content: 'Use the navigation bar to access all major sections.',
      placement: 'bottom',
    },
    {
      target: '.report-filters',
      content: 'Set your filters to generate custom reports.',
      placement: 'bottom',
    },
    {
      target: '.report-summary-cards',
      content: 'These cards show key report metrics.',
      placement: 'bottom',
    },
    {
      target: '.report-preview',
      content: 'Preview your report here before downloading.',
      placement: 'top',
    },
    {
      target: '.download-report-btn',
      content: 'Download your report as a PDF.',
      placement: 'left',
    },
  ];

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!reportFilter.startDate || !reportFilter.endDate) {
      return {
        tasks: [],
        duplicateTasks: [],
        metrics: {
          totalTasks: 0,
          duplicatesDetected: 0,
          timeSaved: 0,
          efficiencyGain: 0,
          tasksByType: {} as Record<TaskType, number>,
          tasksByStatus: {} as Record<TaskStatus, number>,
          duplicatesByDay: []
        }
      };
    }

    const startDate = new Date(reportFilter.startDate);
    const endDate = new Date(reportFilter.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.timestamp);
      const matchesDate = taskDate >= startDate && taskDate <= endDate;
      const matchesType = reportFilter.taskType === 'all' || task.taskType === reportFilter.taskType;
      return matchesDate && matchesType;
    });

    // Filter duplicate tasks
    const filteredDuplicateTasks = duplicateTasks.filter(duplicate => {
      const duplicateTask = tasks.find(t => t.id === duplicate.duplicateTaskId);
      if (!duplicateTask) return false;
      
      const taskDate = new Date(duplicateTask.timestamp);
      const matchesDate = taskDate >= startDate && taskDate <= endDate;
      const matchesType = reportFilter.taskType === 'all' || duplicateTask.taskType === reportFilter.taskType;
      return matchesDate && matchesType;
    });

    // Calculate filtered metrics
    const tasksByType = filteredTasks.reduce((acc, task) => {
      acc[task.taskType] = (acc[task.taskType] || 0) + 1;
      return acc;
    }, {} as Record<TaskType, number>);

    const tasksByStatus = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<TaskStatus, number>);

    // Group duplicates by day
    const duplicatesByDay = filteredDuplicateTasks.reduce((acc, duplicate) => {
      const duplicateTask = tasks.find(t => t.id === duplicate.duplicateTaskId);
      if (!duplicateTask) return acc;
      
      const date = new Date(duplicateTask.timestamp).toISOString().split('T')[0];
      const existingDay = acc.find(d => d.date === date);
      
      if (existingDay) {
        existingDay.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }
      
      return acc;
    }, [] as Array<{ date: string; count: number }>);

    const filteredMetrics: DashboardMetrics = {
      totalTasks: filteredTasks.length,
      duplicatesDetected: filteredDuplicateTasks.length,
      timeSaved: filteredDuplicateTasks.reduce((sum, duplicate) => sum + duplicate.timeSaved, 0),
      efficiencyGain: filteredTasks.length > 0 
        ? Math.round((filteredDuplicateTasks.length / filteredTasks.length) * 100)
        : 0,
      tasksByType,
      tasksByStatus,
      duplicatesByDay
    };

    return {
      tasks: filteredTasks,
      duplicateTasks: filteredDuplicateTasks,
      metrics: filteredMetrics
    };
  }, [tasks, duplicateTasks, reportFilter]);
  
  // Handle generating PDF report
  const handleGeneratePdf = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      try {
        const doc = generatePdfReport(
          filteredData.tasks,
          filteredData.duplicateTasks,
          filteredData.metrics,
          reportFilter
        );
        doc.save('HSBC-BankFlowAI-Report.pdf');
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF report. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }, 500);
  };

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
          <div className="flex items-center">
            <div className="rounded-full bg-white/10 p-3 mr-4 backdrop-blur-sm">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">Reports</h1>
              <p className="text-white/90 text-lg max-w-2xl">
                Generate comprehensive workflow efficiency reports and analytics
              </p>
            </div>
          </div>
          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating || loading}
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed download-report-btn"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={20} className="mr-2 group-hover:scale-110 transition-transform duration-300 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={20} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                Generate PDF Report
              </>
            )}
          </button>
        </div>
        </div>
        
        {/* Report filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in report-filters">
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center">
            <Calendar size={20} className="text-hsbc-primary mr-3" />
            <h2 className="text-lg font-medium text-gray-800">Report Filters</h2>
          </div>
          <ChevronDown 
            size={20} 
            className={`text-gray-400 transition-transform duration-200 ${isFiltersExpanded ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {isFiltersExpanded && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
                <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="startDate"
                  value={reportFilter.startDate}
                  onChange={(e) => setReportFilter({...reportFilter, startDate: e.target.value})}
                    className="focus:ring-2 focus:ring-hsbc-primary/20 focus:border-hsbc-primary block w-full pl-10 pr-3 py-2.5 text-sm border-gray-200 rounded-xl transition-all duration-200"
                />
              </div>
            </div>
            
              <div className="space-y-2">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
                <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="endDate"
                  value={reportFilter.endDate}
                  onChange={(e) => setReportFilter({...reportFilter, endDate: e.target.value})}
                    className="focus:ring-2 focus:ring-hsbc-primary/20 focus:border-hsbc-primary block w-full pl-10 pr-3 py-2.5 text-sm border-gray-200 rounded-xl transition-all duration-200"
                />
              </div>
            </div>
            
              <div className="space-y-2">
                <label htmlFor="taskType" className="block text-sm font-medium text-gray-700">
                Task Type
              </label>
              <select
                id="taskType"
                value={reportFilter.taskType}
                onChange={(e) => setReportFilter({...reportFilter, taskType: e.target.value as TaskType | 'all'})}
                  className="focus:ring-2 focus:ring-hsbc-primary/20 focus:border-hsbc-primary block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 rounded-xl transition-all duration-200"
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
        )}
        </div>
        
        {/* Report preview */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in report-preview">
        <div className="bg-gradient-to-r from-hsbc-primary to-hsbc-dark p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Report Preview</h2>
              <p className="text-white/90">
                {reportFilter.startDate && reportFilter.endDate && (
                  <>
                    Period: {new Date(reportFilter.startDate).toLocaleDateString()} to {new Date(reportFilter.endDate).toLocaleDateString()}
                  </>
                )}
                {reportFilter.taskType !== 'all' && (
                  <>, Task Type: {reportFilter.taskType?.replace('-', ' ')}</>
                )}
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-white/80">
              Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 report-summary-cards">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-scale-in group">
              <div className="flex items-center">
                <div className="rounded-full bg-hsbc-primary/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart2 size={24} className="text-hsbc-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Tasks</p>
                  <h3 className="text-2xl font-bold text-gray-800">{filteredData.metrics.totalTasks}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-scale-in group" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center">
                <div className="rounded-full bg-hsbc-accent/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle size={24} className="text-hsbc-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Duplicates Detected</p>
                  <h3 className="text-2xl font-bold text-hsbc-accent">{filteredData.metrics.duplicatesDetected}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-scale-in group" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center">
                <div className="rounded-full bg-hsbc-success/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock size={24} className="text-hsbc-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Time Saved</p>
                  <h3 className="text-2xl font-bold text-hsbc-success">
                    {Math.floor(filteredData.metrics.timeSaved / 60)}h {filteredData.metrics.timeSaved % 60}m
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-scale-in group" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center">
                <div className="rounded-full bg-hsbc-warning/10 p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <ArrowUpRight size={24} className="text-hsbc-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Efficiency Gain</p>
                  <h3 className="text-2xl font-bold text-hsbc-warning">{filteredData.metrics.efficiencyGain}%</h3>
                </div>
              </div>
            </div>
                </div>
                
          {/* Task Status Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-800">Task Status Distribution</h4>
                <div className="flex items-center text-sm text-gray-500">
                  <Activity size={16} className="mr-1" />
                  Workflow Health
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(filteredData.metrics.tasksByStatus).map(([status, count]) => {
                  const percentage = Math.round((count / filteredData.metrics.totalTasks) * 100);
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'completed': return 'text-green-600 bg-green-50';
                      case 'in-progress': return 'text-blue-600 bg-blue-50';
                      case 'pending': return 'text-yellow-600 bg-yellow-50';
                      case 'cancelled': return 'text-red-600 bg-red-50';
                      default: return 'text-gray-600 bg-gray-50';
                    }
                  };
                  const getStatusIcon = (status: string) => {
                    switch (status) {
                      case 'completed': return <CheckCircle2 size={20} />;
                      case 'in-progress': return <Timer size={20} />;
                      case 'pending': return <Clock size={20} />;
                      case 'cancelled': return <XCircle size={20} />;
                      default: return null;
                    }
                  };

                  return (
                    <div key={status} className="bg-white rounded-lg border border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="ml-1">{status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            status === 'completed' ? 'bg-green-500' :
                            status === 'in-progress' ? 'bg-blue-500' :
                            status === 'pending' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="mt-1 text-sm text-gray-500">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
                </div>
                
          {/* Duplicate Analysis */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-800">Duplicate Analysis</h4>
                <div className="flex items-center text-sm text-gray-500">
                  <TrendingUp size={16} className="mr-1" />
                  Efficiency Insights
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Duplicate Detection Rate */}
                <div className="bg-white rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center mb-3">
                    <div className="rounded-full bg-hsbc-primary/10 p-2 mr-3">
                      <AlertTriangle size={20} className="text-hsbc-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Detection Rate</p>
                      <h3 className="text-xl font-bold text-gray-800">
                        {filteredData.metrics.totalTasks > 0
                          ? Math.round((filteredData.metrics.duplicatesDetected / filteredData.metrics.totalTasks) * 100)
                          : 0}%
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {filteredData.metrics.duplicatesDetected} duplicates detected out of {filteredData.metrics.totalTasks} total tasks
                  </p>
                </div>
                
                {/* Time Saved by Task Type */}
                <div className="bg-white rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center mb-3">
                    <div className="rounded-full bg-hsbc-success/10 p-2 mr-3">
                      <Clock size={20} className="text-hsbc-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Time Saved by Type</p>
                      <h3 className="text-xl font-bold text-gray-800">
                        {Math.floor(filteredData.metrics.timeSaved / 60)}h {filteredData.metrics.timeSaved % 60}m
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(filteredData.metrics.tasksByType).map(([type, count]) => {
                      const typeDuplicates = filteredData.duplicateTasks.filter(d => {
                        const task = filteredData.tasks.find(t => t.id === d.duplicateTaskId);
                        return task?.taskType === type;
                      });
                      const timeSaved = typeDuplicates.reduce((sum, d) => sum + d.timeSaved, 0);
                      
                      return (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{type.replace('-', ' ')}</span>
                          <span className="font-medium text-gray-800">{timeSaved}m saved</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resolution Status */}
                <div className="bg-white rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center mb-3">
                    <div className="rounded-full bg-hsbc-accent/10 p-2 mr-3">
                      <Shield size={20} className="text-hsbc-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resolution Status</p>
                      <h3 className="text-xl font-bold text-gray-800">
                        {filteredData.duplicateTasks.length > 0
                          ? Math.round((filteredData.duplicateTasks.filter(d => d.suggestedAction === 'delete').length / filteredData.duplicateTasks.length) * 100)
                          : 0}%
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Delete</span>
                      <span className="font-medium text-red-600">
                        {filteredData.duplicateTasks.filter(d => d.suggestedAction === 'delete').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Merge</span>
                      <span className="font-medium text-yellow-600">
                        {filteredData.duplicateTasks.filter(d => d.suggestedAction === 'merge').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Review</span>
                      <span className="font-medium text-blue-600">
                        {filteredData.duplicateTasks.filter(d => d.suggestedAction === 'review').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Impact */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-800">Customer Impact</h4>
                <div className="flex items-center text-sm text-gray-500">
                  <Users size={16} className="mr-1" />
                  Customer Insights
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tasks per Customer */}
                <div className="bg-white rounded-lg border border-gray-100 p-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-3">Tasks per Customer</h5>
                  <div className="space-y-3">
                    {Object.entries(
                      filteredData.tasks.reduce((acc, task) => {
                        acc[task.customerId] = (acc[task.customerId] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([customerId, count]) => (
                        <div key={customerId} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{customerId}</span>
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden mr-2">
                              <div 
                                className="h-full rounded-full bg-hsbc-primary transition-all duration-300"
                                style={{ width: `${(count / Math.max(...Object.values(filteredData.metrics.tasksByType))) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-800">{count}</span>
                          </div>
                        </div>
                      ))}
              </div>
            </div>
            
                {/* Duplicate Impact */}
                <div className="bg-white rounded-lg border border-gray-100 p-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-3">Customers with Duplicates</h5>
                  <div className="space-y-3">
                    {Object.entries(
                      filteredData.duplicateTasks.reduce((acc, duplicate) => {
                        const task = filteredData.tasks.find(t => t.id === duplicate.duplicateTaskId);
                        if (task) {
                          acc[task.customerId] = (acc[task.customerId] || 0) + 1;
                        }
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([customerId, count]) => (
                        <div key={customerId} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{customerId}</span>
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden mr-2">
                              <div 
                                className="h-full rounded-full bg-hsbc-accent transition-all duration-300"
                                style={{ width: `${(count / Math.max(...Object.values(filteredData.metrics.tasksByType))) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-hsbc-accent">{count} duplicates</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks by Type */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h4 className="text-lg font-medium text-gray-800">Tasks by Type</h4>
            </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Type
                      </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distribution
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(filteredData.metrics.tasksByType).map(([type, count], index) => (
                    <tr 
                      key={type}
                      className="hover:bg-gray-50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-hsbc-primary/10 text-hsbc-primary">
                          {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {count as number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(((count as number) / filteredData.metrics.totalTasks) * 100)}%
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-hsbc-primary transition-all duration-300"
                            style={{ width: `${((count as number) / filteredData.metrics.totalTasks) * 100}%` }}
                          />
                        </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          {/* Detected Duplicates */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h4 className="text-lg font-medium text-gray-800">Detected Duplicates</h4>
            </div>
            
            {filteredData.duplicateTasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task ID
                        </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Similarity
                        </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Saved
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.duplicateTasks.slice(0, 5).map((duplicate, index) => {
                      const duplicateTask = filteredData.tasks.find(t => t.id === duplicate.duplicateTaskId);
                        if (!duplicateTask) return null;
                        
                        return (
                        <tr 
                          key={duplicate.duplicateTaskId}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {duplicate.timeSaved} min
                            </td>
                          </tr>
                        );
                      })}
                    {filteredData.duplicateTasks.length > 5 && (
                        <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center bg-gray-50/50">
                          And {filteredData.duplicateTasks.length - 5} more duplicates...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
              <div className="text-center py-12 bg-gray-50/50">
                <div className="text-gray-400 mb-2">
                  <AlertTriangle size={48} className="mx-auto" />
                </div>
                <p className="text-gray-600">No duplicates found matching the current filters</p>
                </div>
              )}
            </div>
            
          <div className="text-center py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
                This report was generated by HSBC BankFlowAI.
                <br />
                Confidential and Internal Use Only.
              </p>
            </div>
          </div>
        </div>
        
      {/* Download button */}
        <div className="flex justify-end">
          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating || loading}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-hsbc-primary hover:bg-hsbc-dark transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed download-report-btn"
          >
            {isGenerating ? (
              <>
              <RefreshCw size={20} className="mr-2 group-hover:scale-110 transition-transform duration-300 animate-spin" />
                Generating...
              </>
            ) : (
              <>
              <Download size={20} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                Download PDF Report
              </>
            )}
          </button>
      </div>
    </div>
  );
};

export default Reports;