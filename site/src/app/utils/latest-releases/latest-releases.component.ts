import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'latest-releases',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './latest-releases.component.html',
  styleUrl: './latest-releases.component.scss'
})
export class LatestReleasesComponent {
  @Input() releases: any[] = [];
  @Input() loading: boolean = false;
  @Input() error: boolean = false;

  get displayedSingles() {
    return this.releases ?? []
  }
}
