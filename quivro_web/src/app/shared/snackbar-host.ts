import { Component, inject } from '@angular/core';
import { SnackbarService } from '../core/snackbar.service';

@Component({
  selector: 'app-snackbar-host',
  template: `
    <div class="snacks q-show" aria-live="polite">
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
      padding: 0.85rem 1.05rem;
      border: 3px solid var(--ink);
      border-radius: 14px;
      background: var(--q-card);
      box-shadow: 6px 6px 0 var(--ink);
      cursor: pointer;
      animation: slide-in 0.28s ease;
      font-weight: 800;
    }
    .snack:active {
      transform: translate(4px, 4px);
      box-shadow: 2px 2px 0 var(--ink);
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
      background: var(--q-lime);
    }
    .info .bar {
      background: var(--q-cyan);
    }
    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .snack {
        animation: none;
      }
    }
  `,
})
export class SnackbarHost {
  readonly snacks = inject(SnackbarService);
}
