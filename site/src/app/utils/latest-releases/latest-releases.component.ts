import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
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
  playingVideoId: string | null = null;

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

  getSafeYouTubeUrl(release: any): SafeResourceUrl {
    const videoId = this.getYouTubeId(release);
    if (!videoId) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&enablejsapi=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  togglePlay(release: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    const videoId = this.getYouTubeId(release);
    if (!videoId) return;

    if (this.playingVideoId === videoId) {
      // Stop playing
      this.playingVideoId = null;
    } else {
      // Start playing
      this.playingVideoId = videoId;
    }
    this.cdr.markForCheck();
  }

  isPlaying(release: any): boolean {
    const videoId = this.getYouTubeId(release);
    return this.playingVideoId === videoId;
  }
}
