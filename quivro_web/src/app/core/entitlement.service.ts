import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import type { CategoryId, QuestionType } from '../../data/questions/types';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import {
  clampToFree,
  isCategoryFree,
  isPowerUpFree,
  isQuestionTypeFree,
  isRoundLengthFree,
  isScoringModeFree,
  nextRotationAt,
  rotatingFreeCategory,
} from './entitlements';
import type { PowerUpSlots, RoomConfig, ScoringMode } from './room.models';

const CACHE_PREFIX = 'quivro.pro.';

function purchaseIso(raw: unknown): string | null {
  if (raw == null) return null;
  const toDate =
    typeof raw === 'object' && raw !== null && 'toDate' in raw
      ? (raw as { toDate: unknown }).toDate
      : null;
  const date = typeof toDate === 'function' ? (toDate as () => Date).call(raw) : new Date(String(raw));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

@Injectable({ providedIn: 'root' })
export class EntitlementService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly firebase = inject(FirebaseService);
  private readonly auth = inject(AuthService);
  private readonly rotationNow = signal(Date.now());
  private rotationTimer?: ReturnType<typeof setTimeout>;

  private readonly pro = signal(false);
  readonly isPro = this.pro.asReadonly();
  /** ISO time from `purchases/{uid}.purchaseDate`, or null when not Pro. */
  readonly purchaseDate = signal<string | null>(null);
  /** True while a Firestore lookup is in flight, for the upgrade dialog spinner. */
  readonly checking = signal(false);

  readonly freeThisWeek = computed<CategoryId>(() => rotatingFreeCategory(this.rotationNow()));

  constructor() {
    this.scheduleRotation();
    this.destroyRef.onDestroy(() => clearTimeout(this.rotationTimer));
    effect(() => {
      const uid = this.auth.uid();
      if (!uid) {
        this.pro.set(false);
        this.purchaseDate.set(null);
        return;
      }
      // Show the cached answer immediately, then confirm against Firestore.
      this.pro.set(localStorage.getItem(CACHE_PREFIX + uid) === 'true');
      void this.refresh();
    });
  }

  private scheduleRotation(): void {
    const now = Date.now();
    this.rotationTimer = setTimeout(() => {
      this.rotationNow.set(Date.now());
      this.scheduleRotation();
    }, nextRotationAt(now) - now);
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
      const data = snapshot.exists() ? snapshot.data() : null;
      const active = data?.['active'] === true;
      this.pro.set(active);
      this.purchaseDate.set(active ? purchaseIso(data?.['purchaseDate']) : null);
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
    return !this.pro() && !isCategoryFree(category, this.rotationNow());
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

  customTimerLocked(): boolean {
    return !this.pro();
  }

  isWeeklyPowerUpSlot(slots: PowerUpSlots, index: number): boolean {
    const slot = slots[index];
    return !!slot && isPowerUpFree(slot, this.rotationNow());
  }

  powerUpSlotLocked(slots: PowerUpSlots, index: number): boolean {
    return !this.pro() && !!slots[index] && !this.isWeeklyPowerUpSlot(slots, index);
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
