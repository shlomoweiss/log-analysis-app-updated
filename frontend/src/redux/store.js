import { configureStore } from '@reduxjs/toolkit';
import queryReducer from './slices/querySlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    query: queryReducer,
    auth: authReducer,
  },
});
