import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Post {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  isPublic: boolean;
  isBlocked: boolean;
}

export interface CreatePostRequest {
  senderId: number;
  timestamp: String;
  content: string;
  receiverId?: number | null;
  isPublic?: boolean;
}

export interface UpdatePostRequest {
  content?: string;
  isPublic?: boolean;
  isBlocked?: boolean;
}
export interface PostsResponse {
  posts: Post[];
  total?: number;
  page?: number;
  limit?: number;
}
export interface User {
  id: number;
  fullName: string;
  email: string;
  photo?: string;
  isActive: boolean;
}
export interface PostResponse {
  post: Post;
}
export interface UserResponse {
  success: boolean;
  user: User;
}
@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private readonly API_BASE = 'https://localhost:3000/api';
  private readonly POSTS_API = `${this.API_BASE}/news`;
  private readonly USERS_API = `${this.API_BASE}/users`;

  constructor(private http: HttpClient) {}

  getPosts(userID: number, page: number = 1, limit: number = 20): Observable<PostsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PostsResponse>(`${this.POSTS_API}/${userID}/feed`, {params})
      .pipe(catchError(this.handleError));
  }

  getPostById(postId: number): Observable<Post> {
    return this.http.get<PostResponse>(`${this.POSTS_API}/${postId}`)
      .pipe(
        map(response => response.post),
        catchError(this.handleError)
      );
  }

  getUserPosts(userId: number, page: number = 1, limit: number = 10): Observable<PostsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
      
    return this.http.get<PostsResponse>(`${this.POSTS_API}/${userId}/feed`, { params })
      .pipe(catchError(this.handleError));
  }

  getFeedPosts(page: number = 1, limit: number = 20): Observable<PostsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PostsResponse>(`${this.POSTS_API}/feed`, { params })
      .pipe(catchError(this.handleError));
  }
  getUserFriends(userId: number): Observable<{friends:User[], total: number}> {
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', '10');

    return this.http.get<{friends:User[], total: number}>(`${this.API_BASE}/friends/${userId}`, { params })
      .pipe(catchError(this.handleError));
  }
  createPost(postData: CreatePostRequest): Observable<Post> {
    return this.http.post<Post>(this.POSTS_API, postData)
      .pipe(catchError(this.handleError));
  }

  deletePost(postId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.POSTS_API}/${postId}`)
      .pipe(catchError(this.handleError));
  }

  blockPost(postId: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.POSTS_API}/${postId}/block`, {})
      .pipe(catchError(this.handleError));
  }

  unblockPost(postId: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.POSTS_API}/${postId}/unblock`, {})
      .pipe(catchError(this.handleError));
  }

  getPublicPosts(page: number = 1, limit: number = 20): Observable<PostsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PostsResponse>(`${this.POSTS_API}/public`, { params })
      .pipe(catchError(this.handleError));
  }
getUser(userId: number): Observable<User> {
  return this.http.get<User>(`${this.USERS_API}/${userId}`)
    .pipe(
      catchError(this.handleError)
    );
}
getUsers(): Observable<User[]> {
  return this.http.get<User[]>(`${this.USERS_API}`)
    .pipe(
      catchError(this.handleError)
    );
}
getPhoto(userID: number){
  return `/home/sepesch/ground/educ/web/lab3,4/user/src/photos/user${userID}.jpg`;
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