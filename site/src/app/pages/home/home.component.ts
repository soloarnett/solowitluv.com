import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { ShowsComponent } from '../shows/shows.component';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, ShowsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private content = inject(ContentService);
  featured: any; singles: any[] = [];
  constructor(){
    this.content.getReleases().subscribe((data:any)=>{
      const releases = data.releases || [];
      this.featured = releases.find((r:any) => r.type === 'album' && r.featured);
      this.singles = releases.filter((r:any) => r.type === 'single');
    });
  }
}