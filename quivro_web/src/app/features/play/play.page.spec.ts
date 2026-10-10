import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '../../../i18n/en';
import { EntitlementService } from '../../core/entitlement.service';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import { RoomState } from '../../core/room.models';
import { ServerTimeService } from '../../core/server-time.service';
import { SnackbarService } from '../../core/snackbar.service';
import { UpgradeDialogService } from '../../shared/upgrade-dialog.service';
import { PlayPage } from './play.page';

describe('Double It presentation', () => {
  const room = signal<RoomState | null>(null);
  const play = vi.fn((_src: string) => Promise.resolve());
  let fixture: ComponentFixture<PlayPage>;
  let state: RoomState;

  function render() {
    room.set({ ...state });
    fixture.detectChanges();
  }
  function usePower(id: string, name: string) {
    const target = String(state.currentIndex + 1);
    state.questionBoosts = { ...state.questionBoosts, [target]: {
      ...state.questionBoosts?.[target],
      [id]: { name, roundId: state.roundId!, sourceIndex: state.currentIndex, slot: 0, at: Date.now() },
    } };
    render();
  }
  function settle(ms = 250) {
    vi.advanceTimersByTime(ms);
    fixture.detectChanges();
  }
  const element = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('Audio', class {
      constructor(readonly src: string) {}
      readyState = 1;
      duration = 4;
      play = () => play(this.src);
      pause = vi.fn();
    });
    room.set(null);
    play.mockClear();
    state = {
      code: 'TEST', roundId: 'round-a', phase: 'question', currentIndex: 0, totalQuestions: 3,
      config: { categories: ['movies'], questionTypes: ['mcq'], roundLength: 3, language: 'en',
        scoringMode: 'standard', questionSeconds: 15, powerUpSlots: ['double_it', null, null] },
      currentQuestion: { id: 'q1', type: 'mcq', category: 'movies', difficulty: 'easy',
        prompt: 'Question?', options: ['A', 'B', 'C', 'D'], answerOpensAt: 0, endsAt: 15000,
        durationMs: 15000, index: 0, total: 3, multiplier: 1 },
      players: {}, answers: {}, questionIds: ['q1', 'q2', 'q3'], correctIndex: null,
      lastWinners: [], rematchReady: {}, createdAt: 0, expiresAt: 999999,
    };
    TestBed.configureTestingModule({
      imports: [PlayPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'TEST' } } } },
        { provide: GameRoomService, useValue: {
          room, hosting: () => false, watchRoom: () => Promise.resolve(), stopWatching: vi.fn(),
          nextQuestion: () => state.currentIndex < 2 ? { type: 'mcq', category: 'food', difficulty: 'medium' } : null,
        } },
        { provide: LanguageService, useValue: { t: () => en } },
        { provide: EntitlementService, useValue: { isPro: () => true } },
        { provide: ServerTimeService, useValue: { nowMs: () => 0 } },
        { provide: SnackbarService, useValue: {} },
        { provide: UpgradeDialogService, useValue: {} },
      ],
    });
    fixture = TestBed.createComponent(PlayPage);
    fixture.detectChanges();
    render();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('groups rapid uses without a notice row, then carries the badge into the next question', () => {
    expect(element('.badge')).toBeNull();
    expect(element('.qstage > .meta + .track')).not.toBeNull();
    usePower('a', 'Alex');
    settle(100);
    usePower('b', 'Bea');
    settle(150);
    expect(fixture.componentInstance.nextBoostPulse()).toBe(1);
    expect(element('.next-meta.boosted .badge')?.textContent).toContain('3 pts');
    const nextCharge = element('.next-meta app-question-charge');
    expect(nextCharge?.querySelector('.activate')).not.toBeNull();
    render();
    expect(element('.next-meta app-question-charge')).toBe(nextCharge);
    expect(element('.boost-notice')).toBeNull();
    expect(element('.qstage > .meta + .track')).not.toBeNull();
    expect(play).toHaveBeenCalledTimes(1);

    state.currentIndex = 1;
    state.currentQuestion = { ...state.currentQuestion!, id: 'q2', index: 1, multiplier: 3 };
    render();
    expect(element('.meta-info.boosted .badge')?.textContent).toContain('3 pts');
    expect(element('.next-meta .badge')).toBeNull();
    expect(element('.next-meta app-question-charge')).toBeNull();
    expect(element('.meta-info app-question-charge .activate')).not.toBeNull();
    expect(element('.boost-sweep')).toBeNull();
    expect(play).toHaveBeenCalledTimes(1);

    state.config = { ...state.config, scoringMode: 'timed' };
    usePower('c', 'Cora');
    settle();
    expect(element('.next-meta .badge')?.textContent).toContain('×2');
    expect(element('.meta-info .badge')?.textContent).toContain('×3');
    expect(element('.next-meta app-question-charge .activate')).not.toBeNull();
    expect(element('.boost-notice')).toBeNull();
  });

  it('cancels a pending batch on question change', () => {
    usePower('a', 'Alex');
    state.currentIndex = 2;
    state.currentQuestion = { ...state.currentQuestion!, index: 2, multiplier: 1 };
    render();
    settle();
    expect(element('.next-meta')).toBeNull();
    expect(play).not.toHaveBeenCalled();
    expect(fixture.componentInstance.nextBoostPulse()).toBe(0);
  });

  it('activates each boosted current question once, survives reveal, and clears on an unboosted question', () => {
    expect(element('app-question-charge')).toBeNull();
    usePower('a', 'Alex');
    settle();
    expect(element('.meta-info app-question-charge')).toBeNull();
    expect(element('.next-meta app-question-charge')).not.toBeNull();

    state.currentIndex = 1;
    state.currentQuestion = { ...state.currentQuestion!, index: 1, multiplier: 2 };
    render();
    const first = element('app-question-charge');
    expect(first?.getAttribute('aria-hidden')).toBe('true');
    expect(first?.querySelector('.activate')).not.toBeNull();
    render();
    expect(element('app-question-charge')).toBe(first);
    state.phase = 'reveal';
    render();
    expect(element('app-question-charge')).toBe(first);

    state.phase = 'question';
    state.currentIndex = 2;
    state.currentQuestion = { ...state.currentQuestion!, index: 2, multiplier: 3 };
    render();
    expect(element('app-question-charge')).not.toBe(first);
    expect(element('app-question-charge .activate')).not.toBeNull();
    expect(element('.meta-info .badge')?.textContent).toContain('3 pts');

    state.currentIndex = 3;
    state.currentQuestion = { ...state.currentQuestion!, index: 3, multiplier: 1 };
    render();
    expect(element('app-question-charge')).toBeNull();
  });

  it('restores charge outlines without activation on a fresh snapshot or hidden-tab question change', () => {
    room.set(null);
    fixture.detectChanges();
    state.currentQuestion = { ...state.currentQuestion!, multiplier: 2 };
    render();
    expect(element('app-question-charge')).not.toBeNull();
    expect(element('app-question-charge .activate')).toBeNull();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    state.currentIndex = 1;
    state.currentQuestion = { ...state.currentQuestion!, index: 1, multiplier: 2 };
    render();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    render();
    expect(element('app-question-charge')).not.toBeNull();
    expect(element('app-question-charge .activate')).toBeNull();
  });

  it('restores boosted state silently and cancels pending effects on teardown', () => {
    state.roundId = 'round-b';
    usePower('a', 'Alex');
    settle();
    expect(element('.next-meta.boosted .badge')?.textContent).toContain('2 pts');
    expect(fixture.componentInstance.nextBoostPulse()).toBe(0);
    expect(play).not.toHaveBeenCalled();
    expect(element('.next-meta app-question-charge')).not.toBeNull();
    expect(element('.next-meta app-question-charge .activate')).toBeNull();
    usePower('b', 'Bea');
    fixture.destroy();
    vi.advanceTimersByTime(250);
    expect(play).not.toHaveBeenCalled();
    expect(fixture.componentInstance.nextBoostPulse()).toBe(0);
  });

  it('keeps late boosts visible but silent, and never replays hidden-tab activity', () => {
    state.currentQuestion = { ...state.currentQuestion!, endsAt: 4000 };
    usePower('a', 'Alex');
    settle();
    expect(element('.next-meta .badge')?.textContent).toContain('2 pts');
    expect(play.mock.calls).toEqual([['/sounds/tick_tick.mp3']]);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    usePower('b', 'Bea');
    settle();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    render();
    settle();
    expect(fixture.componentInstance.nextBoostPulse()).toBe(1);
    expect(element('.next-meta .badge')?.textContent).toContain('3 pts');
    expect(play.mock.calls).toEqual([['/sounds/tick_tick.mp3']]);
    room.set(null);
    fixture.detectChanges();
    expect(fixture.componentInstance.nextBoostPulse()).toBe(0);
  });
});
