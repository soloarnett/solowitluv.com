// site/src/app/services/content.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable } from 'rxjs';
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
  getReleases(): Observable<ReleasesResponse> {
    if (!USE_RELEASE_API) {
      return this.getReleasesLegacy$();
    }
    return this.getReleasesApi$().pipe(
      // Any API error -> fall back to legacy file
      catchError(() => this.getReleasesLegacy$()),
      // Guard against any odd nulls
      map(res => res ?? { releases: [] })
    );
  }

  getShows()   { return this.http.get<any>('content/shows.json'); }
  getBio()     { return this.http.get<any>('content/bio.json'); }
  getGallery() { return this.http.get<any>('content/gallery.json'); }
}
