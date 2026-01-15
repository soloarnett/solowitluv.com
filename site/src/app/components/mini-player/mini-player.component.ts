import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
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
export class MiniPlayerComponent implements OnDestroy {
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
  private iframeCreated = false;
  showContentBlockerWarning = false;
  private autoRetryAttempts = 0;
  private maxAutoRetries = 2;
  isMuted = false;
  showUnmuteButton = false;
  private hasUnmuted = false;
  private pendingTimeouts: number[] = [];
  private messageListener: ((event: MessageEvent) => void) | null = null;

  constructor() {
    this.playback.playbackState$.subscribe(state => {
      const previousVideoId = this.currentState.videoId;
      const previousIsPlaying = this.currentState.isPlaying;
      
      this.currentState = state;
      this.failedToLoad = false;
      
      // If video changed, load new video in existing iframe
      if (previousVideoId !== state.videoId) {
        // Clear all pending timeouts when video changes
        this.clearAllTimeouts();
        
        this.retryCount = 0;
        this.showContentBlockerWarning = false;
        this.autoRetryAttempts = 0;
        
        if (state.videoId) {
          // If iframe not created yet, create it once
          if (!this.iframeCreated) {
            this.iframeCreated = true;
            if (this.isMobile()) {
              const url = `https://www.youtube.com/embed/${state.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`;
              this.safeYouTubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
            } else {
              const url = `https://www.youtube.com/embed/${state.videoId}?autoplay=0&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`;
              this.safeYouTubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
            }
          } else if (this.iframeReady && this.iframeElement) {
            // Reuse existing iframe - load new video via YouTube API
            this.loadVideoById(state.videoId);
            
            // Don't show unmute button for subsequent videos if already unmuted
            if (this.isMobile() && !this.hasUnmuted) {
              this.isMuted = true;
              this.showUnmuteButton = true;
            }
          }
        } else {
          // Reset when no video
          this.iframeCreated = false;
          this.iframeReady = false;
          this.iframeElement = null;
          this.safeYouTubeUrl = null;
          this.isMuted = false;
          this.showUnmuteButton = false;
          this.hasUnmuted = false;
        }
      } else if (previousIsPlaying !== state.isPlaying) {
        // Only control playback if same video and play state changed
        if (state.isPlaying) {
          this.sendPlayCommandsWithRetry();
        } else {
          this.controlPlayback(false);
        }
      }
      
      this.cdr.markForCheck();
    });

    // Listen for YouTube iframe events to detect when playback ends
    this.messageListener = (event) => {
      if (event.origin === 'https://www.youtube.com') {
        try {
          const data = JSON.parse(event.data);
          // YouTube sends state changes: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused)
          if (data.event === 'infoDelivery' && data.info && data.info.playerState === 0) {
            // Video ended - collapse mini player and reset state
            this.playback.stop();
            this.cdr.markForCheck();
          }
        } catch (error) {
          // Ignore parse errors for non-YouTube messages
        }
      }
    };
    window.addEventListener('message', this.messageListener);
  }

  ngOnDestroy(): void {
    // Clean up all pending timeouts
    this.clearAllTimeouts();
    
    // Remove message listener
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
  }

  private clearAllTimeouts(): void {
    this.pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.pendingTimeouts = [];
  }

  private sendPlayCommandsWithRetry(): void {
    // Clear any existing pending timeouts first
    this.clearAllTimeouts();
    
    if (this.isMobile()) {
      // Mobile: Very aggressive retry strategy
      const delays = [100, 300, 600, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
      delays.forEach(delay => {
        const timeoutId = window.setTimeout(() => {
          if (this.currentState.isPlaying && this.iframeReady) {
            this.controlPlayback(true);
          }
        }, delay);
        this.pendingTimeouts.push(timeoutId);
      });
    } else {
      // Desktop: Single delayed command
      const timeoutId = window.setTimeout(() => {
        if (this.currentState.isPlaying && this.iframeReady) {
          this.controlPlayback(true);
        }
      }, 2000);
      this.pendingTimeouts.push(timeoutId);
    }
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
      
      if (this.iframeReady) {
        const timeoutId = window.setTimeout(() => {
          this.controlPlayback(true);
        }, 100);
        this.pendingTimeouts.push(timeoutId);
      }
    }
  }

  onIframeLoad(event: Event): void {
    const iframe = event.target as HTMLIFrameElement;
    this.iframeElement = iframe;
    
    if (iframe.src && iframe.src.includes('youtube.com')) {
      this.failedToLoad = false;
      this.iframeReady = true;
      
      // Request YouTube iframe to send state change events
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'listening', id: iframe.id }),
            '*'
          );
        }
      } catch (error) {
        // Silent error handling
      }
      
      if (this.currentState.isPlaying) {
        if (this.isMobile()) {
          this.isMuted = true;
          this.showUnmuteButton = true;
        } else {
          this.sendPlayCommandsWithRetry();
        }
      }
      
      this.cdr.markForCheck();
    }
  }

  onIframeError(event: Event): void {
    this.failedToLoad = true;
    this.iframeElement = null;
    this.iframeReady = false;
    
    // Likely a content blocker issue - try automatic retry
    if (this.autoRetryAttempts < this.maxAutoRetries) {
      this.autoRetryAttempts++;
      const retryTimeoutId = window.setTimeout(() => {
        if (this.currentState.isPlaying) {
          // Toggle play to retry
          this.playback.pause();
          const playTimeoutId = window.setTimeout(() => {
            if (this.currentState.release) {
              this.playback.play(this.currentState.release, this.currentState.section);
            }
          }, 200);
          this.pendingTimeouts.push(playTimeoutId);
        }
      }, 500);
      this.pendingTimeouts.push(retryTimeoutId);
    } else {
      // Show content blocker warning
      this.showContentBlockerWarning = true;
      const warningTimeoutId = window.setTimeout(() => {
        this.showContentBlockerWarning = false;
        this.cdr.markForCheck();
      }, 10000);
      this.pendingTimeouts.push(warningTimeoutId);
    }
    
    this.cdr.markForCheck();
  }

  private loadVideoById(videoId: string): void {
    if (!this.iframeElement || !this.iframeElement.contentWindow) return;
    
    try {
      const message = JSON.stringify({ 
        event: 'command', 
        func: 'loadVideoById', 
        args: [videoId] 
      });
      this.iframeElement.contentWindow.postMessage(message, '*');
    } catch (error) {
      // Silent error handling
    }
  }

  private controlPlayback(shouldPlay: boolean): void {
    if (!this.iframeElement || !this.iframeElement.contentWindow) return;
    
    try {
      const command = shouldPlay ? 'playVideo' : 'pauseVideo';
      const message = JSON.stringify({ event: 'command', func: command, args: [] });
      this.iframeElement.contentWindow.postMessage(message, '*');
    } catch (error) {
      // Silent error handling
    }
  }

  private unmuteVideo(): void {
    if (!this.iframeElement || !this.iframeElement.contentWindow) return;
    
    try {
      this.iframeElement.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
        '*'
      );
    } catch (error) {
      // Silent error handling
    }
  }

  onUnmuteClick(): void {
    this.unmuteVideo();
    this.isMuted = false;
    this.showUnmuteButton = false;
    this.hasUnmuted = true;
    this.cdr.markForCheck();
  }

  retry(): void {
    if (this.retryCount < 3) {
      this.retryCount++;
      this.failedToLoad = false;
      
      if (this.currentState.videoId) {
        // On retry, force recreate iframe
        this.iframeCreated = false;
        this.iframeReady = false;
        this.iframeElement = null;
        
        if (this.isMobile()) {
          const url = `https://www.youtube.com/embed/${this.currentState.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`;
          this.safeYouTubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        } else {
          const url = `https://www.youtube.com/embed/${this.currentState.videoId}?autoplay=0&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`;
          this.safeYouTubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        }
        
        this.iframeCreated = true;
        this.cdr.markForCheck();
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

  get featuredArtists(): string[] {
    return this.currentState.release?.featuredArtists || [];
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
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isIPad = /ipad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    return isMobileUA || (isTouchDevice && isIPad);
  }
}
