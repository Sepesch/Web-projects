import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { ChatService } from '../../services/chat';
import { Subscription, forkJoin, Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';

interface User {
  id: number;
  fullName: string;
  email: string;
  photo?: string;
}

interface Message {
  id: number;
  text: string;
  type: 'sent' | 'received';
  timestamp: Date;
  senderId: number,
  receiverId: number;
  read: boolean;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrls: ['./chat.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class Chat implements OnInit, OnDestroy {

  currentUser: User = {} as User; 
  allUsers: User[] = [];
  messages: { [userId: number]: Message[] } = {};
  selectedUser: User | null = null;
  searchTerm: string = '';
  filteredUsers: User[] = [];
  newMessage: string = '';
  maxMessageLength: number = 2000;
  isLoading: boolean = true;
  errorMessage: string = '';
  isWebSocketConnected: boolean = false;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private subscriptions: Subscription = new Subscription();
  private pendingMessageIds: Map<number, number> = new Map(); // tempId -> index в массиве

  constructor(
    private router: Router,
    private chatService: ChatService,
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupRealTimeUpdates();
  }

  private loadInitialData(): void {
    const id = localStorage.getItem('id');
    if (!id) {
      this.router.navigate(['/auth']);
      return;
    }

    forkJoin({
      user: this.loadCurrentUser(Number(id)),
      allUsers: this.loadAllUsers(),
    }).pipe(
      switchMap(result => {
        return this.loadLastMessagesForAllUsers().pipe(
          map(() => result)
        );
      }),
      catchError(error => {
        console.error('Error loading initial data:', error);
        this.errorMessage = 'Ошибка при загрузке данных. Пожалуйста, попробуйте позже.';
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.processLoadedData();
        this.isLoading = false;
      }
    });
  }

  private setupRealTimeUpdates(): void {
    const messageSub = this.chatService.getMessageObservable().subscribe({
      next: (message) => {
        if (message) {
          this.handleNewMessage(message);
        }
      },
      error: (error) => {
        console.error('Error in real-time message subscription:', error);
      }
    });

    const connectionSub = this.chatService.getConnectionStatus().subscribe({
      next: (connected) => {
        this.isWebSocketConnected = connected;
        console.log('WebSocket connection status:', connected);
        if (connected) {
          this.loadUnreadMessages();
        }
      },
      error: (error) => {
        console.error('Error in connection status subscription:', error);
      }
    });

    this.subscriptions.add(messageSub);
    this.subscriptions.add(connectionSub);
  }

  private handleNewMessage(message: Message): void {
    console.log('New real-time message received:', message);
    
    const conversationUserId = message.type === 'received' ? message.senderId : message.receiverId;
    
    if (!this.messages[conversationUserId]) {
      this.messages[conversationUserId] = [];
    }

    if (message.type === 'sent') {
      this.handleSentMessageConfirmation(message, conversationUserId);
    } else {
      this.handleReceivedMessage(message, conversationUserId);
    }
  }

  private handleSentMessageConfirmation(message: Message, conversationUserId: number): void {
    const tempMessageIndex = this.findPendingMessageIndex(message.text, message.timestamp, conversationUserId);
    
    if (tempMessageIndex !== -1) {
      this.messages[conversationUserId][tempMessageIndex] = message;
      console.log('Temporary message replaced with confirmed message');
    } else {
      this.messages[conversationUserId].push(message);
      this.sortMessages(conversationUserId);
    }

    this.updateUserList();
    
    if (this.selectedUser && this.selectedUser.id === conversationUserId) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  private handleReceivedMessage(message: Message, conversationUserId: number): void {
    const messageExists = this.messages[conversationUserId].some(
      msg => msg.id === message.id || (msg.timestamp.getTime() === message.timestamp.getTime() && msg.text === message.text)
    );

    if (!messageExists) {
      this.messages[conversationUserId].push(message);
      this.sortMessages(conversationUserId);

      // Если это активный чат, помечаем сообщения как прочитанные и скроллим вниз
      if (this.selectedUser && this.selectedUser.id === conversationUserId) {
        this.markMessagesAsRead(conversationUserId);
        setTimeout(() => this.scrollToBottom(), 100);
      }

      this.updateUserList();
    }
  }

  private findPendingMessageIndex(text: string, timestamp: Date, conversationUserId: number): number {
    if (!this.messages[conversationUserId]) return -1;
    
    return this.messages[conversationUserId].findIndex(msg => 
      msg.text === text && 
      Math.abs(msg.timestamp.getTime() - timestamp.getTime()) < 2000 && // В пределах 2 секунд
      msg.type === 'sent' &&
      this.chatService.isPendingMessage(msg.id) // Проверяем, что это временное сообщение
    );
  }

  private sortMessages(userId: number): void {
    this.messages[userId].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  sendMessage(): void {
    if (!this.selectedUser || !this.currentUser || !this.newMessage.trim() || this.newMessage.length > this.maxMessageLength) {
      return;
    }

    const messageText = this.newMessage.trim();
    
    // Создаем временное сообщение
    const tempMessage: Message = {
      id: Date.now(), // временный ID
      text: messageText,
      type: 'sent',
      timestamp: new Date(),
      senderId: this.currentUser.id,
      receiverId: this.selectedUser.id,
      read: true
    };

    if (!this.messages[this.selectedUser.id]) {
      this.messages[this.selectedUser.id] = [];
    }

    // Добавляем временное сообщение
    this.messages[this.selectedUser.id].push(tempMessage);
    this.newMessage = '';
    this.scrollToBottom();

    try {
      // Отправляем сообщение и получаем временный ID
      const tempId = this.chatService.sendMessage(this.selectedUser.id, messageText, this.currentUser.id);
      
      // Сохраняем связь временного ID с индексом сообщения
      const messageIndex = this.messages[this.selectedUser.id].length - 1;
      this.pendingMessageIds.set(tempId, messageIndex);
      
    } catch (error) {
      console.error('Ошибка отправки сообщения через WebSocket:', error);
      this.errorMessage = 'Не удалось отправить сообщение';

      // Удаляем временное сообщение при ошибке
      const index = this.messages[this.selectedUser.id].findIndex(m => m.id === tempMessage.id);
      if (index !== -1) {
        this.messages[this.selectedUser.id].splice(index, 1);
      }
    }
  }

  // Остальные методы остаются без изменений...
  private loadUnreadMessages(): void {
    this.allUsers.forEach(user => {
      const unreadCount = this.getUnreadCount(user.id);
      if (unreadCount > 0) {
        this.loadMessages(user.id);
      }
    });
  }

  private updateUserList(): void {
    this.filterUsers();
  }

  private loadCurrentUser(userID: number): Observable<void> {
    return this.chatService.getUser(userID).pipe(
      map(user => {
        if (!user) {
          throw new Error('User not found');
        }
        this.currentUser = user;
        return void 0;
      }),
      catchError(error => {
        console.error('Error loading user:', error);
        return of(void 0);
      })
    );
  }

  private loadAllUsers(): Observable<void> {
    return this.chatService.getAllUsers().pipe(
      tap(users => {
        if (users) {
          this.allUsers = users.filter(user => user.id !== this.currentUser.id);
          this.filteredUsers = [...this.allUsers];
        } else {
          throw new Error('Failed to load users');
        }
      }),
      map(() => void 0),
      catchError(error => {
        console.error('Error loading users:', error);
        this.allUsers = [];
        this.filteredUsers = [];
        return of(void 0);
      })
    );
  }

  private loadLastMessagesForAllUsers(): Observable<void> {
    const messageRequests = this.allUsers.map(user => 
      this.chatService.getMessages(user.id).pipe(
        tap(messages => {
          this.messages[user.id] = messages;
        }),
        catchError(error => {
          console.error(`Error loading messages for user ${user.id}:`, error);
          this.messages[user.id] = [];
          return of([]);
        })
      )
    );

    return messageRequests.length > 0 ? forkJoin(messageRequests).pipe(map(() => void 0)) : of(void 0);
  }

  private processLoadedData(): void {
    this.filterUsers();
  }

  private createHeaders(): HttpHeaders {
    const token = localStorage.getItem('id');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.allUsers];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.allUsers.filter(user =>
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    if (this.messages[user.id]) {
      this.markMessagesAsRead(user.id);
      setTimeout(() => this.scrollToBottom(), 100);
    } else {
      this.loadMessages(user.id);
    }
  }

  private loadMessages(userId: number): void {
    const sub = this.chatService.getMessages(userId).subscribe({
      next: (messages) => {
        this.messages[userId] = messages;
        this.markMessagesAsRead(userId);
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Ошибка загрузки сообщений:', error);
        this.errorMessage = 'Не удалось загрузить историю сообщений';
      }
    });
    this.subscriptions.add(sub);
  }

  getMessages(userId: number): Message[] {
    return this.messages[userId] || [];
  }

  getLastMessage(userId: number): Message | null {
    const userMessages = this.messages[userId];
    return userMessages && userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
  }

  getUnreadCount(userId: number): number {
    const userMessages = this.messages[userId];
    if (!userMessages) return 0;
    return userMessages.filter(msg => msg.type === 'received' && !msg.read).length;
  }

  onMessageInput(): void {
    const textarea = document.querySelector('.message-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      setTimeout(() => {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }, 100);
    }
  }

  private markMessagesAsRead(userId: number): void {
    const userMessages = this.messages[userId];
    if (userMessages) {
      const unreadMessages = userMessages.filter(msg => msg.type === 'received' && !msg.read);
      if (unreadMessages.length > 0) {
        const sub = this.chatService.markAsRead(userId, unreadMessages.map(m => m.id)).subscribe({
          next: () => {
            unreadMessages.forEach(msg => msg.read = true);
          },
          error: (error) => {
            console.error('Ошибка отметки сообщений как прочитанных:', error);
          }
        });
        this.subscriptions.add(sub);
      }
    }
  }

  getUserAvatar(userID: number): string {
    return this.chatService.getUserAvatar(userID);
  }

  clearChat(user: User): void {
    if (confirm(`Очистить историю переписки с ${user.fullName}?`)) {
      const sub = this.chatService.clearChat(user.id).subscribe({
        next: () => {
          this.messages[user.id] = [];
        },
        error: (error) => {
          console.error('Ошибка очистки чата:', error);
          this.errorMessage = 'Не удалось очистить историю переписки';
        }
      });
      this.subscriptions.add(sub);
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('id');
    this.router.navigate(['/auth']);
  }

  reconnectWebSocket(): void {
    this.chatService.reconnectUser();
  }

  getConnectionStatus(): string {
    return this.isWebSocketConnected ? 'Connected' : 'Disconnected';
  }
}