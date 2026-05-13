import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchBrokers, 
  addBroker, 
  deleteBroker, 
  updateBroker,
  clearError 
} from '../store/slices/brokersSlice';
import './BrokersPage.css';

const BrokersPage = () => {
  const dispatch = useDispatch();
  const { items: brokers, loading, error } = useSelector(state => state.brokers);
  
  const [newBroker, setNewBroker] = useState({ name: '', initialFunds: '' });
  const [editingBroker, setEditingBroker] = useState(null);
  const [editForm, setEditForm] = useState({ initialFunds: '' });

  useEffect(() => {
    dispatch(fetchBrokers());
  }, [dispatch]);

  const handleAddBroker = async (e) => {
    e.preventDefault();
    if (newBroker.name && newBroker.initialFunds) {
      try {
        await dispatch(addBroker({
          name: newBroker.name,
          initialFunds: parseFloat(newBroker.initialFunds)
        })).unwrap();
        setNewBroker({ name: '', initialFunds: '' });
        dispatch(clearError());
      } catch (error) {
        console.error('Failed to add broker:', error);
      }
    }
  };

  const handleDeleteBroker = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого брокера?')) {
      try {
        await dispatch(deleteBroker(id)).unwrap();
        dispatch(clearError());
      } catch (error) {
        console.error('Failed to delete broker:', error);
      }
    }
  };

  const handleStartEdit = (broker) => {
    setEditingBroker(broker);
    setEditForm({ initialFunds: broker.initialFunds.toString() });
  };

  const handleCancelEdit = () => {
    setEditingBroker(null);
    setEditForm({ initialFunds: '' });
  };

  const handleSaveEdit = async () => {
    if (editingBroker && editForm.initialFunds) {
      try {
        await dispatch(updateBroker({
          id: editingBroker.id,
          updates: { 
            initialFunds: parseFloat(editForm.initialFunds),
            currentFunds: parseFloat(editForm.initialFunds) // Обновляем и текущие средства
          }
        })).unwrap();
        setEditingBroker(null);
        setEditForm({ initialFunds: '' });
        dispatch(clearError());
      } catch (error) {
        console.error('Failed to update broker:', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading && brokers.length === 0) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка брокеров...</div>
      </div>
    );
  }

  return (
    <div className="brokers-page">
      <div className="page-header">
        <h1>Управление брокерами</h1>
        <p className="page-description">
          Добавляйте, редактируйте и удаляйте брокеров. Управляйте их начальным капиталом.
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

      {/* Форма добавления брокера */}
      <section className="add-broker-section">
        <h2>Добавить нового брокера</h2>
        <form onSubmit={handleAddBroker} className="broker-form">
          <div className="form-group">
            <label htmlFor="brokerName">Имя брокера:</label>
            <input
              type="text"
              id="brokerName"
              placeholder="Введите имя брокера"
              value={newBroker.name}
              onChange={(e) => setNewBroker({...newBroker, name: e.target.value})}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="initialFunds">Начальные средства ($):</label>
            <input
              type="number"
              id="initialFunds"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={newBroker.initialFunds}
              onChange={(e) => setNewBroker({...newBroker, initialFunds: e.target.value})}
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-add"
            disabled={loading || !newBroker.name || !newBroker.initialFunds}
          >
            {loading ? 'Добавление...' : 'Добавить брокера'}
          </button>
        </form>
      </section>

      {/* Список брокеров */}
      <section className="brokers-list-section">
        <div className="section-header">
          <h2>Список брокеров</h2>
          <span className="brokers-count">{brokers.length} брокеров</span>
        </div>

        <div className="brokers-grid">
          {brokers.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👤</div>
              <h3>Брокеры не найдены</h3>
              <p>Добавьте первого брокера, используя форму выше</p>
            </div>
          ) : (
            brokers.map(broker => (
              <div key={broker.id} className="broker-card">
                {editingBroker?.id === broker.id ? (
                  // Форма редактирования
                  <div className="edit-form">
                    <div className="edit-form-header">
                      <h4>{broker.name}</h4>
                      <span className="edit-badge">Редактирование</span>
                    </div>
                    
                    <div className="edit-input-group">
                      <div className="edit-input">
                        <label htmlFor={`edit-funds-${broker.id}`}>
                          Начальные средства ($):
                        </label>
                        <input
                          type="number"
                          id={`edit-funds-${broker.id}`}
                          step="0.01"
                          min="0"
                          value={editForm.initialFunds}
                          onChange={(e) => setEditForm({ initialFunds: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="edit-actions">
                      <button 
                        onClick={handleSaveEdit}
                        className="btn-save"
                        disabled={loading || !editForm.initialFunds}
                      >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className="btn-cancel"
                        disabled={loading}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  // Отображение информации о брокере
                  <>
                    <div className="broker-info">
                      <h3 className="broker-name">{broker.name}</h3>
                      <div className="broker-funds">
                        <div className="fund-item">
                          <span className="fund-label">Начальные средства</span>
                          <span className="fund-value initial">
                            ${formatCurrency(broker.initialFunds)}
                          </span>
                        </div>
                        <div className="fund-item">
                          <span className="fund-label">Текущие средства</span>
                          <span className="fund-value">
                            ${formatCurrency(broker.currentFunds)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="broker-actions">
                      <button 
                        onClick={() => handleStartEdit(broker)}
                        className="btn-edit"
                        disabled={loading}
                      >
                        Изменить
                      </button>
                      <button 
                        onClick={() => handleDeleteBroker(broker.id)}
                        className="btn-delete"
                        disabled={loading}
                      >
                        Удалить
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default BrokersPage;