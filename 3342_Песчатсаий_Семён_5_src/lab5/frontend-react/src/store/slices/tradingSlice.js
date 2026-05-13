import { createSlice } from '@reduxjs/toolkit';

const tradingSlice = createSlice({
  name: 'trading',
  initialState: {
    isTrading: false,
    startDate: null,
    speed: 1,
    currentDate: null,
    stockPrices: {},
  },
  reducers: {
    startTrading: (state, action) => {
      state.isTrading = true;
      state.startDate = action.payload.startDate;
      state.speed = action.payload.speed;
    },
    stopTrading: (state) => {
      state.isTrading = false;
    },
    updateCurrentDate: (state, action) => {
      state.currentDate = action.payload;
    },
    updateStockPrices: (state, action) => {
      state.stockPrices = { ...state.stockPrices, ...action.payload };
    },
    setTradingSpeed: (state, action) => {
      state.speed = action.payload;
    },
  },
});

export const { 
  startTrading, 
  stopTrading, 
  updateCurrentDate, 
  updateStockPrices,
  setTradingSpeed 
} = tradingSlice.actions;

export default tradingSlice.reducer;