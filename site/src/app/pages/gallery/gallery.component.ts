import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';

@Component({
  standalone: true,
  selector: 'app-gallery',
  imports: [CommonModule],
  template: `
    <section class="section container">
      <h2>Gallery</h2>
      <div class="card-grid">
        <img class="cover glass" *ngFor="let img of images" [src]="img.src" [alt]="img.alt" />
      </div>
    </section>
  `,
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {
  private content = inject(ContentService);
  images: any[] = [];
  constructor(){ this.content.getGallery().subscribe((d:any)=> this.images = d.images || []); }
}