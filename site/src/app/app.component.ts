import { Component, OnInit, OnDestroy, Renderer2, inject } from '@angular/core';
import { RouterLinkActive, RouterOutlet, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { MiniPlayerComponent } from './components/mini-player/mini-player.component';
import { PlaybackService } from './services/playback.service';
import { ColorExtractor } from './utils/color-extractor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgClass, RouterLinkActive, RouterLink, MiniPlayerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  readonly currentYear = new Date().getFullYear();
  
  private playbackService = inject(PlaybackService);
  private renderer = inject(Renderer2);
  private playbackSubscription?: Subscription;
  
  // Default gradient colors when no song is playing
  private defaultColors = ['#1f0e04', '#030b23', '#000', '#030b23', '#1f0e04'];
  private defaultAnimationDuration = '24s';
  private playingAnimationDuration = '8s'; // Faster when playing
  
  ngOnInit(): void {
    // Subscribe to playback changes
    this.playbackSubscription = this.playbackService.playbackState$.subscribe(async (state) => {
      if (state.isPlaying && state.release) {
        // Extract colors from album art
        const coverArt = state.release.coverArt || state.release.heroImage;
        if (coverArt) {
          try {
            const colors = await ColorExtractor.extractColors(coverArt, 5);
            this.applyGradient(colors, this.playingAnimationDuration);
          } catch (error) {
            console.warn('Failed to extract colors from album art, using defaults:', error);
            this.applyGradient(this.defaultColors, this.playingAnimationDuration);
          }
        } else {
          // No cover art, but still speed up the gradient
          this.applyGradient(this.defaultColors, this.playingAnimationDuration);
        }
      } else {
        // No song playing - revert to default
        this.applyGradient(this.defaultColors, this.defaultAnimationDuration);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.playbackSubscription?.unsubscribe();
  }
  
  private applyGradient(colors: string[], duration: string): void {
    const gradientString = ColorExtractor.createGradientString(colors);
    
    // Apply to body element
    const body = document.body;
    this.renderer.setStyle(body, 'background', gradientString);
    this.renderer.setStyle(body, 'background-size', '400% 400%');
    this.renderer.setStyle(body, 'animation', `gradientShift ${duration} ease-in-out infinite`);
  }
}