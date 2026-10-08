import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {

  const token = signal<string | null>(null);
  const fakeAuth = { token, logout: vi.fn() };   // faux AuthService
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {

    token.set(null);
    TestBed.configureTestingModule({
      providers: [

        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: fakeAuth },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],

    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // Test 4 : avec un token, l'intercepteur ajoute le header Authorization: Bearer
  it('ajoute Authorization: Bearer quand un token existe', () => {
    token.set('faux-token');
    http.get('/api/tracks').subscribe();

    const req = controller.expectOne('/api/tracks');
    expect(req.request.headers.get('Authorization')).toBe('Bearer faux-token');
    req.flush({});
  });

  // Test 5 : sans token, aucun header Authorization n'est ajouté
  it("n'ajoute pas Authorization sans token", () => {

    http.get('/api/tracks').subscribe();

    const req = controller.expectOne('/api/tracks');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});

  });

  // Test 6 : sur un 401 avec token, on se déconnecte et on redirige vers /login
  it('déconnecte et redirige vers /login sur un 401 avec token', () => {
    token.set('token-invalide');
    const router = TestBed.inject(Router);
    http.get('/api/users/me').subscribe({ error: () => {} });

    controller.expectOne('/api/users/me').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(fakeAuth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);

  });
});