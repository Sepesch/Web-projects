import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Api, User } from '../../services/api';

@Component({
  selector: 'app-reg',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reg.html',
  styleUrl: './reg.css'
})
export class Reg {
  registerData = {
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
  };

  isLoading: boolean = false;
  showPassword: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private userService: Api // Инжектируем сервис
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.showError('Пароли не совпадают');
      this.isLoading = false;
      return;
    }

    const birthDate = new Date(this.registerData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13) {
      this.showError('Для регистрации вам должно быть не менее 13 лет');
      this.isLoading = false;
      return;
    }

    const userData: User = {
      fullName: this.registerData.fullName,
      email: this.registerData.email,
      password: this.registerData.password,
      birthDate: this.registerData.birthDate,
    };

    this.userService.register(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showSuccess('Регистрация прошла успешно!');
        
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        
        setTimeout(() => {
          this.router.navigate(['/auth']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error.error?.message || 'Ошибка регистрации. Попробуйте позже.');
      }
    });
  }

  private isFormValid(): boolean {
    if (!this.registerData.fullName) {
      this.showError('Пожалуйста, введите имя и фамилию');
      return false;
    }

    if (!this.registerData.email) {
      this.showError('Пожалуйста, введите email');
      return false;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.showError('Пожалуйста, введите корректный email');
      return false;
    }
    if (this.registerData.password.length < 6) {
      this.showError('Пароль должен содержать минимум 6 символов');
      return false;
    }

    if (!this.registerData.birthDate) {
      this.showError('Пожалуйста, укажите дату рождения');
      return false;
    }
    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }
}