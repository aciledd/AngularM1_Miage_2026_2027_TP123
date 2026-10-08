import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TrackService } from './track.service';

describe('TrackService', () => {
  let service: TrackService;
  let http: HttpTestingController;

  beforeEach(() => {

    TestBed.configureTestingModule({

      providers: [provideHttpClient(), provideHttpClientTesting()],  //faux réseau
    });

    service = TestBed.inject(TrackService);
    http = TestBed.inject(HttpTestingController);

  });

  afterEach(() => http.verify());  //aucune requête ne doit rester sans réponse

  // Test 1 : list() envoie bien GET /api/tracks avec les paramètres page et limits
  it('list() envoie GET /api/tracks avec page et limit', () => {
    let result: any;
    service.list(2, 5).subscribe((page) => (result = page));

    const req = http.expectOne((r) => r.url === '/api/tracks');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('5');

    req.flush({ items: [], page: 2, limit: 5, total: 6, pages: 2 });  //fausse réponse
    expect(result.page).toBe(2);

  });

  // Test 2 : delete() envoie bien DELETE /api/tracks/:id
  it('delete() envoie DELETE /api/tracks/:id', () => {
    service.delete('abc123').subscribe();

    const req = http.expectOne('/api/tracks/abc123');
    expect(req.request.method).toBe('DELETE');

    req.flush(null, { status: 204, statusText: 'No Content' });
  });

   // Test 3 : uploadWithProgress() envoie un POST multipart avec les champs audio et title
  it('uploadWithProgress() envoie un POST multipart avec audio et title', () => {
    const file = new File(['contenu'], 'song.mp3', { type: 'audio/mpeg' });
    service.uploadWithProgress(file, 'Mon titre').subscribe();

    const req = http.expectOne('/api/tracks');
    expect(req.request.method).toBe('POST');
    expect(req.request.reportProgress).toBe(true);
    const body = req.request.body as FormData;
    expect(body.get('title')).toBe('Mon titre');
    expect((body.get('audio') as File).name).toBe('song.mp3');

    req.flush({});
  });

});