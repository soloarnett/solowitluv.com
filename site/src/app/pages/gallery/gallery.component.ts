import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentService } from '../../services/content.service';

@Component({
  standalone: true,
  selector: 'app-gallery',
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {
  private content = inject(ContentService);
  images: any[] = [];
  constructor(){ this.content.getGallery().pipe(takeUntilDestroyed()).subscribe((d:any)=> this.images = d.images || []); }
}