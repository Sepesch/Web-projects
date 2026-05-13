import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Auth } from './auth';
import { AuthService } from '../../services/auth';

describe('Auth Component', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      login: jasmine.createSpy('login').and.returnValue(of({ 
        success: true, 
        user: { id: 1, email: 'test@test.com' },
        message: 'Success'
      })),
      logout: jasmine.createSpy('logout')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule, Auth],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
  });

  it('should validate email correctly', () => {
    expect(component['isValidEmail']('test@example.com')).toBeTrue();
    expect(component['isValidEmail']('invalid-email')).toBeFalse();
  });

  it('should fill test credentials', () => {
    component.fillTestCredentials();
    expect(component.loginData.email).toBe('test@example.com');
    expect(component.loginData.password).toBe('password123');
  });
});