import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LatestReleasesComponent } from '../../utils/latest-releases/latest-releases.component';
import { ContentService } from '../../services/content.service';

@Component({
  standalone: true,
  selector: 'app-releases',
  imports: [CommonModule, LatestReleasesComponent],
  templateUrl: './releases.component.html',
  styleUrls: ['./releases.component.scss']
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
    this.content.getReleases().subscribe({
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
