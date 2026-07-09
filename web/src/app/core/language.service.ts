import { Injectable, computed, signal } from '@angular/core';
import { bs } from '../../i18n/bs';
import { en, type UiStrings } from '../../i18n/en';
import type { Lang } from '../../i18n/types';

const STORAGE_KEY = 'quivro.lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly langSignal = signal<Lang>(this.readInitial());

  readonly lang = this.langSignal.asReadonly();
  readonly strings = computed<UiStrings>(() =>
    this.langSignal() === 'bs' ? bs : en,
  );

  setLang(lang: Lang): void {
    this.langSignal.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  toggle(): void {
    this.setLang(this.langSignal() === 'en' ? 'bs' : 'en');
  }

  t(): UiStrings {
    return this.strings();
  }

  private readInitial(): Lang {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'bs' ? 'bs' : 'en';
  }
}
