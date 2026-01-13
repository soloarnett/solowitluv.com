// site/src/app/services/content.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';   // <-- important: use /operators to avoid import confusion
import { USE_RELEASE_API, RELEASE_API_BASE_URL } from '../config';

export interface ReleaseCard {
  id: string;
  title: string;
  artist?: string;
  featuredArtists?: string[];
  coverArt: string;
  links: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
    allPlatforms?: string;
  };
}

export interface ReleasesResponse {
  singles: ReleaseCard[];
}

@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);

  /** Legacy JSON (current site behavior) */
  private getReleasesLegacy$(): Observable<ReleasesResponse> {
    return this.http.get<any>('content/releases.json')
    // .pipe(
    //   map(d => ({ singles: d?.singles ?? [] } as ReleasesResponse))
    // );
  }

  /** Lambda/API -> normalized to the component’s expected shape */
  private getReleasesApi$(): Observable<ReleasesResponse> {
    return this.http
      .get<{ count?: number; items?: any[] }>(`${RELEASE_API_BASE_URL}/releases`)
      .pipe(
        map(api => {
          const items = api?.items ?? [];
          const singles: ReleaseCard[] = items.map(it => ({
            id: it.id,
            title: it.title,
            artist: it.artist ?? 'Solo Wit Luv',
            featuredArtists: it.featuredArtists ?? [],
            coverArt: it.thumb_url || it.image_url || it.image_key || '',
            links: {
              spotify:      it.platforms?.find((p: any) => p.name?.toLowerCase() === 'spotify')?.url,
              appleMusic:   it.platforms?.find((p: any) => p.name?.toLowerCase().includes('apple'))?.url,
              youtubeMusic: it.platforms?.find((p: any) => p.name?.toLowerCase().includes('youtube'))?.url,
              allPlatforms: it.platforms?.find((p: any) => p.name?.toLowerCase().includes('all'))?.url,
            }
          }));
          return { singles };
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
      map(res => res ?? { singles: [] })
    );
  }

  getShows()   { return this.http.get<any>('content/shows.json'); }
  getBio()     { return this.http.get<any>('content/bio.json'); }
  getGallery() { return this.http.get<any>('content/gallery.json'); }
}
