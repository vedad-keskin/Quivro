import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import type { CategoryId, QuestionType } from '../../data/questions/types';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import {
  clampToFree,
  isCategoryFree,
  isQuestionTypeFree,
  isRoundLengthFree,
  isScoringModeFree,
  rotatingFreeCategory,
} from './entitlements';
import type { RoomConfig, ScoringMode } from './room.models';

const CACHE_PREFIX = 'quivro.pro.';

@Injectable({ providedIn: 'root' })
export class EntitlementService {
  private readonly firebase = inject(FirebaseService);
  private readonly auth = inject(AuthService);

  private readonly pro = signal(false);
  readonly isPro = this.pro.asReadonly();
  /** True while a Firestore lookup is in flight, for the upgrade dialog spinner. */
  readonly checking = signal(false);

  readonly freeThisWeek = computed<CategoryId>(() => rotatingFreeCategory());

  constructor() {
    effect(() => {
      const uid = this.auth.uid();
      if (!uid) {
        this.pro.set(false);
        return;
      }
      // Show the cached answer immediately, then confirm against Firestore.
      this.pro.set(localStorage.getItem(CACHE_PREFIX + uid) === 'true');
      void this.refresh();
    });
  }

  /** Re-reads the purchase record. Returns the fresh Pro state. */
  async refresh(): Promise<boolean> {
    const uid = this.auth.uid();
    const app = this.firebase.app;
    if (!uid || !app) return false;

    this.checking.set(true);
    try {
      // Lazy so the Firestore SDK never lands in the bundle of a host who never signs in.
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const snapshot = await getDoc(doc(getFirestore(app), 'purchases', uid));
      const active = snapshot.exists() && snapshot.data()['active'] === true;
      this.pro.set(active);
      localStorage.setItem(CACHE_PREFIX + uid, String(active));
      return active;
    } catch (error) {
      console.error('[Quivro] Entitlement lookup failed', error);
      return this.pro();
    } finally {
      this.checking.set(false);
    }
  }

  categoryLocked(category: CategoryId): boolean {
    return !this.pro() && !isCategoryFree(category);
  }

  questionTypeLocked(type: QuestionType): boolean {
    return !this.pro() && !isQuestionTypeFree(type);
  }

  scoringModeLocked(mode: ScoringMode): boolean {
    return !this.pro() && !isScoringModeFree(mode);
  }

  roundLengthLocked(length: number): boolean {
    return !this.pro() && !isRoundLengthFree(length);
  }

  /** Custom round length is a Pro-only control regardless of the value typed. */
  customLengthLocked(): boolean {
    return !this.pro();
  }

  enforce(config: RoomConfig): RoomConfig {
    return this.pro() ? config : clampToFree(config);
  }

  /**
   * Sends the signed-in host to Lemon Squeezy. Returns false when sign-in or
   * the store configuration is missing, so the caller can prompt instead.
   */
  openCheckout(): boolean {
    const user = this.auth.user();
    const { storeSlug, variantId } = environment.lemonSqueezy;
    if (!user || !storeSlug || storeSlug.includes('YOUR_')) return false;

    const params = new URLSearchParams({
      'checkout[custom][firebase_uid]': user.uid,
      'checkout[custom][app]': 'quivro',
      'checkout[email]': user.email ?? '',
    });
    window.location.href = `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}?${params}`;
    return true;
  }
}
