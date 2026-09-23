import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';

export type SignInResult = 'ok' | 'cancelled' | 'failed';

/** Sign-in is optional: free hosts never need an account. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseService);

  readonly user = signal<User | null>(null);
  /** False until the first auth state callback, so the UI can avoid a signed-out flash. */
  readonly ready = signal(false);
  readonly uid = computed(() => this.user()?.uid ?? null);

  constructor() {
    const auth = this.firebase.auth;
    if (!auth) {
      this.ready.set(true);
      return;
    }
    onAuthStateChanged(auth, (user) => {
      this.user.set(user);
      this.ready.set(true);
    });
  }

  /** Closing the popup reports `cancelled` so callers do not show an error for it. */
  async signIn(): Promise<SignInResult> {
    const auth = this.firebase.auth;
    if (!auth) return 'failed';
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      return 'ok';
    } catch (error) {
      const code = (error as { code?: string })?.code ?? '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled'
      ) {
        return 'cancelled';
      }
      console.error('[Quivro] Google sign-in failed', error);
      return 'failed';
    }
  }

  async signOut(): Promise<void> {
    const auth = this.firebase.auth;
    if (auth) await signOut(auth);
  }
}
