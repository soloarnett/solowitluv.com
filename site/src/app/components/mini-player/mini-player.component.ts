import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PlaybackService, PlaybackState } from '../../services/playback.service';

@Component({
  standalone: true,
  selector: 'app-mini-player',
  imports: [CommonModule],
  templateUrl: './mini-player.component.html',
  styleUrls: ['./mini-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniPlayerComponent {
  private playback = inject(PlaybackService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  currentState: PlaybackState = this.playback.getCurrentState();
  failedToLoad = false;
  retryCount = 0;
  private iframeElement: HTMLIFrameElement | null = null;
  private cachedUrl: SafeResourceUrl | null = null;
  private cachedVideoId: string | null = null;

  constructor() {
    this.playback.playbackState$.subscribe(state => {
      const previousVideoId = this.currentState.videoId;
      const previousIsPlaying = this.currentState.isPlaying;
      
      this.currentState = state;
      this.failedToLoad = false;
      
      // If video changed, reset retry count and clear cached URL
      if (previousVideoId !== state.videoId) {
        this.retryCount = 0;
        this.cachedUrl = null;
        this.cachedVideoId = null;
      }
      
      // Control playback via postMessage when play state changes
      if (previousVideoId === state.videoId && previousIsPlaying !== state.isPlaying && this.iframeElement) {
        this.controlPlayback(state.isPlaying);
      }
      
      this.cdr.markForCheck();
    });
  }

  get isVisible(): boolean {
    return !!this.currentState.videoId;
  }

  get safeYouTubeUrl(): SafeResourceUrl | null {
    if (!this.currentState.videoId) {
      return null;
    }
    
    // Cache the URL to prevent infinite reloads
    if (this.cachedVideoId === this.currentState.videoId && this.cachedUrl) {
      return this.cachedUrl;
    }
    
    // Always autoplay=1 on load, we'll control pause via postMessage
    const url = `https://www.youtube.com/embed/${this.currentState.videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&enablejsapi=1`;
    this.cachedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.cachedVideoId = this.currentState.videoId;
    
    return this.cachedUrl;
  }

  close(): void {
    this.playback.stop();
  }

  togglePlay(): void {
    if (this.currentState.isPlaying) {
      this.playback.pause();
    } else if (this.currentState.release) {
      this.playback.play(this.currentState.release, this.currentState.section);
    }
  }

  onIframeLoad(event: Event): void {
    const iframe = event.target as HTMLIFrameElement;
    this.iframeElement = iframe;
    
    if (iframe.src && iframe.src.includes('youtube.com')) {
      this.failedToLoad = false;
      
      // If we should be playing, send play command
      if (this.currentState.isPlaying) {
        this.controlPlayback(true);
      }
      
      this.cdr.markForCheck();
    }
  }

  onIframeError(event: Event): void {
    this.failedToLoad = true;
    this.iframeElement = null;
    this.cdr.markForCheck();
  }

  private controlPlayback(shouldPlay: boolean): void {
    if (!this.iframeElement || !this.iframeElement.contentWindow) return;
    
    try {
      const command = shouldPlay ? 'playVideo' : 'pauseVideo';
      this.iframeElement.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        '*'
      );
    } catch (error) {
      console.error('Error controlling playback:', error);
    }
  }

  retry(): void {
    if (this.retryCount < 3) {
      this.retryCount++;
      this.failedToLoad = false;
      
      // Clear cached URL to force reload
      this.cachedUrl = null;
      this.cachedVideoId = null;
      
      // Force reload
      const currentRelease = this.currentState.release;
      const currentSection = this.currentState.section;
      this.playback.stop();
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.playback.play(currentRelease, currentSection);
        this.cdr.markForCheck();
      }, 100);
    }
  }

  get releaseTitle(): string {
    return this.currentState.release?.title || 'Unknown Track';
  }

  get artistName(): string {
    return this.currentState.release?.artist || '';
  }

  get coverImage(): string {
    return this.currentState.release?.coverArt || this.currentState.release?.heroImage || '';
  }

  getStreamingLink(platform: string): string | null {
    return this.currentState.release?.links?.[platform] || 
           this.currentState.release?.preSaveLinks?.[platform] || 
           null;
  }
}
