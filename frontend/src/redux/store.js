import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import queryReducer from './slices/querySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    query: queryReducer,
  },
});
