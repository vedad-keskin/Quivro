import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-timer-ring',
  template: `
    <div class="timer" [class.urgent]="remaining() <= 5">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path
          class="bg"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          class="fg"
          [attr.stroke-dasharray]="percent() + ', 100'"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <span>{{ remaining() }}</span>
    </div>
  `,
  styles: `
    .timer {
      position: relative;
      width: 4.5rem;
      height: 4.5rem;
    }
    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    path {
      fill: none;
      stroke-width: 3.2;
    }
    .bg {
      stroke: #e2e8f0;
    }
    .fg {
      stroke: var(--q-blue);
      stroke-linecap: round;
      transition: stroke-dasharray 0.2s linear;
    }
    .urgent .fg {
      stroke: var(--q-pink);
    }
    span {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 1.25rem;
    }
  `,
})
export class TimerRing {
  private readonly destroyRef = inject(DestroyRef);

  readonly endsAt = input.required<number>();
  readonly durationMs = input.required<number>();
  readonly expired = output<void>();

  readonly remaining = signal(0);
  readonly percent = signal(100);

  private emitted = false;
  private intervalId = 0;

  constructor() {
    effect(() => {
      this.endsAt();
      this.durationMs();
      this.emitted = false;
      this.tick();
      window.clearInterval(this.intervalId);
      this.intervalId = window.setInterval(() => this.tick(), 200);
    });

    this.destroyRef.onDestroy(() => window.clearInterval(this.intervalId));
  }

  private tick(): void {
    const leftMs = Math.max(0, this.endsAt() - Date.now());
    const secs = Math.ceil(leftMs / 1000);
    this.remaining.set(secs);
    const pct = Math.max(0, (leftMs / this.durationMs()) * 100);
    this.percent.set(pct);
    if (leftMs <= 0 && !this.emitted) {
      this.emitted = true;
      this.expired.emit();
    }
  }
}
