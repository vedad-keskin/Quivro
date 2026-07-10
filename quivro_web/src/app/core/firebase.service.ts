import { Injectable } from '@angular/core';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly configured = this.isConfigured();
  readonly app: FirebaseApp | null;
  readonly db: Database | null;

  constructor() {
    if (this.configured) {
      this.app = initializeApp(environment.firebase);
      this.db = getDatabase(this.app);
    } else {
      this.app = null;
      this.db = null;
      console.warn(
        '[Quivro] Firebase placeholders detected. Live sync disabled until environment.ts is filled.',
      );
    }
  }

  private isConfigured(): boolean {
    const { apiKey, databaseURL, projectId } = environment.firebase;
    return (
      !!apiKey &&
      !apiKey.includes('YOUR_') &&
      !!databaseURL &&
      !databaseURL.includes('YOUR_') &&
      !!projectId &&
      !projectId.includes('YOUR_')
    );
  }
}
