import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { filter, catchError, map } from 'rxjs/operators';

export interface User {
  id: number;
  fullName: string;
  email: string;
  photo?: string;
}

export interface Message {
  id: number;
  text: string;
  type: 'sent' | 'received';
  timestamp: Date;
  senderId: number,
  receiverId: number;
  read: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_BASE = `https://localhost:3000/api`;
  private readonly USERS_API = `${this.API_BASE}/users`;
  private readonly CHAT_API = `${this.API_BASE}/chat`;
  
  private messageSubject = new BehaviorSubject<Message | null>(null);
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private socket: WebSocket | null = null;
  private pendingMessages: Set<number> = new Set(); // Для отслеживания временных сообщений

  constructor(private http: HttpClient) {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    try {
      this.socket = new WebSocket('wss://localhost:3000');
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.connectionStatus.next(true);
        this.reconnectAttempts = 0;
        this.sendUserConnect();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          if (data.type === 'new_message') {
            // Это новое сообщение от другого пользователя
            const message: Message = {
              id: data.data.id,
              text: data.data.text,
              type: 'received',
              timestamp: new Date(data.data.timestamp),
              senderId: data.data.senderId || data.data.userId,
              receiverId: data.data.recipientId || data.data.receiverId,
              read: data.data.read || false
            };
            this.messageSubject.next(message);
            
          } else if (data.type === 'message_sent') {
            // Это подтверждение отправки нашего сообщения
            const tempId = this.findPendingMessageId(data.data.text, data.data.timestamp);
            
            const message: Message = {
              id: data.data.id, // Используем ID от сервера
              text: data.data.text,
              type: 'sent',
              timestamp: new Date(data.data.timestamp),
              senderId: this.getCurrentUserId() || 0,
              receiverId: data.data.recipientId || data.data.userId,
              read: true
            };
            
            // Удаляем из временных сообщений
            if (tempId) {
              this.pendingMessages.delete(tempId);
            }
            
            this.messageSubject.next(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStatus.next(false);
        this.handleReconnection();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  // Поиск ID временного сообщения по тексту и времени
  private findPendingMessageId(text: string, timestamp: string): number | null {
    for (const id of this.pendingMessages) {
      // Временные ID основаны на Date.now(), можем использовать для поиска
      if (Math.abs(id - new Date(timestamp).getTime()) < 1000) {
        return id;
      }
    }
    return null;
  }

  sendMessage(receiver_id: number, text: string, sender_id: number): number {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      throw new Error('WebSocket is not connected');
    }

    const messageData = {
      type: 'send_message',
      data: {
        recipientId: receiver_id,
        senderId: sender_id,
        text: text,
        timestamp: new Date().toISOString()
      }
    };

    try {
      this.socket.send(JSON.stringify(messageData));
      console.log('Message sent via WebSocket:', messageData);
      
      // Создаем временный ID и добавляем в отслеживаемые
      const tempId = Date.now();
      this.pendingMessages.add(tempId);
      
      return tempId;
      
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Метод для проверки, является ли сообщение временным
  isPendingMessage(id: number): boolean {
    return this.pendingMessages.has(id);
  }

  private sendUserConnect(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected, cannot send user_connect');
      return;
    }

    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      console.error('No user ID found, cannot send user_connect');
      return;
    }

    const connectMessage = {
      type: 'user_connect',
      userId: currentUserId
    };

    try {
      this.socket.send(JSON.stringify(connectMessage));
      console.log('User connect message sent:', connectMessage);
    } catch (error) {
      console.error('Error sending user connect message:', error);
    }
  }

  // Публичный метод для принудительного переподключения
  reconnectUser(): void {
    if (this.socket) {
      this.socket.close();
    }
    this.initializeWebSocket();
  }

  private getCurrentUserId(): number | null {
    const userId = localStorage.getItem('id');
    return userId ? parseInt(userId, 10) : null;
  }

  // Observable для подписки на новые сообщения
  getMessageObservable(): Observable<Message | null> {
    return this.messageSubject.asObservable();
  }

  // Observable для подписки на статус соединения
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  // Остальные методы остаются без изменений...
  private createHeaders(): HttpHeaders {
    const token = localStorage.getItem('id');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, 3000 * this.reconnectAttempts);
    }
  }

  getUser(userId: number): Observable<User> {
    return this.http.get<User>(`${this.USERS_API}/${userId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.USERS_API}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getMessages(targetUserId: number): Observable<Message[]> {
    const currentUserId = localStorage.getItem('id');
    const headers = this.createHeaders();
    
    return this.http.get<ApiResponse<Message[]>>(`${this.CHAT_API}/messages/${targetUserId}/${currentUserId}`, { headers}).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to load messages');
        }
        
        return response.data.map(message => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }));
      }),
      catchError(error => {
        console.error('Error loading messages:', error);
        throw error;
      })
    );
  }

  markAsRead(userId: number, messageIds: number[]): Observable<void> {
    const headers = this.createHeaders();
    const payload = { messageIds };

    return this.http.post<ApiResponse<void>>(`${this.CHAT_API}/messages/mark-read/${userId}`, payload, { headers }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to mark messages as read');
        }
        return void 0;
      }),
      catchError(error => {
        console.error('Error marking messages as read:', error);
        throw error;
      })
    );
  }

  clearChat(userId: number): Observable<void> {
    const headers = this.createHeaders();
    return this.http.delete<ApiResponse<void>>(`${this.CHAT_API}/messages/${userId}`, { headers }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to clear chat');
        }
        return void 0;
      }),
      catchError(error => {
        console.error('Error clearing chat:', error);
        throw error;
      })
    );
  }

  getUserAvatar(userID: number): string {
    return `assets/photos/user${userID}.jpg`;
  }

  getUnreadCounts(): Observable<{ [userId: number]: number }> {
    const headers = this.createHeaders();
    return this.http.get<ApiResponse<{ [userId: number]: number }>>(`${this.CHAT_API}/messages/unread-counts`, { headers }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to load unread counts');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error loading unread counts:', error);
        return of({});
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Произошла ошибка';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Ошибка: ${error.error.message}`;
    } else {
      errorMessage = `Ошибка ${error.status}: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage += ` - ${error.error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}