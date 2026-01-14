// site/src/app/services/content.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';   // <-- important: use /operators to avoid import confusion
import { USE_RELEASE_API, RELEASE_API_BASE_URL } from '../config';

export interface ReleaseCard {
  id: string;
  title: string;
  type?: 'single' | 'album';
  featured?: boolean;
  tagline?: string;
  heroImage?: string;
  preSaveLinks?: {
    appleMusic?: string;
    spotify?: string;
    youtubeMusic?: string;
    allPlatforms?: string;
  };
  artist?: string;
  featuredArtists?: string[];
  coverArt?: string;
  links?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
    allPlatforms?: string;
  };
  releaseDate?: string;
  image_url?: string;
  thumb_url?: string;
}

export interface ReleasesResponse {
  releases: ReleaseCard[];
}

@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);

  /** Legacy JSON (current site behavior) */
  private getReleasesLegacy$(): Observable<ReleasesResponse> {
    return this.http.get<any>('content/releases.json').pipe(
      map(d => ({ releases: d?.releases ?? [] } as ReleasesResponse))
    );
  }

  /** Lambda/API -> normalized to the component’s expected shape */
  private getReleasesApi$(): Observable<ReleasesResponse> {
    return this.http
      .get<{ count?: number; items?: any[] }>(`${RELEASE_API_BASE_URL}/releases`)
      .pipe(
        map(api => {
          const items = api?.items ?? [];
          // Directly map to ReleaseCard[]
          const releases: ReleaseCard[] = items.map(it => ({
            ...it,
            id: it.id,
            title: it.title,
            type: it.type,
            featured: it.featured,
            tagline: it.tagline,
            heroImage: it.heroImage,
            preSaveLinks: it.preSaveLinks,
            artist: it.artist ?? 'Solo Wit Luv',
            featuredArtists: it.featuredArtists ?? [],
            coverArt: it.coverArt ?? it.thumb_url ?? it.image_url ?? '',
            links: it.links ?? {},
            releaseDate: it.releaseDate,
            image_url: it.image_url,
            thumb_url: it.thumb_url,
          }));
          return { releases };
        })
      );
  }

  /** Public API that your component calls. Prefers API, falls back to legacy on error. */
  private releasesSubject = new BehaviorSubject<ReleasesResponse | null>(null);
  getReleases(): Observable<ReleasesResponse> {
    // 1. Emit cache first
    const cacheKey = 'releases-cache-v1';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.releases) {
          this.releasesSubject.next(parsed);
        }
      } catch {}
    }
    // 2. Fetch fresh, update cache and subject if changed
    const fetch$ = (!USE_RELEASE_API ? this.getReleasesLegacy$() : this.getReleasesApi$().pipe(catchError(() => this.getReleasesLegacy$()))).pipe(
      map(res => res ?? { releases: [] })
    );
    fetch$.subscribe((fresh) => {
      const prev = this.releasesSubject.value;
      if (!prev || JSON.stringify(prev) !== JSON.stringify(fresh)) {
        localStorage.setItem(cacheKey, JSON.stringify(fresh));
        this.releasesSubject.next(fresh);
      }
    });
    // 3. Return observable (will emit cache first, then update if new)
    return this.releasesSubject.asObservable().pipe(
      map(val => val ?? { releases: [] })
    );
  }

  /** Lambda/API for shows, fallback to legacy JSON, cache-first */
  private showsSubject = new BehaviorSubject<any[] | null>(null);
  getShows(): Observable<any[]> {
    const cacheKey = 'shows-cache-v1';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          this.showsSubject.next(parsed);
        }
      } catch {}
    }
    const SHOWS_API_BASE_URL = 'https://hsef0sw0pe.execute-api.us-east-1.amazonaws.com';
    const fetch$ = this.http.get<any>(`${SHOWS_API_BASE_URL}/shows`).pipe(
      map(res => Array.isArray(res) ? res : (res.items || res.body ? JSON.parse(res.body) : [])),
      catchError(() => this.http.get<any>('content/shows.json').pipe(map(d => d?.upcoming ?? [])))
    );
    fetch$.subscribe((fresh) => {
      const prev = this.showsSubject.value;
      if (!prev || JSON.stringify(prev) !== JSON.stringify(fresh)) {
        localStorage.setItem(cacheKey, JSON.stringify(fresh));
        this.showsSubject.next(fresh);
      }
    });
    return this.showsSubject.asObservable().pipe(
      map(val => val ?? [])
    );
  }
  getBio()     { return this.http.get<any>('content/bio.json'); }
  getGallery() { return this.http.get<any>('content/gallery.json'); }
}
