import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStocks } from '../store/slices/stocksSlice.js';
import StockChart from '../components/StockChart';

const StocksPage = () => {
  const dispatch = useDispatch();
  const { items: stocks } = useSelector(state => state.stocks);

  useEffect(() => {
    dispatch(fetchStocks());
  }, [dispatch]);

  return (
    <div className="page-container">
      <h1>Акции и котировки</h1>
      
      <div className="stocks-grid">
        {stocks.map(stock => (
          <div key={stock.symbol} className="stock-card">
            <div className="stock-header">
              <h3>{stock.symbol}</h3>
              <span>{stock.name}</span>
              <label>
                <input
                  type="checkbox"
                  checked={stock.enabled}
                  onChange={() => {/* handle toggle */}}
                />
                Участвует в торгах
              </label>
            </div>
            
            <StockChart data={stock.history} />
            
            <div className="price-history">
              <h4>История цен:</h4>
              <table>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Цена открытия</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.history.slice(0, 10).map(price => (
                    <tr key={price.date}>
                      <td>{price.date}</td>
                      <td>${price.open}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StocksPage;