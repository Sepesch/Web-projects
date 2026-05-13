import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchStocks = createAsyncThunk(
  'stocks/fetchStocks',
  async () => {
    const response = await fetch('http://localhost:3001/api/stocks');
    if (!response.ok) {
      throw new Error('Failed to fetch stocks');
    }
    return await response.json();
  }
);

export const updateStock = createAsyncThunk(
  'stocks/updateStock',
  async ({ symbol, updates }) => {
    const response = await fetch(`http://localhost:3001/api/stocks/${symbol}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update stock');
    }
    return await response.json();
  }
);

const stocksSlice = createSlice({
  name: 'stocks',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateStockPrice: (state, action) => {
      const { symbol, price } = action.payload;
      const stock = state.items.find(s => s.symbol === symbol);
      if (stock) {
        stock.currentPrice = price;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.symbol === action.payload.symbol);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { clearError, updateStockPrice } = stocksSlice.actions;
export default stocksSlice.reducer;