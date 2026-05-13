import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Feed } from './feed';
import { PostsService } from '../../services/posts';

describe('Feed Component', () => {
  let component: Feed;
  let fixture: ComponentFixture<Feed>;
  let mockPostsService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockPostsService = {
      getUser: jasmine.createSpy('getUser').and.returnValue(of({ 
        id: 1, 
        fullName: 'Test User', 
        email: 'test@test.com',
        isActive: true 
      })),
      getPosts: jasmine.createSpy('getPosts').and.returnValue(of({ posts: [] })),
      getUserFriends: jasmine.createSpy('getUserFriends').and.returnValue(of({ 
        friends: [], 
        total: 0 
      })),
      getUsers: jasmine.createSpy('getUsers').and.returnValue(of([]))
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    spyOn(localStorage, 'getItem').and.returnValue('1');

    await TestBed.configureTestingModule({
      imports: [Feed],
      providers: [
        { provide: PostsService, useValue: mockPostsService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Feed);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get user name by id', () => {
    component.allUsers = [
      { id: 1, fullName: 'John Doe', email: 'john@test.com'},
      { id: 2, fullName: 'Jane Smith', email: 'jane@test.com'}
    ];
    
    expect(component.getUserName(1)).toBe('John Doe');
    expect(component.getUserName(999)).toBe('Неизвестный пользователь');
  });

  it('should navigate to create post', () => {
    component.createPost();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/create-post']);
  });
});