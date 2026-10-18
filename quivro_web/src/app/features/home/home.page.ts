import { Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CategoryId } from '../../../data/questions/types';
import type { UiStrings } from '../../../i18n/en';
import type { LocalizedString } from '../../../i18n/types';
import { EntitlementService } from '../../core/entitlement.service';
import { LanguageService } from '../../core/language.service';
import { POWER_UP_CATALOG } from '../../core/room.models';
import { CATEGORY_ACCENT } from '../../shared/round-accents';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';
import { NEWS, type NewsCard, markSeen, readSeen, unread } from './news';

const FREE_WEEK_SEEN_KEY = 'quivro.free-week.seen';
const WEEKLY_CATEGORY_ICONS: Partial<Record<CategoryId, string>> = {
  technology: '/room-icons/tech.png',
  famous: '/room-icons/fam.png',
  movies: '/room-icons/movtv.png',
  cartoons: '/room-icons/cartoons.png',
  food: '/room-icons/food.png',
};

interface Slide {
  dropId: string;
  card: NewsCard;
}

interface Layer {
  slide: Slide;
  back: number;
  front: boolean;
  n: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, SettingsChips, StudioFooter],
  template: `
    <div class="q-page q-show home">
      <header>
        <app-settings-chips />
      </header>

      <section class="hero">
        <div class="stage spotlight">
          <span class="spark s1" aria-hidden="true"></span>
          <span class="spark s2" aria-hidden="true"></span>
          <span class="spark s3" aria-hidden="true"></span>
          <img class="logo wordmark" src="/logo/logo.png" alt="Quivro" />
          <p class="tagline">{{ lang.t().tagline }}</p>
          <button
            #weekTrigger
            type="button"
            class="deck week-deck"
            (click)="openWeek()"
            [attr.aria-expanded]="weekOpen()"
            aria-haspopup="dialog"
            [attr.aria-label]="lang.t().weeklyRotation"
          >
            <img src="/brand/free_week.webp" alt="" />
          </button>
          @if (hasNews) {
            <button
              type="button"
              class="deck"
              (click)="openNews()"
              [attr.aria-expanded]="newsOpen()"
              [attr.aria-label]="lang.t().news"
            >
              <svg class="mark" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M2.2 10.1c0-.7.5-1.3 1.2-1.4l8.4-1.4c.3 0 .5.2.5.5v8.4c0 .3-.2.5-.5.5l-8.4-1.4c-.7-.1-1.2-.7-1.2-1.4v-3.8z"
                />
                <path fill="currentColor" d="M13.2 6.4 20 3.6c.6-.2 1.2.2 1.2.8v15.2c0 .6-.6 1-1.2.8l-6.8-2.8V6.4z" />
                <path
                  fill="currentColor"
                  d="M5.6 15.4 6.6 19c.2.7.8 1.1 1.5 1.1h.4c.6 0 .9-.6.7-1.1l-1.2-3.8-2.4.2z"
                />
                <path
                  fill="currentColor"
                  d="M22.2 9.1a.8.8 0 0 1 1.1.4 7 7 0 0 1 0 5 .8.8 0 0 1-1.5-.6 5.4 5.4 0 0 0 0-3.8.8.8 0 0 1 .4-1z"
                />
              </svg>
            </button>
          }
        </div>

        <a routerLink="/create" class="go start">
          {{ lang.t().createRound }}
          <span class="go-arrow" aria-hidden="true">▶</span>
        </a>

        <section class="how">
          <h2>{{ lang.t().howItWorks }}</h2>
          <ol class="steps">
            @for (s of steps; track s.title; let i = $index) {
              <li class="stage step-card" [style.--accent]="s.accent">
                <span class="step" aria-hidden="true">{{ i + 1 }}</span>
                <strong>{{ lang.t()[s.title] }}</strong>
                <span>{{ lang.t()[s.body] }}</span>
              </li>
            }
          </ol>
        </section>
      </section>

      <app-studio-footer />

      @if (newsOpen() && current()) {
        <div class="modal-backdrop" (click)="closeNews()">
          <div
            class="pile"
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-title"
            (click)="$event.stopPropagation()"
          >
            @for (layer of layers(); track layer.n) {
              <article
                class="slab"
                [class.front]="layer.front"
                [class.leave]="layer.front && motion() === 'next'"
                [class.enter]="layer.front && motion() === 'prev'"
                [style.--accent]="layer.slide.card.accent"
                [style.--back]="layer.back"
                [attr.aria-hidden]="layer.front ? null : 'true'"
              >
                @if (layer.front) {
                  <span class="step" aria-hidden="true">{{ layer.n }}</span>
                  <p class="kicker">{{ lang.t().newsWhatsNew }}</p>
                  <button type="button" class="x" [attr.aria-label]="lang.t().close" (click)="closeNews()">
                    ×
                  </button>
                  @if (layer.slide.card.image) {
                    <img [src]="layer.slide.card.image" alt="" />
                  }
                  <strong id="news-title">{{ text(layer.slide.card.title) }}</strong>
                  <span class="blurb">{{ text(layer.slide.card.body) }}</span>
                  <div class="card-nav">
                    <button type="button" class="key-btn" (click)="step(-1)" [disabled]="index() === 0 || !!motion()">
                      {{ lang.t().newsPrev }}
                    </button>
                    @if (index() === slides().length - 1) {
                      <button type="button" class="key-btn done" (click)="finish()" [disabled]="!!motion()">
                        {{ lang.t().newsGotIt }}
                      </button>
                    } @else {
                      <button type="button" class="key-btn done" (click)="step(1)" [disabled]="!!motion()">
                        {{ lang.t().newsNext }}
                      </button>
                    }
                  </div>
                }
              </article>
            }
          </div>
        </div>
      }
      @if (weekOpen()) {
        <div class="modal-backdrop" (click)="closeWeek()">
          <section
            class="modal free-week-modal"
            role="dialog"
            aria-modal="true"
            [attr.aria-label]="lang.t().weeklyRotation"
            (click)="$event.stopPropagation()"
          >
            <button #weekClose type="button" class="x" [attr.aria-label]="lang.t().close" (click)="closeWeek()">×</button>
            <img class="weekly-badge" src="/brand/free_week.webp" alt="" />
            <p class="weekly-lead">{{ lang.t().freeThisWeek }}</p>
            <div class="weekly-items">
              <div class="weekly-item" [style.--accent]="categoryAccent[ent.freeThisWeek()]">
                <span class="weekly-kind">{{ lang.t().weeklyCategory }}</span>
                <span class="weekly-art">
                  @if (weeklyCategoryIcon(); as icon) {
                    <img [src]="icon" alt="" />
                  }
                </span>
                <strong>{{ lang.t()[ent.freeThisWeek()] }}</strong>
              </div>
              @if (weeklyPower(); as power) {
                <div class="weekly-item weekly-power" style="--accent: var(--q-orange)">
                  <span class="weekly-kind">{{ lang.t().weeklyPowerUp }}</span>
                  <span class="weekly-art"><img [src]="power.icon" alt="" /></span>
                  <strong>{{ lang.t()[power.labelKey] }}</strong>
                </div>
              }
            </div>
            <button #weekDone type="button" class="key-btn done" (click)="closeWeek()">{{ lang.t().newsGotIt }}</button>
          </section>
        </div>
      }
    </div>
  `,
  styles: `
    .home {
      display: grid;
      /* Header, hero, footer. The 1fr row lets the hero absorb the slack so the
         footer stays on the bottom edge instead of below the fold. */
      grid-template-rows: auto 1fr auto;
      gap: 1rem;
    }
    header {
      display: flex;
      justify-content: flex-end;
    }
    .hero {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      display: grid;
      align-content: center;
      justify-items: center;
      gap: 2.4rem;
      text-align: center;
    }
    .spotlight {
      width: min(560px, 100%);
      display: grid;
      justify-items: center;
      padding: 3rem 1.5rem 3.6rem;
    }
    .logo {
      width: min(400px, 78vw);
    }
    .tagline {
      position: absolute;
      left: 50%;
      bottom: -1.3rem;
      margin: 0;
      padding: 0.55rem 1.1rem;
      width: max-content;
      max-width: 90%;
      border: 3px solid var(--ink);
      border-radius: 12px;
      background: var(--bulb);
      color: #1a1530;
      box-shadow: var(--hit);
      font-size: clamp(0.95rem, 2vw, 1.15rem);
      font-weight: 900;
      transform: translateX(-50%) rotate(-2deg);
    }
    .start {
      max-width: 420px;
      margin-top: 0.6rem;
    }
    .deck {
      position: absolute;
      z-index: 4;
      right: -3.1rem;
      bottom: 0.35rem;
      width: 56px;
      height: 56px;
      display: grid;
      place-items: center;
      margin: 0;
      padding: 0;
      border: 3px solid var(--ink);
      border-radius: 50%;
      background: var(--bulb);
      color: #1a1530;
      box-shadow: 2px 2px 0 var(--ink);
      transform: rotate(-8deg);
      cursor: pointer;
    }
    .week-deck {
      left: -3.5rem;
      right: auto;
      width: 68px;
      height: 68px;
      border: 0;
      background: transparent;
      box-shadow: none;
      transform: rotate(8deg);
    }
    .week-deck img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(2px 5px 1px var(--ink)) drop-shadow(0 0 8px rgba(31, 153, 255, 0.25));
    }
    .mark {
      display: block;
    }
    .deck:hover {
      transform: translateY(-2px) rotate(-8deg);
    }
    .week-deck:hover {
      transform: translateY(-2px) rotate(8deg);
    }
    .deck:active {
      transform: translateY(2px) rotate(-8deg);
      box-shadow: 0 0 0 var(--ink);
    }
    .week-deck:active {
      transform: translateY(2px) rotate(8deg);
      box-shadow: none;
    }
    .deck:focus-visible {
      outline: 3px solid var(--q-blue);
      outline-offset: 4px;
    }
    .how {
      width: 100%;
      display: grid;
      gap: 1.6rem;
    }
    .how h2 {
      margin: 0;
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.35rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--q-navy);
    }
    .steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.6rem;
    }
    .step-card {
      display: grid;
      gap: 0.3rem;
      align-content: start;
      padding-top: 1.4rem;
      text-align: left;
      background: color-mix(in srgb, var(--accent) 16%, var(--q-card));
      box-shadow: var(--hit);
      transform: rotate(-1deg);
    }
    .step-card:nth-child(even) {
      transform: rotate(1deg);
    }
    .step-card .step {
      background: var(--accent);
    }
    .step-card strong {
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.15rem;
      color: var(--q-navy);
    }
    .step-card span:not(.step) {
      font-size: 0.85rem;
      font-weight: 700;
      line-height: 1.35;
      color: var(--q-muted);
    }
    .pile {
      position: relative;
      width: min(420px, calc(100vw - 4.5rem));
      margin: 0 1.6rem 1.4rem 0;
    }
    .slab {
      position: absolute;
      inset: 0;
      border: 3px solid var(--ink);
      border-radius: 18px;
      background: color-mix(in srgb, var(--accent) 24%, var(--q-card));
      box-shadow: var(--hit);
      z-index: calc(4 - var(--back));
      transform: translate(calc(var(--back) * 14px), calc(var(--back) * 12px))
        rotate(calc(var(--back) * 2deg));
      transition:
        transform 240ms ease,
        opacity 240ms ease;
    }
    .slab.front {
      position: relative;
      z-index: 5;
      display: grid;
      align-content: start;
      justify-items: center;
      gap: 0.4rem;
      padding: 1.7rem 1.15rem 1rem;
      text-align: center;
      transform: rotate(-2deg);
    }
    .slab.front.leave {
      z-index: 6;
      transform: translateX(-115%) rotate(-8deg);
      opacity: 0;
      pointer-events: none;
    }
    .slab.front.enter {
      z-index: 6;
      animation: deal-in 240ms ease;
    }
    @keyframes deal-in {
      from {
        transform: translateX(-115%) rotate(-8deg);
        opacity: 0;
      }
      to {
        transform: rotate(-2deg);
        opacity: 1;
      }
    }
    .slab.front .step {
      background: var(--accent);
    }
    .slab.front img {
      width: 11rem;
      height: 11rem;
      object-fit: contain;
    }
    .kicker {
      position: absolute;
      top: 0.85rem;
      left: 2.15rem;
      z-index: 2;
      margin: 0;
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.05rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-align: left;
      color: var(--q-navy);
    }
    .slab.front strong {
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.7rem;
      color: var(--q-navy);
    }
    .blurb {
      max-width: 22rem;
      font-size: 0.95rem;
      font-weight: 700;
      line-height: 1.35;
      color: var(--q-muted);
    }
    .card-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-top: 0.45rem;
    }
    .key-btn.done {
      background: var(--bulb);
      color: #1a1530;
      font-family: var(--display);
      font-weight: 400;
      letter-spacing: 0.03em;
    }
    .x {
      position: absolute;
      top: 0.7rem;
      right: 0.7rem;
      z-index: 6;
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border: 3px solid var(--ink);
      border-radius: 9px;
      background: var(--q-card);
      color: var(--q-navy);
      font-size: 1.3rem;
      font-weight: 900;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 3px 0 var(--ink);
    }
    .free-week-modal {
      width: min(500px, 100%);
      justify-items: center;
      max-height: calc(100dvh - 2rem);
      overflow-y: auto;
      padding: 1.5rem;
      text-align: center;
    }
    .weekly-badge {
      width: 72px;
      height: 72px;
      object-fit: contain;
    }
    .weekly-lead {
      margin: 0;
      font-family: var(--display);
      font-size: 1.55rem;
      line-height: 1.1;
      color: var(--q-navy);
    }
    .weekly-items {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.9rem;
      width: 100%;
      padding: 0 0.3rem 0.4rem 0;
    }
    .weekly-item {
      min-width: 0;
      display: grid;
      justify-items: center;
      align-content: start;
      gap: 0.7rem;
      padding: 0.8rem 0.6rem 1rem;
      border: 3px solid var(--ink);
      border-radius: 16px;
      background: color-mix(in srgb, var(--accent) 18%, var(--q-card));
      box-shadow: 4px 4px 0 var(--ink);
      transform: rotate(-1deg);
    }
    .weekly-power {
      transform: rotate(1deg);
    }
    .weekly-kind {
      justify-self: start;
      padding: 0.25rem 0.5rem;
      border: 2px solid var(--ink);
      border-radius: 8px;
      background: color-mix(in srgb, var(--accent) 28%, var(--q-card));
      color: var(--q-navy);
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .weekly-art {
      width: min(120px, 100%);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border: 3px solid var(--ink);
      border-radius: 16px;
      background: color-mix(in srgb, var(--accent) 40%, var(--q-card));
      box-shadow: inset 0 4px 10px rgba(255, 255, 255, 0.23), 0 4px 0 var(--ink);
    }
    .weekly-power .weekly-art {
      background: var(--lcd);
      box-shadow: inset 0 5px 10px rgba(0, 0, 0, 0.4), 0 4px 0 var(--ink);
    }
    .weekly-art img {
      width: 95%;
      height: 95%;
      object-fit: contain;
    }
    .weekly-item strong {
      display: grid;
      align-items: center;
      min-height: 2.5rem;
      font-family: var(--display);
      font-size: 1.25rem;
      font-weight: 400;
      line-height: 1.08;
      color: var(--q-navy);
    }
    .free-week-modal .done {
      min-width: 150px;
      background: var(--bulb);
      color: #1a1530;
    }
    @media (max-width: 720px) {
      .steps {
        grid-template-columns: 1fr;
      }
      .deck {
        right: 0;
        bottom: auto;
        top: calc(100% + 1.5rem);
      }
      .week-deck {
        left: 0;
        right: auto;
      }
      .start {
        margin-top: 4.2rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .step-card,
      .step-card:nth-child(even),
      .deck,
      .deck:hover,
      .deck:active,
      .slab.front {
        transform: none;
      }
      .slab:not(.front) {
        transform: translate(calc(var(--back) * 14px), calc(var(--back) * 12px));
      }
      .slab,
      .slab.front.enter {
        transition: none;
        animation: none;
      }
    }
  `,
})
export class HomePage {
  readonly lang = inject(LanguageService);
  readonly ent = inject(EntitlementService);
  readonly categoryAccent = CATEGORY_ACCENT;
  readonly hasNews = NEWS.length > 0;
  private readonly seen = signal(readSeen());
  private readonly showAll = signal(false);
  readonly index = signal(0);
  readonly motion = signal<'next' | 'prev' | null>(null);
  private dealTimer = 0;
  readonly newsOpen = signal(unread(NEWS, readSeen()).length > 0);
  readonly slides = computed(() => slidesFor(this.showAll() ? NEWS : unread(NEWS, this.seen())));
  readonly current = computed(() => this.slides()[this.index()] ?? null);
  readonly layers = computed(() => pile(this.slides(), this.index()));
  private readonly seenWeek = signal(readSeenWeek());
  readonly weekOpen = signal(false);
  readonly weeklyCategoryIcon = computed(() => WEEKLY_CATEGORY_ICONS[this.ent.freeThisWeek()]);
  private readonly weekTrigger = viewChild<ElementRef<HTMLButtonElement>>('weekTrigger');
  private readonly weekClose = viewChild<ElementRef<HTMLButtonElement>>('weekClose');
  private readonly weekDone = viewChild<ElementRef<HTMLButtonElement>>('weekDone');
  readonly weeklyPower = computed(() =>
    POWER_UP_CATALOG.find((power) => power.id === this.ent.freePowerUpThisWeek()),
  );

  constructor() {
    effect(() => {
      const week = String(this.ent.rotationEndsAt());
      if (!this.newsOpen() && this.seenWeek() !== week) this.weekOpen.set(true);
    });
    effect(() => {
      if (this.weekOpen()) this.weekClose()?.nativeElement.focus();
    });
  }

  text(value: LocalizedString): string {
    return value[this.lang.lang()];
  }

  openNews(): void {
    if (this.newsOpen()) return;
    this.showAll.set(true);
    this.index.set(0);
    if (this.slides().length) this.newsOpen.set(true);
  }

  /** Same leave as Next, then close. The × button still closes at once. */
  finish(): void {
    if (this.motion()) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.closeNews();
      return;
    }
    this.motion.set('next');
    this.dealTimer = window.setTimeout(() => this.closeNews(), 240);
  }

  closeNews(): void {
    window.clearTimeout(this.dealTimer);
    this.motion.set(null);
    const ids = this.slides().map((slide) => slide.dropId);
    this.seen.set(markSeen(ids));
    this.showAll.set(false);
    this.index.set(0);
    this.newsOpen.set(false);
  }

  openWeek(): void {
    this.weekOpen.set(true);
  }

  closeWeek(): void {
    const week = String(this.ent.rotationEndsAt());
    try {
      localStorage.setItem(FREE_WEEK_SEEN_KEY, week);
    } catch {
      // Keep it dismissed for this visit if browser storage is unavailable.
    }
    this.seenWeek.set(week);
    this.weekOpen.set(false);
    this.weekTrigger()?.nativeElement.focus();
  }

  step(delta: number): void {
    if (this.motion()) return;
    const next = this.index() + delta;
    if (next < 0) return;
    if (next >= this.slides().length) {
      this.finish();
      return;
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.index.set(next);
      return;
    }
    if (delta > 0) {
      this.motion.set('next');
      this.dealTimer = window.setTimeout(() => {
        this.index.set(next);
        this.motion.set(null);
      }, 240);
      return;
    }
    this.index.set(next);
    this.motion.set('prev');
    this.dealTimer = window.setTimeout(() => this.motion.set(null), 240);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (this.newsOpen()) {
      if (event.key === 'Escape') this.closeNews();
      else if (event.key === 'ArrowRight') this.step(1);
      else if (event.key === 'ArrowLeft') this.step(-1);
    } else if (this.weekOpen()) {
      if (event.key === 'Escape') this.closeWeek();
      else if (event.key === 'Tab') {
        const close = this.weekClose()?.nativeElement;
        const done = this.weekDone()?.nativeElement;
        if (event.shiftKey && document.activeElement !== done) {
          event.preventDefault();
          done?.focus();
        } else if (!event.shiftKey && document.activeElement !== close) {
          event.preventDefault();
          close?.focus();
        }
      }
    }
  }

  readonly steps: { title: keyof UiStrings; body: keyof UiStrings; accent: string }[] = [
    { title: 'stepHostTitle', body: 'stepHostBody', accent: 'var(--q-cyan)' },
    { title: 'stepJoinTitle', body: 'stepJoinBody', accent: 'var(--q-orange)' },
    { title: 'stepPlayTitle', body: 'stepPlayBody', accent: 'var(--q-pink)' },
  ];
}

function readSeenWeek(): string | null {
  try {
    return localStorage.getItem(FREE_WEEK_SEEN_KEY);
  } catch {
    return null;
  }
}

function slidesFor(drops: readonly (typeof NEWS)[number][]): Slide[] {
  return drops.flatMap((drop) =>
    drop.cards.map((card) => ({
      dropId: drop.id,
      card,
    })),
  );
}

/** Cards still ahead peek behind. Passed cards are not wrapped to the back. */
function pile(slides: readonly Slide[], index: number): Layer[] {
  if (!slides.length || !slides[index]) return [];
  const ahead = slides
    .map((slide, i) => ({ slide, i, n: i + 1 }))
    .filter((layer) => layer.i > index && layer.i <= index + 2)
    .sort((a, b) => b.i - a.i)
    .map((layer) => ({
      slide: layer.slide,
      back: layer.i - index,
      front: false,
      n: layer.n,
    }));
  return [...ahead, { slide: slides[index], back: 0, front: true, n: index + 1 }];
}
