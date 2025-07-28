import * as XLSX from 'xlsx';

// Local storage key for experiment data
const EXPERIMENT_DATA_KEY = 'digit_span_experiment_data';

// Initialize or get existing experiment data
export const initializeExperimentData = (experimentId) => {
  const data = {
    experimentId,
    sequence: null,
    experimentMode: null, // Added to track test vs full mode
    startTime: new Date().toISOString(),
    preQuestionnaire: null,
    midQuestionnaires: [],
    tasks: [],
    postQuestionnaire: null,
    endTime: null
  };
  
  localStorage.setItem(EXPERIMENT_DATA_KEY, JSON.stringify(data));
  return data;
};

// Get current experiment data
export const getExperimentData = () => {
  const data = localStorage.getItem(EXPERIMENT_DATA_KEY);
  return data ? JSON.parse(data) : null;
};

// Update experiment data
export const updateExperimentData = (updates) => {
  const currentData = getExperimentData();
  if (!currentData) return null;
  
  const newData = { ...currentData, ...updates };
  localStorage.setItem(EXPERIMENT_DATA_KEY, JSON.stringify(newData));
  return newData;
};

// Add a task result
export const addTaskResult = (taskResult) => {
  const currentData = getExperimentData();
  if (!currentData) return null;
  
  const newData = {
    ...currentData,
    tasks: [...(currentData.tasks || []), taskResult]
  };
  
  localStorage.setItem(EXPERIMENT_DATA_KEY, JSON.stringify(newData));
  return newData;
};

// Add a mid-questionnaire
export const addMidQuestionnaire = (questionnaireData) => {
  const currentData = getExperimentData();
  if (!currentData) return null;
  
  const newData = {
    ...currentData,
    midQuestionnaires: [...(currentData.midQuestionnaires || []), questionnaireData]
  };
  
  localStorage.setItem(EXPERIMENT_DATA_KEY, JSON.stringify(newData));
  return newData;
};

// Set pre-questionnaire
export const setPreQuestionnaire = (questionnaireData) => {
  return updateExperimentData({ preQuestionnaire: questionnaireData });
};

// Set post-questionnaire
export const setPostQuestionnaire = (questionnaireData) => {
  return updateExperimentData({ 
    postQuestionnaire: questionnaireData,
    endTime: new Date().toISOString()
  });
};

// Clear experiment data
export const clearExperimentData = () => {
  localStorage.removeItem(EXPERIMENT_DATA_KEY);
};

// Download experiment data
export const downloadExperimentData = () => {
  const data = getExperimentData();
  if (!data) return null;
  
  // Convert data to Excel format
  const workbook = XLSX.utils.book_new();
  
  // Experiment Overview sheet
  const overviewData = [{
    experimentId: data.experimentId || '',
    sequence: data.sequence || '',
    experimentMode: data.experimentMode || '', // Added experiment mode to export
    startTime: data.startTime || '',
    endTime: data.endTime || new Date().toISOString()
  }];
  const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
  
  // Tasks sheet
  if (data.tasks && data.tasks.length > 0) {
    const tasksSheet = XLSX.utils.json_to_sheet(data.tasks);
    XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');
  }
  
  // Pre-questionnaire sheet
  if (data.preQuestionnaire) {
    const preQuestionnaireSheet = XLSX.utils.json_to_sheet([data.preQuestionnaire]);
    XLSX.utils.book_append_sheet(workbook, preQuestionnaireSheet, 'Pre-Questionnaire');
  }
  
  // Mid-questionnaires sheet
  if (data.midQuestionnaires && data.midQuestionnaires.length > 0) {
    const midQuestionnairesSheet = XLSX.utils.json_to_sheet(data.midQuestionnaires);
    XLSX.utils.book_append_sheet(workbook, midQuestionnairesSheet, 'Mid-Questionnaires');
  }
  
  // Post-questionnaire sheet
  if (data.postQuestionnaire) {
    const postQuestionnaireSheet = XLSX.utils.json_to_sheet([data.postQuestionnaire]);
    XLSX.utils.book_append_sheet(workbook, postQuestionnaireSheet, 'Post-Questionnaire');
  }
  
  // Download the file
  const fileName = `experiment_${data.experimentId}_data.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  return fileName;
}; 