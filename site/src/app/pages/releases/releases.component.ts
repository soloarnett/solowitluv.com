import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LatestReleasesComponent } from '../../utils/latest-releases/latest-releases.component';
import { ContentService } from '../../services/content.service';
import { PlaybackService } from '../../services/playback.service';
import { InViewAnimationDirective } from 'src/app/directives/in-view.directive';

@Component({
  standalone: true,
  selector: 'app-releases',
  imports: [CommonModule, LatestReleasesComponent, InViewAnimationDirective],
  templateUrl: './releases.component.html',
  styleUrls: ['./releases.component.scss']
})
export class ReleasesComponent {
  private content = inject(ContentService);
  private sanitizer = inject(DomSanitizer);
  private playback = inject(PlaybackService);
  @Input() latestOnly: boolean = false;

  releases: any[] = [];
  latestReleases: any[] = [];
  albums: any[] = [];
  loading = false;
  error = false;
  
  expandedAlbums = new Set<string>();
  expandedSingles = new Set<string>();


  constructor() {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.error = false;
    this.content.getReleases().pipe(takeUntilDestroyed()).subscribe({
      next: (d: any) => {
        const all = d?.releases ?? [];
        // Separate albums and other releases, order by releaseDate descending
        this.albums = all.filter((r: any) => r.type === 'album')
          .sort((a: any, b: any) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
        this.releases = all.filter((r: any) => r.type !== 'album')
          .sort((a: any, b: any) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));

        this.latestReleases = all
          .sort((a: any, b: any) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
          .slice(0, 8);

        this.loading = false;
        this.error = all.length === 0;
      },
      error: () => { 
        this.loading = false; 
        this.error = true;
      }
    });
  }

  extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([^&?\s]+)/);
    return match ? match[1] : null;
  }

  getYouTubeId(release: any): string | null {
    return this.extractYouTubeId(release?.links?.youtubeMusic || release?.preSaveLinks?.youtubeMusic);
  }

  togglePlay(release: any, event: Event, section: string = 'main'): void {
    event.preventDefault();
    event.stopPropagation();
    
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;

    this.playback.toggle(release, section);
    // Expand links when playing
    const releaseKey = this.getReleaseKey(release);
    if (section === 'albums') {
      this.expandedAlbums.add(releaseKey);
    } else if (section === 'singles') {
      this.expandedSingles.add(releaseKey);
    }
  }

  isPlaying(release: any, section: string = 'main'): boolean {
    return this.playback.isPlaying(release, section);
  }

  shouldShowButtons(release: any, section: string = 'main'): boolean {
    // Show buttons if no YouTube link OR release is in expanded state
    const hasYouTube = !!this.getYouTubeId(release);
    if (!hasYouTube) return true;
    
    const releaseKey = this.getReleaseKey(release);
    if (section === 'albums') {
      return this.expandedAlbums.has(releaseKey);
    } else if (section === 'singles') {
      return this.expandedSingles.has(releaseKey);
    }
    return false;
  }

  collapseLinks(release: any, section: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    const releaseKey = this.getReleaseKey(release);
    if (section === 'albums') {
      this.expandedAlbums.delete(releaseKey);
    } else if (section === 'singles') {
      this.expandedSingles.delete(releaseKey);
    }
  }

  getReleaseKey(release: any): string {
    return release.id || release.title || '';
  }

  onPlayVideo(release: any | null, section: string = 'main'): void {
    if (release) {
      this.playback.play(release, section);
    } else {
      this.playback.pause();
    }
  }

  trackByReleaseId(index: number, release: any): any {
    return release.id || release.title || index;
  }
}
