import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ServerTimeService } from '../core/server-time.service';

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
      stroke: var(--q-track);
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
  private readonly serverTime = inject(ServerTimeService);

  readonly endsAt = input.required<number>();
  readonly durationMs = input.required<number>();
  readonly expired = output<void>();

  readonly remaining = signal(0);
  readonly percent = signal(100);

  private emitted = false;
  private intervalId = 0;
  private tickAudio: HTMLAudioElement | null = null;
  private tickPlaying = false;

  constructor() {
    effect(() => {
      this.endsAt();
      this.durationMs();
      this.emitted = false;
      this.stopTickSound();
      this.tick();
      window.clearInterval(this.intervalId);
      this.intervalId = window.setInterval(() => this.tick(), 200);
    });

    this.destroyRef.onDestroy(() => {
      window.clearInterval(this.intervalId);
      this.stopTickSound();
    });
  }

  private tick(): void {
    const leftMs = Math.max(0, this.endsAt() - this.serverTime.nowMs());
    const maxSecs = Math.ceil(this.durationMs() / 1000);
    const secs = Math.min(maxSecs, Math.ceil(leftMs / 1000));
    this.remaining.set(secs);
    const pct = Math.max(0, Math.min(100, (leftMs / this.durationMs()) * 100));
    this.percent.set(pct);

    if (secs > 0 && secs <= 5) {
      this.startTickSound();
    } else {
      this.stopTickSound();
    }

    if (leftMs <= 0 && !this.emitted) {
      this.emitted = true;
      this.stopTickSound();
      this.expired.emit();
    }
  }

  private startTickSound(): void {
    if (this.tickPlaying) return;
    try {
      if (!this.tickAudio) {
        this.tickAudio = new Audio('/sounds/tick_tick.mp3');
      }
      this.tickAudio.currentTime = 0;
      this.tickPlaying = true;
      void this.tickAudio.play().catch(() => {
        this.tickPlaying = false;
      });
    } catch {
      this.tickPlaying = false;
    }
  }

  private stopTickSound(): void {
    this.tickPlaying = false;
    if (!this.tickAudio) return;
    try {
      this.tickAudio.pause();
      this.tickAudio.currentTime = 0;
    } catch {
      /* Ignore audio failures. */
    }
  }
}
