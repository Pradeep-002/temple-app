import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserSession {
  token: string;
  userId: string;
  name: string;
  mobileNumber: string;
  role: 'SUPER_ADMIN' | 'SANGAM_ADMIN' | 'COLLECTOR' | 'MEMBER';
  sangamId: string;
  sangamName: string;
  slogan?: string;
  memberCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';
  currentUser = signal<UserSession | null>(null);
  selectedSangamId = signal<string | null>(null);
  currentSlogan = signal<string>('🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️');

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('oor_nithi_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        this.currentUser.set(u);
        if (u.slogan) {
          this.currentSlogan.set(u.slogan);
        }
      } catch (e) {
        localStorage.removeItem('oor_nithi_user');
      }
    }
    const savedSlogan = localStorage.getItem('oor_nithi_slogan');
    if (savedSlogan) {
      this.currentSlogan.set(savedSlogan);
    }
    const savedSangam = localStorage.getItem('oor_nithi_selected_sangam_id');
    if (savedSangam) {
      this.selectedSangamId.set(savedSangam);
    }
  }

  setSlogan(slogan: string) {
    if (slogan && slogan.trim()) {
      this.currentSlogan.set(slogan.trim());
      localStorage.setItem('oor_nithi_slogan', slogan.trim());
    }
  }

  updateSangamInfo(name: string, slogan: string) {
    const user = this.currentUser();
    if (user) {
      const updated: UserSession = { ...user, sangamName: name, slogan };
      this.saveSession(updated);
    }
    this.setSlogan(slogan);
  }

  setSelectedSangamId(sangamId: string | null) {
    this.selectedSangamId.set(sangamId);
    if (sangamId) {
      localStorage.setItem('oor_nithi_selected_sangam_id', sangamId);
    } else {
      localStorage.removeItem('oor_nithi_selected_sangam_id');
    }
  }

  saveSession(session: UserSession) {
    this.currentUser.set(session);
    localStorage.setItem('oor_nithi_user', JSON.stringify(session));
    if (session.slogan) {
      this.setSlogan(session.slogan);
    }
    if (session.sangamId) {
      this.setSelectedSangamId(session.sangamId);
    }
  }

  logout() {
    this.currentUser.set(null);
    this.selectedSangamId.set(null);
    this.currentSlogan.set('🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️');
    localStorage.removeItem('oor_nithi_user');
    localStorage.removeItem('oor_nithi_slogan');
    localStorage.removeItem('oor_nithi_selected_sangam_id');
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const user = this.currentUser();
    if (user && user.token) {
      headers = headers.set('Authorization', `Bearer ${user.token}`);
    }
    const activeSangamId = this.selectedSangamId() || user?.sangamId;
    if (activeSangamId) {
      headers = headers.set('X-Sangam-ID', activeSangamId);
    }
    return headers;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, { headers: this.getHeaders() });
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, { headers: this.getHeaders() });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() });
  }
}

