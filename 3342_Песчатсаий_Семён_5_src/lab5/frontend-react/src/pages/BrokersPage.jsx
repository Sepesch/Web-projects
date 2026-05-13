import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBrokers, addBroker, deleteBroker, updateBroker } from '../store/slices/brokersSlice.js';
import './BrokersPage.css';

const BrokersPage = () => {
  const dispatch = useDispatch();
  const { items: brokers, loading, error } = useSelector(state => state.brokers);
  const [newBroker, setNewBroker] = useState({ name: '', initialFunds: '' });
  const [editingBroker, setEditingBroker] = useState(null);

  useEffect(() => {
    dispatch(fetchBrokers());
  }, [dispatch]);

  const handleAddBroker = (e) => {
    e.preventDefault();
    if (newBroker.name && newBroker.initialFunds) {
      dispatch(addBroker({
        name: newBroker.name,
        initialFunds: parseFloat(newBroker.initialFunds)
      }));
      setNewBroker({ name: '', initialFunds: '' });
    }
  };

  const handleDeleteBroker = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого брокера?')) {
      dispatch(deleteBroker(id));
    }
  };

  const handleUpdateBroker = (broker) => {
    setEditingBroker(broker);
  };

  const handleSaveUpdate = () => {
    if (editingBroker) {
      dispatch(updateBroker({
        id: editingBroker.id,
        updates: { initialFunds: parseFloat(editingBroker.initialFunds) }
      }));
      setEditingBroker(null);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="page-container">
      <h1>Управление брокерами</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleAddBroker} className="broker-form">
        <h3>Добавить нового брокера</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="Имя брокера"
            value={newBroker.name}
            onChange={(e) => setNewBroker({...newBroker, name: e.target.value})}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Начальные средства"
            value={newBroker.initialFunds}
            onChange={(e) => setNewBroker({...newBroker, initialFunds: e.target.value})}
            required
          />
          <button type="submit">Добавить</button>
        </div>
      </form>

      <div className="brokers-list">
        <h3>Список брокеров</h3>
        {brokers.length === 0 ? (
          <p>Нет добавленных брокеров</p>
        ) : (
          brokers.map(broker => (
            <div key={broker.id} className="broker-card">
              {editingBroker?.id === broker.id ? (
                <div className="edit-form">
                  <h4>{broker.name}</h4>
                  <input
                    type="number"
                    step="0.01"
                    value={editingBroker.initialFunds}
                    onChange={(e) => setEditingBroker({
                      ...editingBroker,
                      initialFunds: e.target.value
                    })}
                  />
                  <div className="edit-actions">
                    <button onClick={handleSaveUpdate}>Сохранить</button>
                    <button onClick={() => setEditingBroker(null)}>Отмена</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="broker-info">
                    <h4>{broker.name}</h4>
                    <p>Начальные средства: <strong>${broker.initialFunds}</strong></p>
                    <p>Текущие средства: <strong>${broker.currentFunds}</strong></p>
                  </div>
                  <div className="broker-actions">
                    <button 
                      onClick={() => handleUpdateBroker(broker)}
                      className="btn-edit"
                    >
                      Изменить
                    </button>
                    <button 
                      onClick={() => handleDeleteBroker(broker.id)}
                      className="btn-delete"
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
    </div>
  );
};

export default BrokersPage;