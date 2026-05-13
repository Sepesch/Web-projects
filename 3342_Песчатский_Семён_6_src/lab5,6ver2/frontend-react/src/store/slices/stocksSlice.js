import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stocksApi } from '../../api';

export const fetchStocks = createAsyncThunk(
  'stocks/fetchStocks',
  async () => {
    return await stocksApi.getAll();
  }
);

export const updateStock = createAsyncThunk(
  'stocks/updateStock',
  async ({ symbol, updates }) => {
    return await stocksApi.update(symbol, updates);
  }
);

export const loadHistoricalData = createAsyncThunk(
  'stocks/loadHistoricalData',
  async (symbol) => {
    const response = await stocksApi.loadHistoricalData(symbol);
    return { symbol, historicalData: response.data };
  }
);

export const fetchHistoricalData = createAsyncThunk(
  'stocks/fetchHistoricalData',
  async (symbol) => {
    const historicalData = await stocksApi.getHistoricalData(symbol);
    return { symbol, historicalData };
  }
);

export const initializeAllHistoricalData = createAsyncThunk(
  'stocks/initializeAllHistoricalData',
  async () => {
    return await stocksApi.initializeAllHistoricalData();
  }
);

// Новая функция для загрузки всех исторических данных
export const loadAllHistoricalData = createAsyncThunk(
  'stocks/loadAllHistoricalData',
  async (_, { dispatch, getState }) => {
    const state = getState();
    const stocks = state.stocks.items;
    
    const results = [];
    for (const stock of stocks) {
      if (!stock.history || stock.history.length === 0) {
        try {
          const result = await dispatch(loadHistoricalData(stock.symbol)).unwrap();
          results.push(result);
        } catch (error) {
          console.error(`Failed to load historical data for ${stock.symbol}:`, error);
          results.push({ symbol: stock.symbol, error: error.message });
        }
      }
    }
    
    return results;
  }
);

const stocksSlice = createSlice({
  name: 'stocks',
  initialState: {
    items: [],
    loading: false,
    error: null,
    selectedStock: null,
    historicalLoading: {},
    allHistoricalDataLoaded: false,
    loadingHistoricalData: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedStock: (state, action) => {
      state.selectedStock = action.payload;
    },
    clearSelectedStock: (state) => {
      state.selectedStock = null;
    },
    setAllHistoricalDataLoaded: (state, action) => {
      state.allHistoricalDataLoaded = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchStocks
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        
        // Проверяем, все ли акции имеют исторические данные
        const allHaveHistory = action.payload.every(stock => 
          stock.history && stock.history.length > 0
        );
        state.allHistoricalDataLoaded = allHaveHistory;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // updateStock
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.symbol === action.payload.symbol);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        // Также обновляем selectedStock если он открыт
        if (state.selectedStock && state.selectedStock.symbol === action.payload.symbol) {
          state.selectedStock = action.payload;
        }
      })
      // loadHistoricalData
      .addCase(loadHistoricalData.pending, (state, action) => {
        state.historicalLoading[action.meta.arg] = true;
      })
      .addCase(loadHistoricalData.fulfilled, (state, action) => {
        const { symbol, historicalData } = action.payload;
        state.historicalLoading[symbol] = false;
        
        const index = state.items.findIndex(item => item.symbol === symbol);
        if (index !== -1) {
          state.items[index].history = historicalData;
        }
        if (state.selectedStock && state.selectedStock.symbol === symbol) {
          state.selectedStock.history = historicalData;
        }
        
        // Проверяем, все ли акции теперь имеют исторические данные
        const allHaveHistory = state.items.every(stock => 
          stock.history && stock.history.length > 0
        );
        state.allHistoricalDataLoaded = allHaveHistory;
      })
      .addCase(loadHistoricalData.rejected, (state, action) => {
        state.historicalLoading[action.meta.arg] = false;
        state.error = action.error.message;
      })
      // fetchHistoricalData
      .addCase(fetchHistoricalData.fulfilled, (state, action) => {
        const { symbol, historicalData } = action.payload;
        const index = state.items.findIndex(item => item.symbol === symbol);
        if (index !== -1) {
          state.items[index].history = historicalData;
        }
      })
      // loadAllHistoricalData
      .addCase(loadAllHistoricalData.pending, (state) => {
        state.loadingHistoricalData = true;
      })
      .addCase(loadAllHistoricalData.fulfilled, (state, action) => {
        state.loadingHistoricalData = false;
        
        // Проверяем, все ли акции теперь имеют исторические данные
        const allHaveHistory = state.items.every(stock => 
          stock.history && stock.history.length > 0
        );
        state.allHistoricalDataLoaded = allHaveHistory;
      })
      .addCase(loadAllHistoricalData.rejected, (state, action) => {
        state.loadingHistoricalData = false;
        state.error = action.error.message;
      });
  },
});

export const { 
  clearError, 
  setSelectedStock, 
  clearSelectedStock, 
  setAllHistoricalDataLoaded 
} = stocksSlice.actions;
export default stocksSlice.reducer;