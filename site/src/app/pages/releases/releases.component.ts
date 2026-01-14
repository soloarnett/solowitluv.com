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
  playingVideoId: string | null = null;


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

  getSafeYouTubeUrl(release: any): SafeResourceUrl {
    const videoId = this.getYouTubeId(release);
    if (!videoId) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&enablejsapi=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  togglePlay(release: any, event: Event): void {
    console.log('togglePlay:', release);
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
