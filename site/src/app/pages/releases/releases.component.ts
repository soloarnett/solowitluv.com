import { Component, inject, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  @Input() latestOnly: boolean = false;

  releases: any[] = [];
  latestReleases: any[] = [];
  albums: any[] = [];
  loading = false;
  error = false;


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
}
