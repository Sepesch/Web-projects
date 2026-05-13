import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Асинхронные действия
export const fetchBrokers = createAsyncThunk(
  'brokers/fetchBrokers',
  async () => {
    const response = await fetch('/api/brokers');
    if (!response.ok) {
      throw new Error('Failed to fetch brokers');
    }
    return await response.json();
  }
);

export const addBroker = createAsyncThunk(
  'brokers/addBroker',
  async (brokerData) => {
    const response = await fetch('/api/brokers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brokerData),
    });
    if (!response.ok) {
      throw new Error('Failed to add broker');
    }
    return await response.json();
  }
);

export const updateBroker = createAsyncThunk(
  'brokers/updateBroker',
  async ({ id, updates }) => {
    const response = await fetch(`/api/brokers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update broker');
    }
    return await response.json();
  }
);

export const deleteBroker = createAsyncThunk(
  'brokers/deleteBroker',
  async (id) => {
    const response = await fetch(`/api/brokers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete broker');
    }
    return id;
  }
);

const brokersSlice = createSlice({
  name: 'brokers',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBrokers
      .addCase(fetchBrokers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrokers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBrokers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // addBroker
      .addCase(addBroker.pending, (state) => {
        state.loading = true;
      })
      .addCase(addBroker.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addBroker.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // updateBroker
      .addCase(updateBroker.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBroker.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateBroker.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // deleteBroker
      .addCase(deleteBroker.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteBroker.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteBroker.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError } = brokersSlice.actions;
export default brokersSlice.reducer;