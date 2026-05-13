import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { PostsService } from '../../services/posts';
import { Observable, forkJoin, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

interface User {
  id: number;
  fullName: string;
  email: string;
  photo?: string;
}

interface Post {
  id: number;
  senderId: number;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
}

@Component({
  selector: 'app-feed',
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
  imports: [DatePipe, CommonModule]
})
export class Feed implements OnInit {
  isLoading: boolean = true;
  errorMessage: string = '';

  currentUser: User | null = null;
  allUsers: User[] = [];
  allPosts: Post[] = [];
  friends: User[] = [];
  recommendations: User[] = [];

  currentFilter: string = 'all';

  constructor(
    private postsService: PostsService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    
    const id = localStorage.getItem('id');
    if (!id) {
      this.router.navigate(['/auth']);
      return;
    }
    console.log(id);

    forkJoin({
      user: this.loadCurrentUser(Number(id)),
      posts: this.loadAllPosts(Number(id)),
      friends: this.loadFriends(Number(id)),
      allUsers: this.loadAllUsers()
    }).pipe(
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

private loadCurrentUser(userID: number): Observable<void> {
  return this.postsService.getUser(userID).pipe(
    map(user => {
      if (!user) {
        throw new Error('User not found');
      }
      
      this.currentUser = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        photo: user.photo,
      };
      return void 0;
    }),
    catchError(error => {
      console.error('Error loading user:', error);
      return of(void 0);
    })
  );
}

private loadAllPosts(userID: number): Observable<void> {
  return this.postsService.getPosts(userID).pipe(
    tap(response => {
      console.log('Posts API response:', response);
      
      if (response && Array.isArray(response)) {
        this.allPosts = response.map(post => ({
          ...post,
          timestamp: new Date(post.timestamp)
        }));
      }
      else {
        console.warn('Unexpected posts response format:', response);
        this.allPosts = []; // устанавливаем пустой массив вместо ошибки
      }
    }),
    map(() => void 0),
    catchError(error => {
      console.error('Error loading posts:', error);
      this.allPosts = []; // устанавливаем пустой массив при ошибке
      return of(void 0);
    })
  );
}

  private loadFriends(userID: number): Observable<void> {
    const headers = this.createHeaders();
    return this.postsService.getUserFriends(userID).pipe(
      tap(response => {
        if (response.friends) {
          this.friends = response.friends;
        } else {
          throw new Error('Failed to load friends');
        }
      }),
      map(() => void 0)
    );
  }

  private createHeaders(): HttpHeaders {
    const token = localStorage.getItem('id');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private processLoadedData(): void {
    this.loadAllUsers();
  }

  private loadAllUsers(): Observable<void> {
    const headers = this.createHeaders();
    return this.postsService.getUsers().pipe(
      tap(response => {
        if (response) {
          this.allUsers = response;
        } else {
          throw new Error('Failed to load users');
        }
      }),
      map(() => void 0)
    );
  }

  getUserAvatar(userID: number): string {
    return `assets/photos/user${userID}.jpg`;
  }

  getUserName(userId: number): string {
    const user = this.allUsers.find(u => u.id === userId);
    return user?.fullName || 'Неизвестный пользователь';
  }

  getFriendsCount(): number {
    return this.friends.length;
  }

  getPostsCount(): number {
    return this.allPosts.filter(post => post.senderId === this.currentUser?.id).length;
  }
  getRandomCommonFriends(): number {
    return Math.floor(Math.random() * 20) + 1;
  }
  // filterFeed(filterType: string): void {
  //   this.currentFilter = filterType;
    
  //   const headers = this.createHeaders();

  //   let apiUrl = '/api/posts/feed';
    
  //   switch (filterType) {
  //     case 'friends':
  //       apiUrl = '/api/posts/friends';
  //       break;
  //     case 'popular':
  //       apiUrl = '/api/posts/popular';
  //       break;
  //     default:
  //       apiUrl = '/api/posts/feed';
  //   }

  //   this.http.get<ApiResponse<Post[]>>(apiUrl, { headers })
  //     .pipe(
  //       catchError(error => {
  //         console.error('Error filtering posts:', error);
  //         this.errorMessage = 'Ошибка при фильтрации постов';
  //         return of({ success: false, data: [] } as ApiResponse<Post[]>);
  //       })
  //     )
  //     .subscribe({
  //       next: (response) => {
  //         if (response.success && response.data) {
  //           this.allPosts = response.data.map(post => ({
  //             ...post,
  //             timestamp: new Date(post.timestamp)
  //           }));
  //         }
  //       }
  //     });
  // }


  createPost(): void {
    this.router.navigate(['/create-post']);
  }
  navigateToChat(): void {
    this.router.navigate(['/chat']);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('id');
    
    this.router.navigate(['/auth']);
  }
}
