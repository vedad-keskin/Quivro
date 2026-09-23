import { Injectable, signal } from '@angular/core';

/**
 * Kept apart from the dialog component so the app shell can hold a reference
 * without pulling the component (and the Firebase auth SDK) into the initial
 * bundle. The component is deferred until the dialog is first opened.
 */
@Injectable({ providedIn: 'root' })
export class UpgradeDialogService {
  readonly open = signal(false);

  show(): void {
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }
}
