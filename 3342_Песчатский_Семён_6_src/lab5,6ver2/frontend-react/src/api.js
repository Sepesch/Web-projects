const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiClient = {
  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorText;
        } catch {
          errorMessage = errorText || `HTTP error! status: ${response.status}`;
        }
        
        throw new ApiError(errorMessage, response.status);
      }

      // Для DELETE запросов может не быть тела ответа
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.message || 'Network error', 0);
    }
  },

  async get(url) {
    return this.request(url, { method: 'GET' });
  },

  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: data,
    });
  },

  async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: data,
    });
  },

  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  },

  async patch(url, data) {
    return this.request(url, {
      method: 'PATCH',
      body: data,
    });
  },
};

// Вспомогательные функции для конкретных эндпоинтов
export const stocksApi = {
  getAll: () => apiClient.get('/stocks'),
  getBySymbol: (symbol) => apiClient.get(`/stocks/${symbol}`),
  update: (symbol, updates) => apiClient.put(`/stocks/${symbol}`, updates),
  loadHistoricalData: (symbol) => apiClient.post(`/stocks/${symbol}/history/load`),
  getHistoricalData: (symbol) => apiClient.get(`/stocks/${symbol}/history`),
  initializeAllHistoricalData: () => apiClient.post('/stocks/initialize-historical-data'),
};

export const brokersApi = {
  getAll: () => apiClient.get('/brokers'),
  getById: (id) => apiClient.get(`/brokers/${id}`),
  create: (brokerData) => apiClient.post('/brokers', brokerData),
  update: (id, updates) => apiClient.put(`/brokers/${id}`, updates),
  delete: (id) => apiClient.delete(`/brokers/${id}`),
};
// export const tradingApi = {
//   getState: () => apiClient.get('/trading/state'),
//   start: (settings) => apiClient.post('/trading/start', settings),
//   stop: () => apiClient.post('/trading/stop'),
//   next: () => apiClient.post('/trading/next'),
//   getPrices: () => apiClient.get('/trading/prices'),
//   getHistory: () => apiClient.get('/trading/history'),
// };
export default apiClient;