import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CreatePost } from './create-post';
import { PostsService } from '../../services/posts';
import { User, Post } from '../../services/posts';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CreatePost Component', () => {
  let component: CreatePost;
  let fixture: ComponentFixture<CreatePost>;
  let mockPostsService: jasmine.SpyObj<PostsService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockPostsService = jasmine.createSpyObj('PostsService', ['getUser', 'createPost']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule, // Добавляем HttpClientTestingModule
        FormsModule,
        CreatePost // Standalone компонент импортируем в imports
      ],
      providers: [
        { provide: PostsService, useValue: mockPostsService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePost);
    component = fixture.componentInstance;
    
    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue('123');
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load current user', fakeAsync(() => {
      const mockUser: User = {
        id: 123,
        fullName: 'Test User',
        email: 'test@example.com',
        photo: 'photo.jpg',
        isActive: true
      };
      
      mockPostsService.getUser.and.returnValue(of(mockUser));
      
      component.ngOnInit();
      tick();
      
      expect(mockPostsService.getUser).toHaveBeenCalledWith(123);
      expect(component.currentUser).toEqual(mockUser);
    }));

    it('should handle error when loading user', fakeAsync(() => {
      mockPostsService.getUser.and.returnValue(throwError(() => new Error('API Error')));
      
      component.ngOnInit();
      tick();
      
      expect(component.currentUser).toBeDefined(); // Should still have default user
    }));
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.currentUser = {
        id: 123,
        fullName: 'Test User',
        email: 'test@example.com',
      };
    });

    it('should show error for empty post content', () => {
      component.postContent = '';
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Пожалуйста, введите текст поста');
      expect(mockPostsService.createPost).not.toHaveBeenCalled();
    });

    it('should create post successfully', fakeAsync(() => {
      component.postContent = 'Test post content';
      const mockResponse: Post = { 
        id: 1, 
        senderId: 123,
        content: 'Test post content',
        timestamp: '',
        isPublic: true,
        isBlocked: false
      };
      
      mockPostsService.createPost.and.returnValue(of(mockResponse));
      
      component.onSubmit();
      
      expect(component.isSubmitting).toBeTrue();
      expect(mockPostsService.createPost).toHaveBeenCalledWith({
        content: 'Test post content',
        timestamp: jasmine.any(String),
        senderId: 123
      });
      
      tick(2000);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/feed']);
      expect(component.isSubmitting).toBeFalse();
    }));

    it('should handle post creation error', fakeAsync(() => {
      component.postContent = 'Test post content';
      
      mockPostsService.createPost.and.returnValue(throwError(() => new Error('API Error')));
      
      component.onSubmit();
      tick();
      
      expect(component.errorMessage).toBe('Ошибка при создании поста. Пожалуйста, попробуйте позже.');
      expect(component.isSubmitting).toBeFalse();
    }));
  });

  describe('getCharacterCount', () => {
    it('should return correct character count', () => {
      component.postContent = 'Hello World!';
      expect(component.getCharacterCount()).toBe(12);
    });
  });

  describe('shouldShowWarning', () => {
    it('should return false for short text', () => {
      component.postContent = 'a'.repeat(800);
      expect(component.shouldShowWarning()).toBeFalse();
    });

    it('should return true for long text', () => {
      component.postContent = 'a'.repeat(950);
      expect(component.shouldShowWarning()).toBeTrue();
    });
  });

  describe('cancel', () => {
    it('should navigate to feed', () => {
      component.cancel();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/feed']);
    });
  });
});