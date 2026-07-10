// Firebase options for Quivro (web + Android from Console).
// ignore_for_file: type=lint
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      default:
        return android;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCkhdp_swfGDdYvYqBY1JjLOxgLrR2VMQc',
    appId: '1:880273668503:web:ab1f94cc0dfff06540ecd2',
    messagingSenderId: '880273668503',
    projectId: 'quivro-ca38a',
    authDomain: 'quivro-ca38a.firebaseapp.com',
    databaseURL:
        'https://quivro-ca38a-default-rtdb.europe-west1.firebasedatabase.app',
    storageBucket: 'quivro-ca38a.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAd_0oH9shwJnzj566_hutd_-vAS7UbUDY',
    appId: '1:880273668503:android:af8a1333d267232240ecd2',
    messagingSenderId: '880273668503',
    projectId: 'quivro-ca38a',
    databaseURL:
        'https://quivro-ca38a-default-rtdb.europe-west1.firebasedatabase.app',
    storageBucket: 'quivro-ca38a.firebasestorage.app',
  );

  /// Placeholder until an iOS app is registered in Firebase Console.
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCkhdp_swfGDdYvYqBY1JjLOxgLrR2VMQc',
    appId: '1:880273668503:web:ab1f94cc0dfff06540ecd2',
    messagingSenderId: '880273668503',
    projectId: 'quivro-ca38a',
    databaseURL:
        'https://quivro-ca38a-default-rtdb.europe-west1.firebasedatabase.app',
    storageBucket: 'quivro-ca38a.firebasestorage.app',
    iosBundleId: 'com.quivro.app',
  );

  static const FirebaseOptions macos = ios;
}
