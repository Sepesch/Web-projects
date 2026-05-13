// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import { tradingApi } from '../../api';

// export const startTrading = createAsyncThunk(
//   'trading/startTrading',
//   async (settings) => {
//     return await tradingApi.start(settings);
//   }
// );

// export const stopTrading = createAsyncThunk(
//   'trading/stopTrading',
//   async () => {
//     return await tradingApi.stop();
//   }
// );

// export const nextTradingStep = createAsyncThunk(
//   'trading/nextTradingStep',
//   async () => {
//     return await tradingApi.next();
//   }
// );

// export const fetchTradingState = createAsyncThunk(
//   'trading/fetchTradingState',
//   async () => {
//     return await tradingApi.getState();
//   }
// );

// export const fetchTradingHistory = createAsyncThunk(
//   'trading/fetchTradingHistory',
//   async () => {
//     return await tradingApi.getHistory();
//   }
// );

// export const fetchCurrentPrices = createAsyncThunk(
//   'trading/fetchCurrentPrices',
//   async () => {
//     return await tradingApi.getPrices();
//   }
// );

// const tradingSlice = createSlice({
//   name: 'trading',
//   initialState: {
//     isTrading: false,
//     settings: {
//       startDate: '',
//       speed: 1
//     },
//     currentDate: '',
//     stockPrices: {},
//     availableDates: [],
//     currentDateIndex: 0,
//     tradingHistory: [],
//     completedTradingHistory: [],
//     initialPrices: {},
//     loading: false,
//     error: null,
//     tradingInterval: null,
//     // Добавляем поле для хранения последней завершенной сессии
//     lastSession: null,
//     // Добавляем поле для хранения данных завершенной сессии
//     completedSessionData: null
//   },
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//     updateTradingState: (state, action) => {
//       return { ...state, ...action.payload };
//     },
//     setTradingInterval: (state, action) => {
//       state.tradingInterval = action.payload;
//     },
//     clearTradingInterval: (state) => {
//       if (state.tradingInterval) {
//         clearInterval(state.tradingInterval);
//         state.tradingInterval = null;
//       }
//     },
//     saveTradingHistory: (state) => {
//       if (state.tradingHistory && state.tradingHistory.length > 0) {
//         state.completedTradingHistory = [...state.tradingHistory];
//         // Сохраняем полные данные сессии
//         state.completedSessionData = {
//           history: [...state.tradingHistory],
//           settings: { ...state.settings },
//           currentDate: state.currentDate,
//           stockPrices: { ...state.stockPrices },
//           availableDates: [...state.availableDates],
//           currentDateIndex: state.currentDateIndex,
//           initialPrices: { ...state.initialPrices },
//           startDate: state.tradingHistory[0]?.date,
//           endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//           duration: state.tradingHistory.length
//         };
//       }
//     },
//     clearCompletedHistory: (state) => {
//       state.completedTradingHistory = [];
//       state.completedSessionData = null;
//       state.lastSession = null;
//     },
//     // Новый reducer для принудительной остановки торгов на клиенте
//     forceStopTrading: (state) => {
//       // Сохраняем историю перед остановкой
//       if (state.tradingHistory && state.tradingHistory.length > 0) {
//         state.completedTradingHistory = [...state.tradingHistory];
//         state.completedSessionData = {
//           history: [...state.tradingHistory],
//           settings: { ...state.settings },
//           currentDate: state.currentDate,
//           stockPrices: { ...state.stockPrices },
//           availableDates: [...state.availableDates],
//           currentDateIndex: state.currentDateIndex,
//           initialPrices: { ...state.initialPrices },
//           startDate: state.tradingHistory[0]?.date,
//           endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//           duration: state.tradingHistory.length
//         };
//         state.lastSession = {
//           history: [...state.tradingHistory],
//           settings: { ...state.settings },
//           startDate: state.tradingHistory[0]?.date,
//           endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//           duration: state.tradingHistory.length,
//           initialPrices: { ...state.initialPrices },
//           finalPrices: { ...state.stockPrices }
//         };
//       }
      
//       state.isTrading = false;
//       state.loading = false;
//       // НЕ очищаем tradingHistory, чтобы данные оставались для отображения
//       // НЕ очищаем currentDate, stockPrices и т.д. для отображения финального состояния
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(startTrading.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         // Очищаем данные предыдущей завершенной сессии при старте новой
//         state.completedSessionData = null;
//         state.completedTradingHistory = [];
//       })
//       .addCase(startTrading.fulfilled, (state, action) => {
//         state.loading = false;
//         state.isTrading = true;
//         state.settings = action.payload.settings || state.settings;
//         state.currentDate = action.payload.currentDate || '';
//         state.stockPrices = action.payload.stockPrices || {};
//         state.availableDates = action.payload.availableDates || [];
//         state.currentDateIndex = action.payload.currentDateIndex || 0;
//         state.tradingHistory = action.payload.tradingHistory || [];
//         // Сохраняем начальные цены при старте торгов
//         state.initialPrices = { ...(action.payload.stockPrices || {}) };
//       })
//       .addCase(startTrading.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error?.message || 'Failed to start trading';
//       })
//       .addCase(stopTrading.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(stopTrading.fulfilled, (state, action) => {
//         state.loading = false;
//         state.isTrading = false;
        
//         // Сохраняем ВСЕ данные текущей сессии перед любыми очистками
//         if (state.tradingHistory && state.tradingHistory.length > 0) {
//           state.completedTradingHistory = [...state.tradingHistory];
//           state.completedSessionData = {
//             history: [...state.tradingHistory],
//             settings: { ...state.settings },
//             currentDate: state.currentDate, // Сохраняем последнюю дату
//             stockPrices: { ...state.stockPrices }, // Сохраняем последние цены
//             availableDates: [...state.availableDates],
//             currentDateIndex: state.currentDateIndex,
//             initialPrices: { ...state.initialPrices },
//             startDate: state.tradingHistory[0]?.date,
//             endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//             duration: state.tradingHistory.length
//           };
//           state.lastSession = {
//             history: [...state.tradingHistory],
//             settings: { ...state.settings },
//             startDate: state.tradingHistory[0]?.date,
//             endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//             duration: state.tradingHistory.length,
//             initialPrices: { ...state.initialPrices },
//             finalPrices: { ...state.stockPrices }
//           };
//         }
        
//         // Важно: НЕ очищаем текущие состояния, чтобы страница могла отображать финальное состояние
//         // Очищаем только флаг isTrading, все остальные данные остаются для отображения
//       })
//       .addCase(stopTrading.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error?.message || 'Failed to stop trading';
//         // Принудительно останавливаем торги даже при ошибке, но сохраняем историю
//         state.isTrading = false;
//         if (state.tradingHistory && state.tradingHistory.length > 0) {
//           state.completedTradingHistory = [...state.tradingHistory];
//           state.completedSessionData = {
//             history: [...state.tradingHistory],
//             settings: { ...state.settings },
//             currentDate: state.currentDate,
//             stockPrices: { ...state.stockPrices },
//             availableDates: [...state.availableDates],
//             currentDateIndex: state.currentDateIndex,
//             initialPrices: { ...state.initialPrices },
//             startDate: state.tradingHistory[0]?.date,
//             endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//             duration: state.tradingHistory.length
//           };
//           state.lastSession = {
//             history: [...state.tradingHistory],
//             settings: { ...state.settings },
//             startDate: state.tradingHistory[0]?.date,
//             endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//             duration: state.tradingHistory.length,
//             initialPrices: { ...state.initialPrices },
//             finalPrices: { ...state.stockPrices }
//           };
//         }
//       })
//       .addCase(nextTradingStep.fulfilled, (state, action) => {
//         state.currentDate = action.payload.currentDate || state.currentDate;
//         state.stockPrices = action.payload.stockPrices || state.stockPrices;
//         state.currentDateIndex = action.payload.currentDateIndex || state.currentDateIndex;
//         state.isTrading = action.payload.isTrading !== undefined ? action.payload.isTrading : state.isTrading;
//         state.tradingHistory = action.payload.tradingHistory || state.tradingHistory;
        
//         // Если торги завершились автоматически (дошли до конца), сохраняем историю
//         if (!state.isTrading && state.tradingHistory && state.tradingHistory.length > 0) {
//           state.completedTradingHistory = [...state.tradingHistory];
//           state.completedSessionData = {
//             history: [...state.tradingHistory],
//             settings: { ...state.settings },
//             currentDate: state.currentDate,
//             stockPrices: { ...state.stockPrices },
//             availableDates: [...state.availableDates],
//             currentDateIndex: state.currentDateIndex,
//             initialPrices: { ...state.initialPrices },
//             startDate: state.tradingHistory[0]?.date,
//             endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//             duration: state.tradingHistory.length
//           };
//           state.lastSession = {
//             history: [...state.tradingHistory],
//             settings: { ...state.settings },
//             startDate: state.tradingHistory[0]?.date,
//             endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//             duration: state.tradingHistory.length,
//             initialPrices: { ...state.initialPrices },
//             finalPrices: { ...state.stockPrices }
//           };
//         }
//       })
//       .addCase(nextTradingStep.rejected, (state, action) => {
//         state.error = action.error?.message || 'Failed to move to next step';
//         // Если получили ошибку "Trading is not in progress", останавливаем торги
//         if (action.error?.message?.includes('Trading is not in progress')) {
//           state.isTrading = false;
//           if (state.tradingHistory && state.tradingHistory.length > 0) {
//             state.completedTradingHistory = [...state.tradingHistory];
//             state.completedSessionData = {
//               history: [...state.tradingHistory],
//               settings: { ...state.settings },
//               currentDate: state.currentDate,
//               stockPrices: { ...state.stockPrices },
//               availableDates: [...state.availableDates],
//               currentDateIndex: state.currentDateIndex,
//               initialPrices: { ...state.initialPrices },
//               startDate: state.tradingHistory[0]?.date,
//               endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//               duration: state.tradingHistory.length
//             };
//             state.lastSession = {
//               history: [...state.tradingHistory],
//               settings: { ...state.settings },
//               startDate: state.tradingHistory[0]?.date,
//               endDate: state.tradingHistory[state.tradingHistory.length - 1]?.date,
//               duration: state.tradingHistory.length,
//               initialPrices: { ...state.initialPrices },
//               finalPrices: { ...state.stockPrices }
//             };
//           }
//         }
//       })
//       .addCase(fetchTradingState.fulfilled, (state, action) => {
//         const payload = action.payload || {};
//         state.isTrading = payload.isTrading !== undefined ? payload.isTrading : state.isTrading;
//         state.settings = payload.settings || state.settings;
//         state.currentDate = payload.currentDate || state.currentDate;
//         state.stockPrices = payload.stockPrices || state.stockPrices;
//         state.availableDates = payload.availableDates || state.availableDates;
//         state.currentDateIndex = payload.currentDateIndex !== undefined ? payload.currentDateIndex : state.currentDateIndex;
//         state.tradingHistory = payload.tradingHistory || state.tradingHistory;
//         state.completedTradingHistory = payload.completedTradingHistory || state.completedTradingHistory;
//         state.initialPrices = payload.initialPrices || state.initialPrices;
//         state.lastSession = payload.lastSession || state.lastSession;
//         state.completedSessionData = payload.completedSessionData || state.completedSessionData;
//       })
//       .addCase(fetchTradingHistory.fulfilled, (state, action) => {
//         state.tradingHistory = action.payload || [];
//       })
//       .addCase(fetchCurrentPrices.fulfilled, (state, action) => {
//         state.stockPrices = action.payload || {};
//       });
//   },
// });

// export const { 
//   clearError, 
//   updateTradingState, 
//   setTradingInterval,
//   clearTradingInterval,
//   saveTradingHistory,
//   clearCompletedHistory,
//   forceStopTrading
// } = tradingSlice.actions;
// export default tradingSlice.reducer;