import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentService } from '../../services/content.service';
import { ShowsComponent } from '../shows/shows.component';
import { ReleasesComponent } from '../releases/releases.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, ShowsComponent, ReleasesComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private content = inject(ContentService);
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);
  
  featured: any; 
  singles: any[] = [];
  
  // YouTube video configuration
  readonly videoId = 'fW3wrdHhtdw';
  readonly videoUrl: SafeResourceUrl;
  
  constructor(){
    this.content.getReleases().pipe(takeUntilDestroyed()).subscribe((data:any)=>{
      const releases = data.releases || [];
      this.featured = releases.find((r:any) => r.type === 'album' && r.featured);
      this.singles = releases
        .sort((a:any, b:any) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
        .slice(0, 8);
    });
    
    // Create the YouTube embed URL with all necessary parameters
    const embedUrl = `https://www.youtube.com/embed/${this.videoId}?autoplay=1&mute=1&loop=1&playlist=${this.videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&disablekb=1&fs=0&playsinline=1&enablejsapi=0&vq=hd2160`;
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}