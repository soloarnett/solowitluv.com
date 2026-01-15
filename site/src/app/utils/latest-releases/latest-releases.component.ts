import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PlaybackService } from '../../services/playback.service';
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
  private playback = inject(PlaybackService);
  @Input() releases: any[] = [];
  @Input() loading: boolean = false;
  @Input() error: boolean = false;

  constructor() {
    // Subscribe to playback changes to update UI
    this.playback.playbackState$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

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

  togglePlay(release: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;

    this.playback.toggle(release, 'latest');
    this.cdr.markForCheck();
  }

  isPlaying(release: any): boolean {
    return this.playback.isPlaying(release, 'latest');
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
}
