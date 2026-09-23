import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { SnackbarHost } from './shared/snackbar-host';
import { UpgradeDialog } from './shared/upgrade-dialog';
import { UpgradeDialogService } from './shared/upgrade-dialog.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SnackbarHost, UpgradeDialog],
  template: `
    <router-outlet />
    <app-snackbar-host />
    @defer (when upgrade.open()) {
      <app-upgrade-dialog />
    }
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
  readonly upgrade = inject(UpgradeDialogService);
}
