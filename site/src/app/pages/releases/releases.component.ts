import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';

@Component({
  standalone: true,
  selector: 'app-releases',
  imports: [CommonModule],
  templateUrl: './releases.component.html',
  styleUrls: ['./releases.component.scss']
})
export class ReleasesComponent {
  private content = inject(ContentService);
  releases: any[] = [];
  loading = false;
  error = false;

  constructor() { this.reload(); }

  reload() {
    this.loading = true;
    this.error = false;
    this.content.getReleases().subscribe({
      next: (d:any) => {
        this.releases = d?.releases ?? [];
        this.loading = false;
        this.error = this.releases.length === 0;
      },
      error: () => { this.loading = false; this.error = true; }
    });
  }
}
