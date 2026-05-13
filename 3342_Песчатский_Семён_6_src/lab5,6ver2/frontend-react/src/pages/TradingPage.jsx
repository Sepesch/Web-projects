import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import './TradingPage.css';

export const socket = io('http://localhost:3000');

const TradingPage = () => {
  const [tradingState, setTradingState] = useState({
    isTrading: false,
    currentDate: '',
    stockPrices: {},
    loading: false,
    currentDateIndex: 0,
    availableDates: [],
    tradingHistory: [],
    completedTradingHistory: [],
    initialPrices: {},
    error: null,
    flag: false
  });

  const [stocks, setStocks] = useState([]);
  const [tradingSettings, setTradingSettings] = useState({
    startDate: '',
    speed: 1
  });

  const [socketConnected, setSocketConnected] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  
  const tradingIntervalRef = useRef(null);

  useEffect(() => {
    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit('get_trading_state');
      socket.emit('get_stocks');
    };

    const handleDisconnect = () => setSocketConnected(false);

    const handleTradingStarted = (data) => {
      setTradingState(prev => ({
        ...prev,
        isTrading: true,
        loading: false,
        error: null,
        ...data
      }));
    };

    const handleTradingStopped = (data) => {
      setTradingState(prev => ({
        ...prev,
        isTrading: false,
        loading: false,
        error: null,
        ...data
      }));
      if (tradingIntervalRef.current) {
        clearInterval(tradingIntervalRef.current);
        tradingIntervalRef.current = null;
      }
    };

    const handleNextStep = (data) => {
      setTradingState(prev => ({ ...prev, ...data }));
    };

    const handlePriceUpdate = (data) => {
      setTradingState(prev => ({
        ...prev,
        stockPrices: { ...data.prices },
        ...data
      }));
    };

    const handleTradingError = (error) => {
      setTradingState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Произошла ошибка',
      }));
    };

    const handleTradingState = (data) => {
      setTradingState(prev => ({ ...prev, ...data }));
    };

    const handleStocksData = (data) => {
      setStocks(data.stocks || data);
      if (data.stocks?.length > 0) {
        socket.emit('get_available_dates');
      }
    };

    const handleAvailableDates = (data) => {
      setAvailableDates(data.dates || data);
    };

    const events = {
      connect: handleConnect,
      disconnect: handleDisconnect,
      trading_started: handleTradingStarted,
      trading_stopped: handleTradingStopped,
      next_step: handleNextStep,
      price_update: handlePriceUpdate,
      trading_error: handleTradingError,
      trading_state: handleTradingState,
      stocks_data: handleStocksData,
      available_dates: handleAvailableDates,
    };

    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    if (socket.connected) {
      socket.emit('get_trading_state');
      socket.emit('get_stocks');
    }

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      if (tradingIntervalRef.current) {
        clearInterval(tradingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (tradingIntervalRef.current) {
      clearInterval(tradingIntervalRef.current);
      tradingIntervalRef.current = null;
    }

    if (tradingState.isTrading) {
      tradingIntervalRef.current = setInterval(() => {
        socket.emit('next_trading_step', { sessionId: 'current' });
      }, tradingSettings.speed * 1000);
    }

    return () => {
      if (tradingIntervalRef.current) {
        clearInterval(tradingIntervalRef.current);
        tradingIntervalRef.current = null;
      }
    };
  }, [tradingState.isTrading, tradingSettings.speed]); // Зависимости: состояние торгов и скорость

  const formatDateToMMDDYYYY = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const formatDateToYYYYMMDD = (dateString) => {
    if (!dateString) return '';
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleStartTrading = () => {
    if (!tradingSettings.startDate) {
      alert('Пожалуйста, выберите дату начала торгов');
      return;
    }

    setTradingState(prev => ({ ...prev, loading: false, error: null, flag: true }));

    socket.emit('start_trading', {
      startDate: formatDateToMMDDYYYY(tradingSettings.startDate),
      speed: tradingSettings.speed,
      stocks: stocks.filter(stock => stock.enabled).map(stock => stock.symbol),
    });

  };

  const handleStopTrading = () => {
    setTradingState(prev => ({ ...prev, loading: true }));
    socket.emit('stop_trading', { sessionId: 'current' });
  };

  const handleManualNextStep = () => {
    socket.emit('next_trading_step', { sessionId: 'current', manual: true });
  };

  const handleClearError = () => {
    setTradingState(prev => ({ ...prev, error: null }));
  };

  const handleSettingsChange = (field, value) => {
    setTradingSettings(prev => ({ ...prev, [field]: value }));
  };

  const enabledStocks = stocks.filter(stock => stock.enabled);
  const enabledStocksCount = enabledStocks.length;

  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const getProgress = () => {
    if (!tradingState.availableDates?.length || tradingState.currentDateIndex === 0) return 0;
    return ((tradingState.currentDateIndex + 1) / tradingState.availableDates.length) * 100;
  };

  const getPriceChangeFromStart = (symbol) => {
    if (!tradingState.stockPrices?.[symbol] || !tradingState.initialPrices?.[symbol]) return null;
    
    const currentPrice = tradingState.stockPrices[symbol];
    const initialPrice = tradingState.initialPrices[symbol];
    const change = currentPrice - initialPrice;
    const changePercent = (change / initialPrice) * 100;

    return { change, changePercent, isPositive: change >= 0 };
  };

  const getDateRange = () => {
    if (availableDates.length === 0) return { min: '', max: '' };
    
    const sortedDates = [...availableDates].sort((a, b) => new Date(a) - new Date(b));
    return {
      min: formatDateToYYYYMMDD(sortedDates[0]),
      max: formatDateToYYYYMMDD(sortedDates[sortedDates.length - 1])
    };
  };

  const dateRange = getDateRange();

  return (
    <div className="trading-page">
      <div className="page-header">
        <h1>Управление биржевыми торгами</h1>
        <p className="page-description">
          Настройте параметры имитации торгов и запустите торговую сессию.
        </p>
        
        <div className={`websocket-status ${socketConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-indicator"></div>
          WebSocket: {socketConnected ? 'Подключен' : 'Отключен'}
        </div>
      </div>

      {tradingState.error && (
        <div className="error-message">
          <strong>Ошибка:</strong> {tradingState.error}
          <button onClick={handleClearError} className="error-close">×</button>
        </div>
      )}

      <div className="websocket-controls">
        <div className="control-buttons">
          <button
            onClick={() => socket.emit('get_available_dates')}
            className="btn btn-secondary"
            disabled={!socketConnected}
          >
            📅 Получить даты
          </button>
        </div>
        
        {availableDates.length > 0 && (
          <div className="data-info">
            <span>Доступно дат: {availableDates.length}</span>
            <span>Диапазон: {availableDates[availableDates.length - 1]} - {availableDates[0]}</span>
          </div>
        )}
      </div>

      <div className="trading-controls-section">
        <div className="controls-panel">
          <div className="panel-header">
            <h2>Настройки имитации торгов</h2>
            <div className={`trading-status ${tradingState.isTrading ? 'trading-active' : 'trading-inactive'}`}>
              <div className="status-indicator"></div>
              {tradingState.isTrading ? 'Торги активны' : 'Торги остановлены'}
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label>Дата начала торгов *</label>
              <input
                type="date"
                value={tradingSettings.startDate}
                onChange={(e) => handleSettingsChange('startDate', e.target.value)}
                disabled={tradingState.isTrading || tradingState.loading}
                className="form-input"
                min={dateRange.min}
                max={dateRange.max}
              />
              <div className="form-hint">
                Выберите дату начала торгов
                {availableDates.length > 0 && ` (доступно ${availableDates.length} дней)`}
              </div>
            </div>

            <div className="form-group">
              <label>Скорость смены дат: {tradingSettings.speed} сек</label>
              <input
                type="range"
                min="1"
                max="10"
                value={tradingSettings.speed}
                onChange={(e) => handleSettingsChange('speed', parseInt(e.target.value))}
                disabled={tradingState.isTrading || tradingState.loading}
                className="speed-slider"
              />
              <div className="speed-labels">
                <span>Быстро</span>
                <span>Медленно</span>
              </div>
            </div>

            <div className="form-info">
              <div className="info-item">
                <span>Всего акций: {stocks.length}</span>
                <span>Активных: {enabledStocksCount}</span>
              </div>
              {enabledStocksCount === 0 && (
                <div className="warning-message">
                  ⚠️ Нет активных акций для торгов
                </div>
              )}
            </div>

            <div className="control-buttons">
              {!tradingState.isTrading ? (
                <button
                  onClick={handleStartTrading}
                  disabled={tradingState.loading || enabledStocksCount === 0 || !tradingSettings.startDate || !socketConnected}
                  className="btn btn-primary btn-start-trading"
                >
                  {tradingState.loading ? 'Запуск торгов...' : '▶ Начало торгов'}
                </button>
              ) : (
                <div className="trading-active-controls">
                  <button
                    onClick={handleStopTrading}
                    className="btn btn-danger btn-stop-trading"
                    disabled={!socketConnected}
                  >
                    ⏹ Остановить торги
                  </button>
                  <button
                    onClick={handleManualNextStep}
                    className="btn btn-secondary btn-next-step"
                    disabled={!socketConnected}
                  >
                    ⏭ Следующая дата
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="current-trading-panel">
          <div className="panel-header">
            <h2>Текущее состояние торгов</h2>
            {tradingState.isTrading && tradingState.availableDates?.length > 0 && (
              <div className="progress-info">
                Дата {tradingState.currentDateIndex + 1} из {tradingState.availableDates.length}
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getProgress()}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          {(tradingState.isTrading || tradingState.flag) ? (
            <div className="trading-session-active">
              <div className="current-date-section">
                <h3>Текущая дата торгов</h3>
                <div className="date-display">
                  {tradingState.currentDate ? (
                    <>
                      <span className="date-text">{tradingState.currentDate}</span>
                      <span className="date-badge">Активно</span>
                    </>
                  ) : (
                    <span className="date-loading">Загрузка...</span>
                  )}
                </div>
              </div>

              <div className="current-prices-section">
                <h3>Текущие стоимости акций</h3>
                <p>Данные обновляются каждые {tradingSettings.speed} секунд</p>
                <div className="prices-grid">
                  {enabledStocks.map(stock => {
                    const priceChange = getPriceChangeFromStart(stock.symbol);
                    const currentPrice = tradingState.stockPrices[stock.symbol];
                    
                    return (
                      <div key={stock.symbol} className="price-card">
                        <div className="stock-header">
                          <div className="stock-symbol">{stock.symbol}</div>
                          <div className="stock-name">{stock.name}</div>
                        </div>
                        <div className="price-content">
                          <div className="price-main-info">
                            <div className={`current-price ${priceChange?.isPositive ? 'price-up' : priceChange ? 'price-down' : ''}`}>
                              {formatPrice(currentPrice)}
                            </div>
                            
                            {priceChange && (
                              <div className={`total-change ${priceChange.isPositive ? 'change-positive' : 'change-negative'}`}>
                                <span className="change-icon">
                                  {priceChange.isPositive ? '↗' : '↘'}
                                </span>
                                <span className="change-text">
                                  {priceChange.isPositive ? '+' : ''}{priceChange.change.toFixed(2)} 
                                  ({priceChange.isPositive ? '+' : ''}{priceChange.changePercent.toFixed(2)}%)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="trading-session-inactive">
              <div className="inactive-message">
                <div className="inactive-icon">⏸</div>
                <h3>Торги не активны</h3>
                <p>Запустите торговую сессию для начала имитации</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingPage;