import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PlaybackState {
  release: any;
  section: string;
  videoId: string | null;
  isPlaying: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlaybackService {
  private playbackState = new BehaviorSubject<PlaybackState>({
    release: null,
    section: 'main',
    videoId: null,
    isPlaying: false
  });

  playbackState$ = this.playbackState.asObservable();

  play(release: any, section: string = 'main'): void {
    const videoId = this.extractYouTubeId(release?.links?.youtubeMusic || release?.preSaveLinks?.youtubeMusic);
    if (!videoId) return;

    this.playbackState.next({
      release,
      section,
      videoId,
      isPlaying: true
    });
  }

  pause(): void {
    const current = this.playbackState.value;
    this.playbackState.next({
      ...current,
      isPlaying: false
    });
  }

  stop(): void {
    this.playbackState.next({
      release: null,
      section: 'main',
      videoId: null,
      isPlaying: false
    });
  }

  toggle(release: any, section: string = 'main'): void {
    const current = this.playbackState.value;
    const videoId = this.extractYouTubeId(release?.links?.youtubeMusic || release?.preSaveLinks?.youtubeMusic);
    
    if (current.videoId === videoId && current.isPlaying) {
      this.pause();
    } else {
      this.play(release, section);
    }
  }

  isPlaying(release: any, section: string = 'main'): boolean {
    const current = this.playbackState.value;
    const videoId = this.extractYouTubeId(release?.links?.youtubeMusic || release?.preSaveLinks?.youtubeMusic);
    return current.videoId === videoId && current.section === section && current.isPlaying;
  }

  getCurrentState(): PlaybackState {
    return this.playbackState.value;
  }

  private extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([^&?\s]+)/);
    return match ? match[1] : null;
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
