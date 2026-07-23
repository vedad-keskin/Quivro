import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { SnackbarHost } from './shared/snackbar-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SnackbarHost],
  template: `
    <router-outlet />
    <app-snackbar-host />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
  `,
})
export class App {
  /** Eagerly construct so data-theme is applied on first client boot. */
  private readonly _theme = inject(ThemeService);
}
