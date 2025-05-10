import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentQuery: '',
  translatedQuery: '',
  loading: false,
  error: null,
  results: [],
  executionTime: 0,
  selectedLog: null,
  contextResults: [],
  contextLoading: false,
  contextError: null,
  savedQueries: []
};

export const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setCurrentQuery: (state, action) => {
      state.currentQuery = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setResults: (state, action) => {
      state.results = action.payload;
    },
    setTranslatedQuery: (state, action) => {
      state.translatedQuery = action.payload;
    },
    setExecutionTime: (state, action) => {
      state.executionTime = action.payload;
    },
    clearResults: (state) => {
      state.results = [];
      state.translatedQuery = '';
      state.executionTime = 0;
      state.selectedLog = null;
      state.contextResults = [];
    },
    setSelectedLog: (state, action) => {
      state.selectedLog = action.payload;
    },
    setContextResults: (state, action) => {
      state.contextResults = action.payload;
    },
    setContextLoading: (state, action) => {
      state.contextLoading = action.payload;
    },
    setContextError: (state, action) => {
      state.contextError = action.payload;
    },
    setSavedQueries: (state, action) => {
      state.savedQueries = action.payload;
    }
  }
});

export const {
  setCurrentQuery,
  setLoading,
  setError,
  setResults,
  setTranslatedQuery,
  setExecutionTime,
  clearResults,
  setSelectedLog,
  setContextResults,
  setContextLoading,
  setContextError,
  setSavedQueries
} = querySlice.actions;

// Async action to execute the query
export const executeQuery = (query) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    const response = await fetch('/api/query/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to execute query');
    }
    
    dispatch(setResults(data.results));
    dispatch(setTranslatedQuery(data.translatedQuery));
    dispatch(setExecutionTime(data.executionTime));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// Async action to execute translated query
export const executeTranslatedQuery = ({ queryText, translatedQuery }) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    const response = await fetch('/api/query/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: queryText, translatedQuery }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to execute query');
    }
    
    dispatch(setResults(data.results));
    dispatch(setTranslatedQuery(translatedQuery));
    dispatch(setExecutionTime(data.executionTime));
    dispatch(setCurrentQuery(queryText));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// Async action to fetch saved queries
export const fetchSavedQueries = () => async (dispatch) => {
  dispatch(setLoading(true));
  
  try {
    const response = await fetch('/api/query/saved');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch saved queries');
    }
    
    // Add the savedQueries to state
    dispatch(setSavedQueries(data));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// Async action to save query
export const saveQuery = (queryData) => async (dispatch) => {
  try {
    const response = await fetch('/api/query/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to save query');
    }
    
    // Refresh saved queries list
    dispatch(fetchSavedQueries());
  } catch (error) {
    dispatch(setError(error.message));
  }
};

// Async action to fetch log context
export const fetchLogContext = (timestamp, service, upperLimit = 5, lowerLimit = 5) => async (dispatch, getState) => {
  dispatch(setContextLoading(true));
  dispatch(setContextError(null));
  
  try {
    const { selectedLog } = getState().query;
    
    const response = await fetch('/api/query/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        timestamp,
        service: service || selectedLog?.service,
        upperLimit,
        lowerLimit
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch log context');
    }
    
    const data = await response.json();
    dispatch(setContextResults(data.results));
  } catch (error) {
    dispatch(setContextError(error.message));
  } finally {
    dispatch(setContextLoading(false));
  }
};

export default querySlice.reducer;
