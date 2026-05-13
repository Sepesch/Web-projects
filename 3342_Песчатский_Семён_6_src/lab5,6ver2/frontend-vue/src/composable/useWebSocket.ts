import { ref, onUnmounted, readonly } from 'vue';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const socket = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const messages = ref<WebSocketMessage[]>([]);
  const clientId = ref<string | null>(null);
  const error = ref<string | null>(null);

  const connect = (url: string = 'ws://localhost:3000/ws') => {
    try {
      socket.value = new WebSocket(url);
      
      socket.value.onopen = () => {
        isConnected.value = true;
        error.value = null;
        console.log('WebSocket подключен');
      };

      socket.value.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          messages.value.push(data);
          
          // Обработка специальных сообщений
          if (data.type === 'connection') {
            clientId.value = data.clientId;
          }
          
          console.log('Получено сообщение:', data);
        } catch (e) {
          console.error('Ошибка парсинга сообщения:', e);
        }
      };

      socket.value.onclose = (event) => {
        isConnected.value = false;
        console.log('WebSocket отключен:', event.code, event.reason);
        
        // Автопереподключение
        setTimeout(() => {
          if (!isConnected.value) {
            connect(url);
          }
        }, 3000);
      };

      socket.value.onerror = (event) => {
        error.value = 'WebSocket ошибка';
        console.error('WebSocket ошибка:', event);
      };

    } catch (e) {
      error.value = 'Ошибка подключения';
      console.error('Ошибка подключения:', e);
    }
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.close();
      socket.value = null;
      isConnected.value = false;
    }
  };

  const send = (message: WebSocketMessage) => {
    if (socket.value && isConnected.value) {
      socket.value.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket не подключен');
      return false;
    }
  };

  const sendChatMessage = (message: string) => {
    return send({
      type: 'chat',
      message,
      timestamp: new Date().toISOString(),
    });
  };

  const sendPing = () => {
    return send({ type: 'ping' });
  };

  const sendTyping = (isTyping: boolean) => {
    return send({ type: 'typing', isTyping });
  };

  // Очистка при размонтировании компонента
  onUnmounted(() => {
    disconnect();
  });

  return {
    socket: readonly(socket),
    isConnected: readonly(isConnected),
    messages: readonly(messages),
    clientId: readonly(clientId),
    error: readonly(error),
    connect,
    disconnect,
    send,
    sendChatMessage,
    sendPing,
    sendTyping,
  };
}