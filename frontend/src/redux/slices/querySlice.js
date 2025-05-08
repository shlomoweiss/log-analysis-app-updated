import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for executing a query
export const executeQuery = createAsyncThunk(
  'query/execute',
  async (queryText, { rejectWithValue }) => {
    try {
      // Make actual API call to the backend
      const response = await fetch('/api/query/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: Failed to execute query`);
      }
      
      const data = await response.json();
      
      return {
        query: queryText,
        ...data
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for saving a query
export const saveQuery = createAsyncThunk(
  'query/save',
  async ({ queryText, name }, { rejectWithValue }) => {
    try {
      console.log('Saving query:', queryText, name);
      // Make actual API call to the backend save endpoint
      const response = await fetch('/api/query/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText,
          name: name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: Failed to save query`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentQuery: '',
  results: [],
  translatedQuery: '',
  executionTime: 0,
  history: [],
  savedQueries: [],
  loading: false,
  error: null
};

const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setCurrentQuery: (state, action) => {
      state.currentQuery = action.payload;
    },
    clearResults: (state) => {
      console.log('Clearing results');
      state.results = [];
      state.translatedQuery = '';
      state.executionTime = 0;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(executeQuery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(executeQuery.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.results;
        state.translatedQuery = action.payload.translatedQuery;
        state.executionTime = action.payload.executionTime;
        state.history = [
          {
            id: Date.now(),
            query: action.payload.query,
            timestamp: new Date().toISOString(),
            resultCount: action.payload.results.length
          },
          ...state.history
        ].slice(0, 20); // Keep only the last 20 queries
      })
      .addCase(executeQuery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveQuery.fulfilled, (state, action) => {
        state.savedQueries = [action.payload, ...state.savedQueries];
      });
  }
});

export const { setCurrentQuery, clearResults, clearError } = querySlice.actions;
export default querySlice.reducer;
