import { configureStore } from '@reduxjs/toolkit';
import queryReducer from './slices/querySlice';

export const store = configureStore({
  reducer: {
    query: queryReducer,
  },
});
