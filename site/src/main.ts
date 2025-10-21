import 'zone.js'; // <-- add this line at the very top
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',  // <— always scroll to top
        anchorScrolling: 'enabled'         // <— supports #hash links
      })
    ),
    provideHttpClient()
  ]
});
