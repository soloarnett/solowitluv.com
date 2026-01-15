import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('hiddenAudio') hiddenAudio?: ElementRef<HTMLAudioElement>;
  
  private playback = inject(PlaybackService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  currentState: PlaybackState = this.playback.getCurrentState();
  failedToLoad = false;
  retryCount = 0;
  private iframeElement: HTMLIFrameElement | null = null;
  safeYouTubeUrl: SafeResourceUrl | null = null;
  private iframeReady = false;
  iframeKey = 1; // Start at 1 so it's truthy for *ngIf
  showContentBlockerWarning = false;
  private autoRetryAttempts = 0;
  private maxAutoRetries = 2;

  constructor() {
    this.playback.playbackState$.subscribe(state => {
      const previousVideoId = this.currentState.videoId;
      const previousIsPlaying = this.currentState.isPlaying;
      
      this.currentState = state;
      this.failedToLoad = false;
      
      // If video changed, regenerate URL and reset state
      if (previousVideoId !== state.videoId) {
        this.retryCount = 0;
        this.iframeReady = false;
        this.iframeElement = null;
        this.iframeKey++; // Increment key to force iframe recreation
        this.showContentBlockerWarning = false;
        this.autoRetryAttempts = 0;
        
        // Generate new URL only when video actually changes
        if (state.videoId) {
          // On mobile, use autoplay=1 to leverage the user click gesture directly
          // On desktop, use autoplay=0 for better control
          const autoplayParam = this.isMobile() ? '1' : '0';
          const url = `https://www.youtube.com/embed/${state.videoId}?autoplay=${autoplayParam}&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`;
          this.safeYouTubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        } else {
          this.safeYouTubeUrl = null;
        }
        // Don't send play command here - wait for onIframeLoad
      } else if (previousIsPlaying !== state.isPlaying) {
        // Only control playback if same video and play state changed
        this.controlPlayback(state.isPlaying);
      }
      
      this.cdr.markForCheck();
    });
  }

  get isVisible(): boolean {
    return !!this.currentState.videoId;
  }

  close(): void {
    this.playback.stop();
  }

  togglePlay(): void {
    if (this.currentState.isPlaying) {
      this.playback.pause();
    } else if (this.currentState.release) {
      this.playback.play(this.currentState.release, this.currentState.section);
      
      // On mobile, if iframe is ready, immediately try to play
      // This happens within the user click event, so it should work
      if (this.isMobile() && this.iframeReady) {
        setTimeout(() => {
          this.controlPlayback(true);
        }, 100);
      }
    }
  }

  onIframeLoad(event: Event): void {
    const iframe = event.target as HTMLIFrameElement;
    this.iframeElement = iframe;
    
    if (iframe.src && iframe.src.includes('youtube.com')) {
      this.failedToLoad = false;
      
      // Wait for YouTube player to initialize
      setTimeout(() => {
        this.iframeReady = true;
        
        // On desktop or if not autoplaying, send play command if needed
        if (this.currentState.isPlaying && !this.isMobile()) {
          this.controlPlayback(true);
        }
        
        this.cdr.markForCheck();
      }, 600);
    }
  }

  onIframeError(event: Event): void {
    this.failedToLoad = true;
    this.iframeElement = null;
    this.iframeReady = false;
    
    // Likely a content blocker issue - try automatic retry
    if (this.autoRetryAttempts < this.maxAutoRetries) {
      this.autoRetryAttempts++;
      setTimeout(() => {
        if (this.currentState.isPlaying) {
          // Toggle play to retry
          this.playback.pause();
          setTimeout(() => {
            if (this.currentState.release) {
              this.playback.play(this.currentState.release, this.currentState.section);
            }
          }, 200);
        }
      }, 500);
    } else {
      // Show content blocker warning
      this.showContentBlockerWarning = true;
      setTimeout(() => {
        this.showContentBlockerWarning = false;
        this.cdr.markForCheck();
      }, 10000);
    }
    
    this.cdr.markForCheck();
  }

  private controlPlayback(shouldPlay: boolean): void {
    if (!this.iframeElement || !this.iframeElement.contentWindow) return;
    
    // Wait for iframe to be ready before sending commands
    if (!this.iframeReady && shouldPlay) {
      // If not ready yet, wait and retry
      setTimeout(() => {
        this.controlPlayback(shouldPlay);
      }, 300);
      return;
    }
    
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
      
      // Force reload by regenerating URL
      if (this.currentState.videoId) {
        const autoplayParam = this.isMobile() ? '1' : '0';
        const url = `https://www.youtube.com/embed/${this.currentState.videoId}?autoplay=${autoplayParam}&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`;
        this.safeYouTubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        
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

  dismissWarning(): void {
    this.showContentBlockerWarning = false;
    this.cdr.markForCheck();
  }

  private isMobile(): boolean {
    // Check for mobile/tablet devices including modern iPads
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isIPad = /ipad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    return isMobileUA || (isTouchDevice && isIPad);
  }
}
