import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostsService } from '../../services/posts';
import { Observable, forkJoin, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  fullName: string;
  email: string;
  photo?: string;
}
@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.html',
  styleUrls: ['./create-post.css'],
  imports: [CommonModule, FormsModule]
})
export class CreatePost implements OnInit {
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  
  postContent: string = '';
  selectedImage: File | null = null;
  selectedImagePreview: string | null = null;
  isPublic: boolean = true;
  
  showImageUpload: boolean = false;
  showEmojiPicker: boolean = false;
  
  errorMessage: string = '';
  
  currentUser: User = {
    id: 1,
    fullName: 'Иван Иванов',
    email: 'ivan@example.com'
  };

  constructor(
    private router: Router,
    private postsService: PostsService
  ) {}

  ngOnInit(): void {
    const id = localStorage.getItem('id');
    this.loadCurrentUser(Number(id));
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
  getUserAvatar(userID: number): string {
    return `assets/photos/user${userID}.jpg`;
  }
  cancel(){
    this.router.navigate(['/feed']);
  }
  
  onSubmit(): void {
    if (!this.postContent.trim()) {
      this.errorMessage = 'Пожалуйста, введите текст поста';
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';

    const newPost = {
      content: this.postContent.trim(),
      timestamp: new Date().toISOString(),
      senderId: this.currentUser.id
    };
    console.log('Создание поста:', newPost);
    this.postsService.createPost(newPost).pipe(
      catchError(error => {
        console.error('Ошибка при создании поста:', error);
        this.errorMessage = 'Ошибка при создании поста. Пожалуйста, попробуйте позже.';
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response) {
          console.log('Пост успешно создан:', response);
            setTimeout(() => {
              this.router.navigate(['/feed']);
            }, 2000);
        }
      }
    });
    setTimeout(() => {
      this.isSubmitting = false;
      this.router.navigate(['/feed']);
    }, 2000);
  }

  logout(): void {
    console.log('Выход из системы');
    this.router.navigate(['/auth']);
  }

  // Получение количества символов
  getCharacterCount(): number {
    return this.postContent.length;
  }

  // Проверка, нужно ли показать предупреждение о длине текста
  shouldShowWarning(): boolean {
    return this.postContent.length > 900;
  }
}