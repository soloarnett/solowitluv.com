import { Component, inject, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LatestReleasesComponent } from '../../utils/latest-releases/latest-releases.component';
import { ContentService } from '../../services/content.service';
import { InViewAnimationDirective } from 'src/app/directives/in-view.directive';

@Component({
  standalone: true,
  selector: 'app-releases',
  imports: [CommonModule, LatestReleasesComponent, InViewAnimationDirective],
  templateUrl: './releases.component.html',
  styleUrls: ['./releases.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReleasesComponent {
  private content = inject(ContentService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  @Input() latestOnly: boolean = false;

  releases: any[] = [];
  latestReleases: any[] = [];
  albums: any[] = [];
  loading = false;
  error = false;
  playingKey: string | null = null;
  failedVideos = new Set<string>();
  retryAttempts = new Map<string, number>();


  constructor() { this.reload(); }

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
      error: () => { this.loading = false; this.error = true; }
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

  getSafeYouTubeUrl(release: any, section: string = 'main'): SafeResourceUrl | null {
    const videoId = this.getYouTubeId(release);
    if (!videoId || !this.isPlaying(release, section)) {
      return null;
    }
    const key = `${section}-${videoId}`;
    const retryCount = this.retryAttempts.get(key) || 0;
    // Enable autoplay with audible sound
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&enablejsapi=1&retry=${retryCount}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  togglePlay(release: any, event: Event, section: string = 'main'): void {
    event.preventDefault();
    event.stopPropagation();
    
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;

    const key = `${section}-${videoId}`;
    if (this.playingKey === key) {
      // Stop playing
      this.playingKey = null;
    } else {
      // Start playing
      this.playingKey = key;
    }
    this.cdr.markForCheck();
  }

  isPlaying(release: any, section: string = 'main'): boolean {
    const videoId = this.getYouTubeId(release);
    const key = `${section}-${videoId}`;
    return this.playingKey === key;
  }

  shouldShowButtons(release: any, section: string = 'main'): boolean {
    // Show buttons if no YouTube link OR currently playing
    const hasYouTube = !!this.getYouTubeId(release);
    if (!hasYouTube) return true;
    
    return this.isPlaying(release, section);
  }

  onPlayVideo(key: string | null): void {
    this.playingKey = key;
    this.cdr.markForCheck();
  }

  trackByReleaseId(index: number, release: any): any {
    return release.id || release.title || index;
  }

  onIframeLoad(release: any, section: string, event: Event): void {
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;
    
    const key = `${section}-${videoId}`;
    const iframe = event.target as HTMLIFrameElement;
    
    // Check if iframe loaded successfully (not about:blank) and only process once
    if (iframe.src && iframe.src.includes('youtube.com') && this.isPlaying(release, section)) {
      if (this.failedVideos.has(key)) {
        this.failedVideos.delete(key);
        this.cdr.markForCheck();
      }
    }
  }

  onIframeError(release: any, section: string, event: Event): void {
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;
    
    const key = `${section}-${videoId}`;
    if (!this.failedVideos.has(key)) {
      this.failedVideos.add(key);
      this.cdr.markForCheck();
    }
  }

  retryVideo(release: any, section: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;
    
    const key = `${section}-${videoId}`;
    const currentRetries = this.retryAttempts.get(key) || 0;
    
    if (currentRetries < 3) {
      this.retryAttempts.set(key, currentRetries + 1);
      this.failedVideos.delete(key);
      
      // Toggle off and on to force reload
      this.playingKey = null;
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.playingKey = key;
        this.cdr.markForCheck();
      }, 100);
    }
  }

  hasVideoFailed(release: any, section: string): boolean {
    const videoId = this.getYouTubeId(release);
    if (!videoId) return false;
    const key = `${section}-${videoId}`;
    return this.failedVideos.has(key);
  }
}
