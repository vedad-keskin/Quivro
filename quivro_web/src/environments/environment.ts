export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyCkhdp_swfGDdYvYqBY1JjLOxgLrR2VMQc',
    authDomain: 'quivro-ca38a.firebaseapp.com',
    databaseURL: 'https://quivro-ca38a-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'quivro-ca38a',
    storageBucket: 'quivro-ca38a.firebasestorage.app',
    messagingSenderId: '880273668503',
    appId: '1:880273668503:web:ab1f94cc0dfff06540ecd2',
  },
  lemonSqueezy: {
    storeSlug: 'nightfall-studio',
    // Test-mode variant, so `ng serve` checks out against the sandbox and takes the
    // 4242 4242 4242 4242 card. Production uses the live variant in environment.prod.ts,
    // which angular.json swaps in via fileReplacements. The two ids differ on purpose.
    variantId: '184b1101-86a1-4c55-8119-2f8cbb4856f2',
  },
};
