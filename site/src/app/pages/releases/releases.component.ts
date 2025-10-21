import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';

@Component({
  standalone: true,
  selector: 'app-releases',
  imports: [CommonModule],
  template: `
    <section class="section container">
      <h2>Releases</h2>
      <div class="card-grid">
        <article class="glass" *ngFor="let s of singles" style="padding:16px;">
          <img class="cover" [src]="s.coverArt" [alt]="s.title" />
          <h3 style="margin:12px 0 4px;">{{s.title}}</h3>
          <p class="small">{{s.artist}} <span *ngIf="s.featuredArtists?.length">• feat. {{s.featuredArtists.join(', ')}}</span></p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
            <a *ngIf="s.links.appleMusic" class="button" [href]="s.links.appleMusic" target="_blank">Apple Music</a>
            <a *ngIf="s.links.spotify" class="button" [href]="s.links.spotify" target="_blank">Spotify</a>
            <a *ngIf="s.links.youtubeMusic" class="button" [href]="s.links.youtubeMusic" target="_blank">YouTube</a>
            <a *ngIf="s.links.allPlatforms" class="button" [href]="s.links.allPlatforms" target="_blank">All</a>
          </div>
        </article>
      </div>
    </section>
  `,
  styleUrls: ['./releases.component.scss']
})
export class ReleasesComponent {
  private content = inject(ContentService);
  singles: any[] = [];
  constructor(){ this.content.getReleases().subscribe((d:any)=> this.singles = d.singles || []); }
}