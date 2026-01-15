import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentService } from '../../services/content.service';

@Component({
  standalone: true,
  selector: 'app-shows',
  imports: [CommonModule],
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss']
})
export class ShowsComponent {
  private content = inject(ContentService);
  shows: any[] = [];
  constructor(){
    this.content.getShows().pipe(takeUntilDestroyed()).subscribe((shows: any[]) => {
      this.shows = shows;
    });
  }
}