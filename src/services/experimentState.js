const STORAGE_KEY = 'digit_span_experiment_state';

export const saveExperimentState = (state) => {
  try {
    const stateToSave = {
      experimentId: state.experimentId,
      sequence: state.sequence,
      currentTaskIndex: state.currentTaskIndex,
      stage: state.stage,
      startTime: state.startTime,
      preQuestionnaire: state.preQuestionnaire,
      midQuestionnaires: state.midQuestionnaires,
      tasks: state.tasks,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Error saving experiment state:', error);
  }
};

export const loadExperimentState = () => {
  try {
    console.log('Loading experiment state from localStorage');
    const savedState = localStorage.getItem(STORAGE_KEY);
    console.log('Saved state from localStorage:', savedState);
    if (!savedState) return null;
    return JSON.parse(savedState);
  } catch (error) {
    console.error('Error loading experiment state:', error);
    return null;
  }
};

export const clearExperimentState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing experiment state:', error);
  }
}; 