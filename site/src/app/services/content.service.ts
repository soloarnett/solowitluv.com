import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);
  getReleases() { return this.http.get<any>('content/releases.json'); }
  getShows() { return this.http.get<any>('content/shows.json'); }
  getBio() { return this.http.get<any>('content/bio.json'); }
  getGallery() { return this.http.get<any>('content/gallery.json'); }
}