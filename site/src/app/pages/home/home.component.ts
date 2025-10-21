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
      this.featured = data.featuredAlbum; this.singles = data.singles || [];
    });
  }
}