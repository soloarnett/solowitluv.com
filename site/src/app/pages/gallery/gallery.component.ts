import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentService } from '../../services/content.service';

@Component({
  standalone: true,
  selector: 'app-gallery',
  imports: [CommonModule],
  template: `
    <section class="section container">
      <h2>Gallery</h2>
      <div class="card-grid">
        <img class="cover glass" *ngFor="let img of images" [src]="img.src" [alt]="img.alt" loading="lazy" />
      </div>
    </section>
  `,
  styleUrls: ['./gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryComponent {
  private content = inject(ContentService);
  images: any[] = [];
  constructor(){ this.content.getGallery().pipe(takeUntilDestroyed()).subscribe((d:any)=> this.images = d.images || []); }
}