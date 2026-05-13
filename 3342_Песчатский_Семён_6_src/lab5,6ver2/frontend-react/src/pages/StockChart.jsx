import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const StockChart = ({ data, symbol }) => {
  console.log('StockChart data:', data);
  
  // Функция для парсинга цены из строки с $
  const parsePrice = (priceStr) => {
    if (!priceStr && priceStr !== 0) return 0;
    
    if (typeof priceStr === 'number') return priceStr;
    
    if (typeof priceStr === 'string') {
      // Удаляем все символы кроме цифр, точки и минуса
      const numericStr = priceStr.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(numericStr);
      return !isNaN(parsed) ? parsed : 0;
    }
    
    return 0;
  };

  const chartData = data.map(item => ({
    date: item.date,
    price: parsePrice(item.open),
    name: symbol
  })).reverse();

  const formatPrice = (value) => {
    return `$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`;
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            tickFormatter={formatPrice}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip 
            formatter={formatPrice}
            labelFormatter={(date) => `Дата: ${date}`}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#8884d8" 
            name={symbol}
            dot={{ r: 2 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
export default StockChart;