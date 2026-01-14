import { Component } from '@angular/core';
import { RouterLinkActive, RouterOutlet, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MiniPlayerComponent } from './components/mini-player/mini-player.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgClass, RouterLinkActive, RouterLink, MiniPlayerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly currentYear = new Date().getFullYear();
}