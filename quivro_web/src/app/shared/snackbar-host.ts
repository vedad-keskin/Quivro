import { Component, inject } from '@angular/core';
import { SnackbarService } from '../core/snackbar.service';

@Component({
  selector: 'app-snackbar-host',
  template: `
    <div class="snacks" aria-live="polite">
      @for (m of snacks.messages(); track m.id) {
        <div class="snack" [class]="m.kind" (click)="snacks.dismiss(m.id)">
          <span class="bar"></span>
          <p>{{ m.text }}</p>
        </div>
      }
    </div>
  `,
  styles: `
    .snacks {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      z-index: 9999;
      display: grid;
      gap: 0.65rem;
      max-width: min(420px, calc(100vw - 2rem));
      pointer-events: none;
    }
    .snack {
      pointer-events: auto;
      display: grid;
      grid-template-columns: 6px 1fr;
      gap: 0.85rem;
      align-items: center;
      padding: 0.95rem 1.1rem;
      border-radius: 18px;
      background: var(--q-card);
      border: 2px solid var(--q-border);
      box-shadow: 0 14px 40px rgba(30, 41, 59, 0.14);
      cursor: pointer;
      animation: slide-in 0.28s ease;
      font-weight: 700;
    }
    .snack p {
      margin: 0;
      color: var(--q-navy);
      line-height: 1.35;
    }
    .bar {
      align-self: stretch;
      border-radius: 99px;
      background: var(--q-blue);
    }
    .error .bar {
      background: #ec4899;
    }
    .success .bar {
      background: #84cc16;
    }
    .info .bar {
      background: linear-gradient(180deg, #2f7cf6, #7b3ff2);
    }
    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
})
export class SnackbarHost {
  readonly snacks = inject(SnackbarService);
}
