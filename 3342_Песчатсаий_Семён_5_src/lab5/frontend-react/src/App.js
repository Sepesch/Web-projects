import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import Layout from './components/Layout.jsx';
import BrokersPage from './pages/BrokersPage.jsx';
import StocksPage from './pages/StocksPage.jsx';
import TradingPage from './pages/TradingPage.jsx';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<BrokersPage />} />
            <Route path="/brokers" element={<BrokersPage />} />
            <Route path="/stocks" element={<StocksPage />} />
            <Route path="/trading" element={<TradingPage />} />
          </Routes>
        </Layout>
      </Router>
    </Provider>
  );
}

export default App;