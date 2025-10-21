import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ReleasesComponent } from './pages/releases/releases.component';
import { ShowsComponent } from './pages/shows/shows.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { BioComponent } from './pages/bio/bio.component';
import { DonateComponent } from './pages/donate/donate.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'releases', component: ReleasesComponent },
  { path: 'shows', component: ShowsComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'bio', component: BioComponent },
  { path: 'donate', component: DonateComponent },
  { path: '**', redirectTo: '' }
];