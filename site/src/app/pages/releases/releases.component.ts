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
  singles: any[] = [];
  loading = false;
  error = false;

  constructor() { this.reload(); }

  reload() {
    this.loading = true;
    this.error = false;
    this.content.getReleases().subscribe({
      next: (d:any) => {
        this.singles = d?.singles ?? [];
        this.loading = false;
        // If API was enabled but provided nothing and the fallback also empty, show Retry
        this.error = this.singles.length === 0;
      },
      error: () => { this.loading = false; this.error = true; }
    });
  }
}
