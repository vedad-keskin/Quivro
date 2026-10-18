import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '../../i18n/en';
import { EntitlementService } from '../core/entitlement.service';
import { FirebaseService } from '../core/firebase.service';
import { GameRoomService } from '../core/game-room.service';
import { LanguageService } from '../core/language.service';
import { RoomState } from '../core/room.models';
import { ServerTimeService } from '../core/server-time.service';
import { SnackbarService } from '../core/snackbar.service';
import { UpgradeDialogService } from '../shared/upgrade-dialog.service';
import { CreateRoundPage } from './create-round/create-round.page';
import { PlayPage } from './play/play.page';

for (const Page of [CreateRoundPage, PlayPage]) {
  describe(`${Page.name} custom timer`, () => {
    let fixture: ComponentFixture<CreateRoundPage | PlayPage>;
    const pro = signal(true);
    const upgrade = { show: vi.fn() };
    const rooms = {
      room: signal<RoomState | null>(null), isLive: true, hosting: () => true,
      sweepExpiredRooms: vi.fn(), watchRoom: vi.fn(async () => {}), stopWatching: vi.fn(),
      createRoom: vi.fn(async () => 'TEST'), rematch: vi.fn(async () => {}),
      nextQuestion: () => null,
    };
    const locked = () => !pro();
    const ready = () => {
      const page = fixture.componentInstance;
      return page instanceof CreateRoundPage ? page.canCreate() : page.canRematch();
    };
    const timerStage = (): HTMLElement => [...fixture.nativeElement.querySelectorAll('.stage')]
      .find((stage: any) => stage.querySelector('h2')?.textContent === en.questionTime);
    const customButton = (): HTMLButtonElement => timerStage().querySelector('.key-word')!;

    beforeEach(() => {
      vi.clearAllMocks();
      localStorage.clear();
      pro.set(true);
      vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
      rooms.room.set({
        code: 'TEST', phase: 'finished', currentIndex: 0, totalQuestions: 10,
        config: { categories: ['geography'], questionTypes: ['mcq'], roundLength: 10,
          language: 'en', scoringMode: 'standard', questionSeconds: 45, powerUpSlots: [null, null, null] },
        currentQuestion: null, players: { p1: { id: 'p1', name: 'Ana', avatar: 0, score: 0, joinedAt: 0, wins: 0 } },
        answers: {}, questionIds: [], correctIndex: null, lastWinners: [], rematchReady: { p1: true },
        createdAt: Date.now(), expiresAt: Date.now() + 60000,
      });
      localStorage.setItem('quivro.roundPrefs', JSON.stringify({ questionSeconds: 45, customTimerMode: true }));
      TestBed.configureTestingModule({
        imports: [Page],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'TEST' } } } },
          { provide: GameRoomService, useValue: rooms },
          { provide: FirebaseService, useValue: { configured: false, auth: null } },
          { provide: LanguageService, useValue: { t: () => en, lang: () => 'en' } },
          { provide: EntitlementService, useValue: {
            isPro: pro, freeThisWeek: () => 'movies',
            customTimerLocked: locked, customLengthLocked: locked, categoryLocked: locked,
            questionTypeLocked: locked, scoringModeLocked: locked, roundLengthLocked: locked,
            isWeeklyPowerUpSlot: () => false, powerUpSlotLocked: () => false,
          } },
          { provide: ServerTimeService, useValue: { nowMs: () => Date.now() } },
          { provide: SnackbarService, useValue: { error: vi.fn() } },
          { provide: UpgradeDialogService, useValue: upgrade },
        ],
      });
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      fixture = TestBed.createComponent<CreateRoundPage | PlayPage>(Page);
      fixture.detectChanges();
    });

    afterEach(() => {
      fixture?.destroy();
      localStorage.clear();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('restores a custom duration and submits 60 seconds', async () => {
      const page = fixture.componentInstance;
      expect(page.customTimerMode()).toBe(true);
      expect(page.questionSeconds()).toBe(45);
      const input = timerStage().querySelector('input')!;
      input.value = '60';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(page.questionSeconds()).toBe(60);
      expect(ready()).toBe(true);
      expect(timerStage().querySelector<HTMLButtonElement>(`button[aria-label="${en.increase}"]`)!.disabled).toBe(true);
      if (page instanceof CreateRoundPage) {
        await page.create();
        expect(rooms.createRoom).toHaveBeenCalledWith(expect.objectContaining({ questionSeconds: 60 }));
        expect(JSON.parse(localStorage.getItem('quivro.roundPrefs')!).questionSeconds).toBe(60);
      } else {
        await page.rematch();
        expect(rooms.rematch).toHaveBeenCalledWith('TEST', expect.objectContaining({ questionSeconds: 60 }));
      }
    });

    it('blocks empty, fractional and out-of-range values; accepts both boundaries', () => {
      const input = timerStage().querySelector('input')!;
      for (const value of ['', '4', '61', '15.5', '5', '60']) {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        const valid = value === '5' || value === '60';
        expect(ready()).toBe(valid);
        expect(input.getAttribute('aria-invalid')).toBe(String(!valid));
        if (!valid) expect(timerStage().textContent).toContain(en.questionTimeInvalid);
      }
    });

    it('keeps a custom round between 5 and 100 questions', () => {
      const page = fixture.componentInstance;
      const stage: HTMLElement = [...fixture.nativeElement.querySelectorAll('.stage')]
        .find((node: HTMLElement) => node.querySelector('h2')?.textContent === en.roundLength);
      (stage.querySelector('.key-word') as HTMLButtonElement).click();
      fixture.detectChanges();
      const input = stage.querySelector('input')!;
      const set = (value: string) => {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
      };
      set('150');
      expect(page.customLength()).toBe(150);
      expect(ready()).toBe(false);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(stage.textContent).toContain(en.roundLengthInvalid);
      expect(stage.querySelector<HTMLButtonElement>(`button[aria-label="${en.increase}"]`)!.disabled).toBe(true);
      page.stepCustom(-1);
      fixture.detectChanges();
      expect(page.customLength()).toBe(100);
      set('5');
      expect(page.customLength()).toBe(5);
      expect(ready()).toBe(true);
      expect(stage.querySelector<HTMLButtonElement>(`button[aria-label="${en.decrease}"]`)!.disabled).toBe(true);
      set('4');
      expect(page.customLength()).toBe(4);
      expect(ready()).toBe(false);
    });

    it('gates Custom behind Pro and resets a custom duration when Pro is lost', () => {
      const page = fixture.componentInstance;
      pro.set(false);
      fixture.detectChanges();
      expect(page.questionSeconds()).toBe(15);
      expect(page.customTimerMode()).toBe(false);
      customButton().click();
      fixture.detectChanges();
      expect(upgrade.show).toHaveBeenCalledOnce();
      expect(timerStage().querySelector('input')).toBeNull();
      for (const seconds of [10, 15, 20, 30]) {
        page.pickTimerPreset(seconds);
        expect(page.questionSeconds()).toBe(seconds);
      }
      pro.set(true);
      fixture.detectChanges();
      customButton().click();
      fixture.detectChanges();
      expect(timerStage().querySelector('input')).not.toBeNull();
    });
  });
}
