import { configureStore } from '@reduxjs/toolkit';
import brokersReducer from './slices/brokersSlice.js';
import stocksReducer from './slices/stocksSlice.js';
import tradingReducer from './slices/tradingSlice.js';

export const store = configureStore({
  reducer: {
    brokers: brokersReducer,
    stocks: stocksReducer,
    trading: tradingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});