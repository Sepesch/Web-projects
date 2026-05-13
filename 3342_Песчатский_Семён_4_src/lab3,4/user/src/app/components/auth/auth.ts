import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, LoginData } from '../../services/auth';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  loginData: LoginForm = {
    email: '',
    password: '',
    remember: false
  };

  isLoading: boolean = false;
  showPassword: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  socialLogin(provider: string): void {
    this.showSuccess(`Вход через ${provider} в разработке`);
    console.log(`Social login attempt with: ${provider}`);
  }

  goToRegister(): void {
    this.router.navigate(['/reg']);
  }

  onSubmit(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.showError('Пожалуйста, заполните все поля');
      return;
    }

    if (!this.isValidEmail(this.loginData.email)) {
      this.showError('Пожалуйста, введите корректный email');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData as LoginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success && response.user) {
          this.showSuccess(response.message);
          
          this.handleRememberMe(response.user);
          
          this.router.navigate(['/feed']);
        } else {
          this.showError('Ошибка авторизации');
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        
        if (error.status === 401) {
          this.showError('Неверный email или пароль');
        } else if (error.status === 400) {
          this.showError('Некорректные данные для входа');
        } else if (error.status === 0) {
          this.showError('Ошибка соединения с сервером. Проверьте подключение.');
        } else {
          this.showError(error.error?.message || 'Ошибка сервера. Попробуйте позже.');
        }
        
        console.error('Login error:', error);
      }
    });
  }

  private handleRememberMe(user: any): void {
    if (this.loginData.remember) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.removeItem('currentUser');
    }
  }

  ngOnInit(): void {
    this.authService.logout();
  }
  fillTestCredentials(): void {
    this.loginData.email = 'test@example.com';
    this.loginData.password = 'password123';
  }

  clearForm(): void {
    this.loginData = {
      email: '',
      password: '',
      remember: false
    };
    this.errorMessage = '';
    this.successMessage = '';
  }
}