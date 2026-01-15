// site/src/app/services/content.service.ts
import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, BehaviorSubject } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
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
    return this.http.get<any>('/content/releases.json').pipe(
      map(d => ({ releases: d?.releases ?? [] } as ReleasesResponse)),
      catchError((error) => {
        console.warn('Failed to load releases.json:', error);
        return of({ releases: [] } as ReleasesResponse);
      })
    );
  }

  /** Lambda/API -> normalized to the component’s expected shape */
  private getReleasesApi$(): Observable<ReleasesResponse> {
    return this.http
      .get<{ count?: number; items?: any[] }>(`${RELEASE_API_BASE_URL}/releases`)
      .pipe(        timeout(5000),        map(api => {
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
  private releasesFetchInProgress = false;

  getReleases(): Observable<ReleasesResponse> {
    const useLocalOnly = isDevMode() || !USE_RELEASE_API;

    // 1. Emit cache first
    const cacheKey = 'releases-cache-v1';
    const cached = localStorage.getItem(cacheKey);
    if (cached && !useLocalOnly) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.releases) {
          setTimeout(() => this.releasesSubject.next(parsed), 0);
        }
      } catch {}
    }

    // 2. Fetch fresh, only once
    if (!this.releasesFetchInProgress) {
      this.releasesFetchInProgress = true;

      const fetch$ = useLocalOnly
        ? this.getReleasesLegacy$()
        : this.getReleasesApi$().pipe(
            catchError(() => {
              console.warn('API failed, falling back to local JSON');
              return this.getReleasesLegacy$();
            })
          );

      fetch$.subscribe((fresh) => {
        if (!useLocalOnly) {
          localStorage.setItem(cacheKey, JSON.stringify(fresh));
        }
        this.releasesSubject.next(fresh);
        this.releasesFetchInProgress = false;
      }, (error) => {
        console.error('Error fetching releases:', error);
        if (!this.releasesSubject.value) {
          this.releasesSubject.next({ releases: [] });
        }
        this.releasesFetchInProgress = false;
      });
    }
    // 3. Return observable (will emit cache first, then update if new)
    return this.releasesSubject.asObservable().pipe(
      map(val => val ?? { releases: [] })
    );
  }

  /** Lambda/API for shows, fallback to legacy JSON, cache-first */
  private showsSubject = new BehaviorSubject<any[] | null>(null);
  private showsFetchInProgress = false;

  getShows(): Observable<any[]> {
    const useLocalOnly = isDevMode();

    const cacheKey = 'shows-cache-v1';
    const cached = localStorage.getItem(cacheKey);
    if (cached && !useLocalOnly) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setTimeout(() => this.showsSubject.next(parsed), 0);
        }
      } catch {}
    }

    if (!this.showsFetchInProgress) {
      this.showsFetchInProgress = true;

      const SHOWS_API_BASE_URL = 'https://hsef0sw0pe.execute-api.us-east-1.amazonaws.com';
      const localFallback$ = this.http.get<any>('/content/shows.json').pipe(
        map(d => d?.upcoming ?? []),
        catchError((error) => {
          console.warn('Failed to load shows.json:', error);
          return of([]);
        })
      );

      const fetch$ = useLocalOnly
        ? localFallback$
        : this.http.get<any>(`${SHOWS_API_BASE_URL}/shows`).pipe(
            timeout(5000),
            map(res => Array.isArray(res) ? res : (res.items || res.body ? JSON.parse(res.body) : [])),
            catchError(() => {
              console.warn('Shows API failed, falling back to local JSON');
              return localFallback$;
            })
          );

      fetch$.subscribe((fresh) => {
        if (!useLocalOnly) {
          localStorage.setItem(cacheKey, JSON.stringify(fresh));
        }
        this.showsSubject.next(fresh);
        this.showsFetchInProgress = false;
      }, (error) => {
        console.error('Error fetching shows:', error);
        if (!this.showsSubject.value) {
          this.showsSubject.next([]);
        }
        this.showsFetchInProgress = false;
      });
    }
    return this.showsSubject.asObservable().pipe(
      map(val => val ?? [])
    );
  }
  getBio() { return this.http.get<any>('/content/bio.json').pipe(catchError(() => of({}))); }
  getGallery() { return this.http.get<any>('/content/gallery.json').pipe(catchError(() => of({ images: [] }))); }
}
