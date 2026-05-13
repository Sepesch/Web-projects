import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StockChart from './StockChart';
import { 
  fetchStocks, 
  updateStock, 
  loadHistoricalData,
  fetchHistoricalData,
  setSelectedStock,
  clearError 
} from '../store/slices/stocksSlice';
import './StocksPage.css';

const StocksPage = () => {
  const dispatch = useDispatch();
  const { 
    items: stocks, 
    loading, 
    error, 
    selectedStock, 
    historicalLoading 
  } = useSelector(state => state.stocks);

  useEffect(() => {
    dispatch(fetchStocks());
  }, [dispatch]);

  const handleToggleStock = async (symbol, currentEnabled) => {
    try {
      await dispatch(updateStock({
        symbol,
        updates: { enabled: !currentEnabled }
      })).unwrap();
      dispatch(clearError());
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  const handleLoadHistoricalData = async (symbol) => {
    try {
      await dispatch(loadHistoricalData(symbol)).unwrap();
      dispatch(clearError());
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  };

  const handleSelectStock = async (stock) => {
    dispatch(setSelectedStock(stock));
    
    // Если у акции нет исторических данных, пытаемся загрузить их
    if (!stock.history || stock.history.length === 0) {
      try {
        await dispatch(fetchHistoricalData(stock.symbol)).unwrap();
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
      }
    }
  };

  const handleBackToList = () => {
    dispatch(setSelectedStock(null));
  };

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    return price || 'N/A';
  };

  if (loading && stocks.length === 0) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка акций...</div>
      </div>
    );
  }

  return (
    <div className="stocks-page">
      <div className="page-header">
        <h1>Управление акциями</h1>
        <p className="page-description">
          Просматривайте доступные акции, загружайте исторические данные и выбирайте акции для участия в торгах.
        </p>
      </div>

      {error && (
        <div className="error-message">
          <strong>Ошибка:</strong> {error}
          <button 
            onClick={() => dispatch(clearError())}
            className="error-close"
          >
            ×
          </button>
        </div>
      )}

      {selectedStock ? (
        // Детальный просмотр акции
        <div className="stock-detail-view">
          <div className="detail-header">
            <button onClick={handleBackToList} className="btn-back">
              ← Назад к списку
            </button>
            <h2>{selectedStock.name} ({selectedStock.symbol})</h2>
            <div className="stock-status">
              <span className={`status-badge ${selectedStock.enabled ? 'enabled' : 'disabled'}`}>
                {selectedStock.enabled ? 'Участвует в торгах' : 'Не участвует в торгах'}
              </span>
            </div>
          </div>

          <div className="stock-actions">
            <button
              onClick={() => handleToggleStock(selectedStock.symbol, selectedStock.enabled)}
              className={`btn-toggle ${selectedStock.enabled ? 'btn-disable' : 'btn-enable'}`}
            >
              {selectedStock.enabled ? 'Исключить из торгов' : 'Включить в торги'}
            </button>
            
            {!selectedStock.history || selectedStock.history.length === 0 ? (
              <button
                onClick={() => handleLoadHistoricalData(selectedStock.symbol)}
                disabled={historicalLoading[selectedStock.symbol]}
                className="btn-load-history"
              >
                {historicalLoading[selectedStock.symbol] ? 'Загрузка...' : 'Загрузить исторические данные'}
              </button>
            ) : (
              <span className="history-loaded">
                ✓ Исторические данные загружены ({selectedStock.history.length} записей)
              </span>
            )}
          </div>

          <div className="chart-section">
            <h3>График изменения цены</h3>
            {selectedStock.history && selectedStock.history.length > 0 ? (
              <StockChart 
                data={selectedStock.history} 
                symbol={selectedStock.symbol} 
              />
            ) : (
              <div className="no-data-message">
                <p>Для просмотра графика необходимо загрузить исторические данные.</p>
              </div>
            )}
          </div>

          {selectedStock.history && selectedStock.history.length > 0 && (
            <div className="history-table-section">
              <h3>Исторические данные</h3>
              <div className="table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Цена открытия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStock.history.slice(0, 40).map((item, index) => (
                      <tr key={index}>
                        <td>{item.date}</td>
                        <td className="price-cell">{formatPrice(item.open)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Список акций
        <div className="stocks-list-section">
          <div className="section-header">
            <h2>Доступные акции</h2>
            <div className="stocks-stats">
              <span className="total-stocks">Всего: {stocks.length}</span>
              <span className="enabled-stocks">
                В торгах: {stocks.filter(s => s.enabled).length}
              </span>
            </div>
          </div>

          <div className="stocks-grid">
            {stocks.map(stock => (
              <div key={stock.symbol} className={`stock-card ${stock.enabled ? 'enabled' : 'disabled'}`}>
                <div className="stock-info">
                  <h3 className="stock-symbol">{stock.symbol}</h3>
                  <p className="stock-name">{stock.name}</p>
                  
                  <div className="stock-details">
                    <div className="detail-item">
                      <span className="detail-label">Статус:</span>
                      <span className={`status ${stock.enabled ? 'enabled' : 'disabled'}`}>
                        {stock.enabled ? 'В торгах' : 'Не в торгах'}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Исторические данные:</span>
                      <span className={`history-status ${stock.history && stock.history.length > 0 ? 'loaded' : 'not-loaded'}`}>
                        {stock.history && stock.history.length > 0 
                          ? `Загружено (${stock.history.length})` 
                          : 'Не загружены'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="stock-actions">
                  <button
                    onClick={() => handleToggleStock(stock.symbol, stock.enabled)}
                    className={`btn-toggle ${stock.enabled ? 'btn-disable' : 'btn-enable'}`}
                  >
                    {stock.enabled ? 'Исключить' : 'Включить'}
                  </button>
                  
                  <button
                    onClick={() => handleSelectStock(stock)}
                    className="btn-view-details"
                  >
                    Подробнее
                  </button>

                  {(!stock.history || stock.history.length === 0) && (
                    <button
                      onClick={() => handleLoadHistoricalData(stock.symbol)}
                      disabled={historicalLoading[stock.symbol]}
                      className="btn-load-history"
                    >
                      {historicalLoading[stock.symbol] ? 'Загрузка...' : 'Загрузить данные'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StocksPage;