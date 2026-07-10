import { Injectable, signal } from '@angular/core';

export type SnackKind = 'error' | 'success' | 'info';

export interface SnackMessage {
  id: number;
  text: string;
  kind: SnackKind;
}

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private seq = 0;
  readonly messages = signal<SnackMessage[]>([]);

  show(text: string, kind: SnackKind = 'info', ms = 3800): void {
    const id = ++this.seq;
    this.messages.update((list) => [...list, { id, text, kind }]);
    window.setTimeout(() => this.dismiss(id), ms);
  }

  error(text: string): void {
    this.show(text, 'error', 4500);
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((m) => m.id !== id));
  }
}
