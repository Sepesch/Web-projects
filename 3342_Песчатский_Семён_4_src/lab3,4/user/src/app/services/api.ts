import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  fullName: string;
  email: string;
  password: string;
  birthDate: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Api {
  private apiUrl = 'https://localhost:3000/api'; // URL вашего Express сервера

  constructor(private http: HttpClient) {}

  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, user);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/users`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/users/${id}`);
  }
}