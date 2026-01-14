import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { InViewAnimationDirective } from 'src/app/directives/in-view.directive';

@Component({
  selector: 'latest-releases',
  standalone: true,
  imports: [CommonModule, InViewAnimationDirective],
  templateUrl: './latest-releases.component.html',
  styleUrl: './latest-releases.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatestReleasesComponent {
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  @Input() releases: any[] = [];
  @Input() loading: boolean = false;
  @Input() error: boolean = false;
  @Input() playingKey: string | null = null;
  @Output() playVideo = new EventEmitter<string | null>();
  failedVideos = new Set<string>();
  retryAttempts = new Map<string, number>();

  get displayedSingles() {
    return this.releases ?? []
  }

  extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([^&?\s]+)/);
    return match ? match[1] : null;
  }

  getYouTubeId(release: any): string | null {
    return this.extractYouTubeId(release?.links?.youtubeMusic || release?.preSaveLinks?.youtubeMusic);
  }

  getSafeYouTubeUrl(release: any): SafeResourceUrl | null {
    const videoId = this.getYouTubeId(release);
    if (!videoId || !this.isPlaying(release)) {
      return null;
    }
    const key = `latest-${videoId}`;
    const retryCount = this.retryAttempts.get(key) || 0;
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&enablejsapi=1&retry=${retryCount}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  togglePlay(release: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;

    const key = `latest-${videoId}`;
    if (this.playingKey === key) {
      // Stop playing
      this.playVideo.emit(null);
    } else {
      // Start playing
      this.playVideo.emit(key);
    }
  }

  isPlaying(release: any): boolean {
    const videoId = this.getYouTubeId(release);
    const key = `latest-${videoId}`;
    return this.playingKey === key;
  }

  shouldShowButtons(release: any): boolean {
    // Show buttons if no YouTube link OR currently playing
    const hasYouTube = !!this.getYouTubeId(release);
    if (!hasYouTube) return true;
    
    return this.isPlaying(release);
  }

  trackByReleaseId(index: number, release: any): any {
    return release.id || release.title || index;
  }

  onIframeLoad(release: any, event: Event): void {
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;
    
    const key = `latest-${videoId}`;
    const iframe = event.target as HTMLIFrameElement;
    
    if (iframe.src && iframe.src.includes('youtube.com') && this.isPlaying(release)) {
      if (this.failedVideos.has(key)) {
        this.failedVideos.delete(key);
      }
    }
  }

  onIframeError(release: any, event: Event): void {
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;
    
    const key = `latest-${videoId}`;
    if (!this.failedVideos.has(key)) {
      this.failedVideos.add(key);
    }
  }

  retryVideo(release: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;
    
    const key = `latest-${videoId}`;
    const currentRetries = this.retryAttempts.get(key) || 0;
    
    if (currentRetries < 3) {
      this.retryAttempts.set(key, currentRetries + 1);
      this.failedVideos.delete(key);
      
      this.playVideo.emit(null);
      
      setTimeout(() => {
        this.playVideo.emit(key);
      }, 100);
    }
  }

  hasVideoFailed(release: any): boolean {
    const videoId = this.getYouTubeId(release);
    if (!videoId) return false;
    const key = `latest-${videoId}`;
    return this.failedVideos.has(key);
  }
}
