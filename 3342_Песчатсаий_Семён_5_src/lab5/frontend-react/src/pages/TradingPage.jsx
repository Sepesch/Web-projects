import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startTrading, stopTrading } from '../store/slices/tradingSlice.js';
import './TradingPage.css';

const TradingPage = () => {
  const dispatch = useDispatch();
  const { isTrading, currentDate, stockPrices, speed } = useSelector(state => state.trading);
  const { items: stocks } = useSelector(state => state.stocks);
  
  const [startDate, setStartDate] = useState('');
  const [tradingSpeed, setTradingSpeed] = useState(1);

  const handleStartTrading = () => {
    if (!startDate) {
      alert('Пожалуйста, выберите дату начала торгов');
      return;
    }
    dispatch(startTrading({
      startDate,
      speed: tradingSpeed
    }));
  };

  const handleStopTrading = () => {
    dispatch(stopTrading());
  };

  return (
    <div className="page-container">
      <h1>Настройки биржи</h1>
      
      <div className="trading-controls">
        <div className="control-group">
          <label htmlFor="startDate">Дата начала торгов:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isTrading}
          />
        </div>
        
        <div className="control-group">
          <label htmlFor="speed">Скорость смены дат (секунды):</label>
          <input
            type="number"
            id="speed"
            min="1"
            max="10"
            value={tradingSpeed}
            onChange={(e) => setTradingSpeed(parseInt(e.target.value))}
            disabled={isTrading}
          />
        </div>
        
        <div className="control-buttons">
          {!isTrading ? (
            <button onClick={handleStartTrading} className="btn-start">
              Начало торгов
            </button>
          ) : (
            <button onClick={handleStopTrading} className="btn-stop">
              Остановить торги
            </button>
          )}
        </div>
      </div>

      {isTrading && (
        <div className="trading-info">
          <div className="current-date">
            <h3>Текущая дата: {currentDate}</h3>
          </div>
          
          <div className="stock-prices">
            <h3>Текущие цены акций:</h3>
            <div className="prices-grid">
              {stocks.filter(stock => stock.enabled).map(stock => (
                <div key={stock.symbol} className="price-card">
                  <h4>{stock.symbol}</h4>
                  <p className="price">
                    ${stockPrices[stock.symbol] || 'N/A'}
                  </p>
                  <span>{stock.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPage;