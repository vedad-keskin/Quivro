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
      width: 5rem;
      height: 5rem;
      padding: 3px;
      border: 3px solid var(--ink, #1a1530);
      border-radius: 50%;
      background: var(--lcd, #0d1022);
      box-shadow: 4px 4px 0 var(--ink, #1a1530);
    }
    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    path {
      fill: none;
      stroke-width: 4.6;
    }
    .bg {
      stroke: rgba(255, 255, 255, 0.12);
    }
    .fg {
      stroke: var(--bulb, #ffcc33);
      stroke-linecap: round;
      transition: stroke-dasharray 0.2s linear;
    }
    .urgent {
      animation: shake 0.5s ease-in-out infinite;
    }
    .urgent .fg {
      stroke: #ff4d6d;
    }
    span {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: var(--bulb, #ffcc33);
      font-family: var(--display, inherit);
      font-size: 1.7rem;
      text-shadow: 0 0 10px color-mix(in srgb, currentColor 55%, transparent);
    }
    .urgent span {
      color: #ff4d6d;
    }
    @keyframes shake {
      25% {
        transform: rotate(-5deg);
      }
      75% {
        transform: rotate(5deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .urgent {
        animation: none;
      }
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
