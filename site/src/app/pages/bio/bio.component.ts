import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';

@Component({
  standalone: true,
  selector: 'app-bio',
  imports: [CommonModule],
  templateUrl: './bio.component.html',
  styleUrls: ['./bio.component.scss']
})
export class BioComponent {
  private content = inject(ContentService);
  bio: any;
  constructor(){ this.content.getBio().subscribe((d:any)=> this.bio = d); }
}