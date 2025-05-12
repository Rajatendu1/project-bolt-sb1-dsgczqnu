import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDistance } from 'date-fns';
import { Task, DuplicateTask, DashboardMetrics, ReportFilter } from '../types';

// Generate PDF report
export const generatePdfReport = (
  tasks: Task[],
  duplicateTasks: DuplicateTask[],
  metrics: DashboardMetrics,
  filter: ReportFilter
): jsPDF => {
  // Create new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add HSBC branding
  doc.setTextColor(0, 48, 135); // HSBC primary blue
  doc.setFontSize(24);
  doc.text('HSBC BankFlowAI', pageWidth / 2, 20, { align: 'center' });
  
  doc.setTextColor(219, 0, 17); // HSBC accent red
  doc.setFontSize(16);
  doc.text('Workflow Efficiency Report', pageWidth / 2, 30, { align: 'center' });
  
  // Add report generation details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const now = new Date();
  doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, pageWidth / 2, 40, { align: 'center' });
  
  if (filter.startDate || filter.endDate || filter.taskType) {
    let filterText = 'Filters:';
    if (filter.startDate && filter.endDate) {
      filterText += ` Date range: ${new Date(filter.startDate).toLocaleDateString()} to ${new Date(filter.endDate).toLocaleDateString()}`;
    } else if (filter.startDate) {
      filterText += ` From: ${new Date(filter.startDate).toLocaleDateString()}`;
    } else if (filter.endDate) {
      filterText += ` Until: ${new Date(filter.endDate).toLocaleDateString()}`;
    }
    
    if (filter.taskType && filter.taskType !== 'all') {
      filterText += ` Task type: ${filter.taskType.replace('-', ' ')}`;
    }
    
    doc.text(filterText, pageWidth / 2, 45, { align: 'center' });
  }
  
  // Add summary section
  doc.setFontSize(14);
  doc.setTextColor(0, 48, 135);
  doc.text('Summary', 14, 55);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  const summaryData = [
    ['Total Tasks', metrics.totalTasks.toString()],
    ['Duplicates Detected', metrics.duplicatesDetected.toString()],
    ['Time Saved', `${metrics.timeSaved} minutes (${Math.floor(metrics.timeSaved / 60)} hours, ${metrics.timeSaved % 60} minutes)`],
    ['Efficiency Gain', `${metrics.efficiencyGain}%`]
  ];
  
  autoTable(doc, {
    startY: 60,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
    styles: { fontSize: 10 }
  });
  
  // Add tasks by type chart (as table for PDF)
  doc.setFontSize(14);
  doc.setTextColor(0, 48, 135);
  doc.text('Tasks by Type', 14, doc.previousAutoTable?.finalY ? doc.previousAutoTable.finalY + 15 : 120);
  
  const taskTypeData = Object.entries(metrics.tasksByType).map(([type, count]) => [
    type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count.toString(),
    `${Math.round((count / metrics.totalTasks) * 100)}%`
  ]);
  
  autoTable(doc, {
    startY: doc.previousAutoTable?.finalY ? doc.previousAutoTable.finalY + 20 : 125,
    head: [['Task Type', 'Count', 'Percentage']],
    body: taskTypeData,
    theme: 'grid',
    headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
    styles: { fontSize: 10 }
  });
  
  // Filter duplicates based on report filters
  const filteredDuplicates = duplicateTasks.filter(duplicate => {
    const duplicateTask = tasks.find(t => t.id === duplicate.duplicateTaskId);
    if (!duplicateTask) return false;
    
    let matchesFilter = true;
    
    // Check date filter
    if (filter.startDate || filter.endDate) {
      const taskDate = new Date(duplicateTask.timestamp);
      const startDate = filter.startDate ? new Date(filter.startDate) : null;
      const endDate = filter.endDate ? new Date(filter.endDate) : null;
      
      if (endDate) {
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
      }
      
      if (startDate && taskDate < startDate) {
        matchesFilter = false;
      }
      
      if (endDate && taskDate > endDate) {
        matchesFilter = false;
      }
    }
    
    // Check task type filter
    if (filter.taskType && filter.taskType !== 'all' && duplicateTask.taskType !== filter.taskType) {
      matchesFilter = false;
    }
    
    return matchesFilter;
  });
  
  // Add new page for duplicates table if needed
  if (doc.previousAutoTable?.finalY && doc.previousAutoTable.finalY > pageHeight - 100) {
    doc.addPage();
  } else {
    doc.setFontSize(14);
    doc.setTextColor(0, 48, 135);
    doc.text('Detected Duplicates', 14, doc.previousAutoTable?.finalY ? doc.previousAutoTable.finalY + 15 : 180);
  }
  
  const duplicateData = filteredDuplicates.map(duplicate => {
    const duplicateTask = tasks.find(t => t.id === duplicate.duplicateTaskId);
    
    if (!duplicateTask) return [];
    
    return [
      duplicateTask.id.substring(0, 8),
      duplicateTask.taskType.replace('-', ' '),
      duplicateTask.customerId,
      `${Math.round(duplicate.similarityScore * 100)}%`,
      duplicate.suggestedAction.charAt(0).toUpperCase() + duplicate.suggestedAction.slice(1),
      `${duplicate.timeSaved} min`
    ];
  });
  
  if (duplicateData.length > 0) {
    autoTable(doc, {
      startY: doc.previousAutoTable?.finalY ? doc.previousAutoTable.finalY + 20 : 185,
      head: [['ID', 'Type', 'Customer ID', 'Similarity', 'Action', 'Time Saved']],
      body: duplicateData,
      theme: 'grid',
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 }
      }
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('No duplicates found matching the current filters.', pageWidth / 2, doc.previousAutoTable?.finalY ? doc.previousAutoTable.finalY + 25 : 190, { align: 'center' });
  }
  
  // Add footer
  const footerPosition = pageHeight - 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('HSBC BankFlowAI - Confidential and Internal Use Only', pageWidth / 2, footerPosition, { align: 'center' });
  
  return doc;
};

// Format time duration for display
export const formatTimeSaved = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours > 0) {
    return `${days}d ${remainingHours}h`;
  }
  
  return `${days}d`;
};

// Format relative time (e.g., "2 days ago")
export const formatRelativeTime = (dateString: string): string => {
  return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
};