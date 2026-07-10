import { Injectable, inject } from '@angular/core';
import { onValue, ref } from 'firebase/database';
import { FirebaseService } from './firebase.service';

/**
 * Estimates Firebase RTDB server time via `.info/serverTimeOffset`
 * so host and clients share one clock for question timers.
 */
@Injectable({ providedIn: 'root' })
export class ServerTimeService {
  private readonly firebase = inject(FirebaseService);
  private offsetMs = 0;

  constructor() {
    const db = this.firebase.db;
    if (!db) return;
    onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
      const value = snap.val();
      this.offsetMs = typeof value === 'number' ? value : 0;
    });
  }

  /** Approximate server epoch ms. Falls back to local clock if offset unknown. */
  nowMs(): number {
    return Date.now() + this.offsetMs;
  }
}
