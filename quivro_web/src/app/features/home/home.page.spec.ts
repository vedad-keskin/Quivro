import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { en } from '../../../i18n/en';
import { EntitlementService } from '../../core/entitlement.service';
import { PRO_CATEGORIES, nextRotationAt, rotatingFreeCategory, rotatingFreePowerUp } from '../../core/entitlements';
import { LanguageService } from '../../core/language.service';
import { POWER_UP_CATALOG } from '../../core/room.models';
import { HomePage } from './home.page';

describe('HomePage weekly free dialog', () => {
  afterEach(() => localStorage.clear());

  it('follows unread News, stays dismissed this week, and returns next week', () => {
    localStorage.clear();
    const now = Date.UTC(2026, 9, 18, 12);
    const rotationEndsAt = signal(nextRotationAt(now));
    const freeThisWeek = signal(rotatingFreeCategory(now));
    const freePowerUpThisWeek = signal(rotatingFreePowerUp(now));
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: LanguageService, useValue: { lang: () => 'en', t: () => en } },
        { provide: EntitlementService, useValue: { rotationEndsAt, freeThisWeek, freePowerUpThisWeek } },
      ],
    });
    TestBed.overrideComponent(HomePage, {
      set: { imports: [RouterLink], schemas: [NO_ERRORS_SCHEMA] },
    });

    let fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#news-title')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.free-week-modal')).toBeNull();

    fixture.nativeElement.querySelector('.pile .x').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#news-title')).toBeNull();
    expect(fixture.nativeElement.querySelector('.free-week-modal')?.getAttribute('aria-label')).toBe(en.weeklyRotation);
    expect(fixture.nativeElement.querySelector('.weekly-lead')?.textContent).toContain(en.freeThisWeek);
    expect(fixture.nativeElement.querySelector('.weekly-items')?.textContent).toContain(en[freeThisWeek()]);
    const power = POWER_UP_CATALOG.find((item) => item.id === freePowerUpThisWeek())!;
    expect(fixture.nativeElement.querySelector('.weekly-items')?.textContent).toContain(en[power.labelKey]);
    expect(fixture.nativeElement.querySelector('.weekly-item .weekly-art img')?.getAttribute('src')).toMatch(/^\/room-icons\/.*\.png$/);
    expect(fixture.nativeElement.querySelector('.weekly-power .weekly-art img')?.getAttribute('src')).toBe(power.icon);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.free-week-modal .x'));
    for (const category of PRO_CATEGORIES) {
      freeThisWeek.set(category);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.weekly-item .weekly-art img')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.weekly-item')?.style.getPropertyValue('--accent')).toBeTruthy();
    }
    const powerAccents = POWER_UP_CATALOG.map(({ id }) => {
      freePowerUpThisWeek.set(id);
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('.weekly-power')?.style.getPropertyValue('--accent');
    });
    expect(new Set(powerAccents).size).toBe(POWER_UP_CATALOG.length);

    fixture.nativeElement.querySelector('.free-week-modal .done').click();
    fixture.detectChanges();
    expect(localStorage.getItem('quivro.free-week.seen')).toBe(String(rotationEndsAt()));
    expect(fixture.nativeElement.querySelector('.free-week-modal')).toBeNull();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.week-deck'));

    fixture.destroy();
    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();

    const nextWeek = now + 7 * 24 * 60 * 60 * 1000;
    rotationEndsAt.set(nextRotationAt(nextWeek));
    freeThisWeek.set(rotatingFreeCategory(nextWeek));
    freePowerUpThisWeek.set(rotatingFreePowerUp(nextWeek));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.free-week-modal')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.weekly-items')?.textContent).toContain(en[freeThisWeek()]);
    fixture.destroy();
  });
});
