import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentService } from '../../services/content.service';

@Component({
  standalone: true,
  selector: 'app-bio',
  imports: [CommonModule],
  templateUrl: './bio.component.html',
  styleUrls: ['./bio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BioComponent {
  private content = inject(ContentService);
  bio: any;
  constructor(){ this.content.getBio().pipe(takeUntilDestroyed()).subscribe((d:any)=> this.bio = d); }
}