import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Chat } from './chat';
import { ChatService } from '../../services/chat';

describe('Chat Component', () => {
  let component: Chat;
  let fixture: ComponentFixture<Chat>;
  let mockChatService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockChatService = {
      getUser: jasmine.createSpy('getUser').and.returnValue(of({ 
        id: 1, 
        fullName: 'Test User', 
        email: 'test@test.com',
        isActive: true 
      })),
      getAllUsers: jasmine.createSpy('getAllUsers').and.returnValue(of([])),
      getMessages: jasmine.createSpy('getMessages').and.returnValue(of([])),
      getMessageObservable: jasmine.createSpy('getMessageObservable').and.returnValue(of(null)),
      getConnectionStatus: jasmine.createSpy('getConnectionStatus').and.returnValue(of(true)),
      sendMessage: jasmine.createSpy('sendMessage').and.returnValue(123),
      markAsRead: jasmine.createSpy('markAsRead').and.returnValue(of({})),
      clearChat: jasmine.createSpy('clearChat').and.returnValue(of({})),
      getUserAvatar: jasmine.createSpy('getUserAvatar').and.returnValue('avatar.jpg'),
      isPendingMessage: jasmine.createSpy('isPendingMessage').and.returnValue(false)
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    // Mock localStorage перед созданием компонента
    spyOn(localStorage, 'getItem').and.returnValue('1');

    await TestBed.configureTestingModule({
      imports: [FormsModule, Chat],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter users', () => {
    component.allUsers = [
      { id: 1, fullName: 'John Doe', email: 'john@test.com' },
      { id: 2, fullName: 'Jane Smith', email: 'jane@test.com'}
    ];
    
    component.searchTerm = 'john';
    component.filterUsers();
    
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].fullName).toBe('John Doe');
  });

  it('should get last message', () => {
    const userId = 1;
    component['messages'][userId] = [
      { 
        id: 1, 
        text: 'Hello', 
        type: 'received' as const, 
        timestamp: new Date(), 
        senderId: 2, 
        receiverId: 1, 
        read: false 
      },
      { 
        id: 2, 
        text: 'Hi', 
        type: 'sent' as const, 
        timestamp: new Date(), 
        senderId: 1, 
        receiverId: 2, 
        read: true 
      }
    ];
    
    const lastMessage = component.getLastMessage(userId);
    expect(lastMessage?.text).toBe('Hi');
  });
});