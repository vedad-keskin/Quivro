/// Active internet reachability probe.
///
/// `probeInternet()` answers "can this device actually reach the internet
/// right now?" — independent of what any SDK's connection state claims.
/// Used by the offline chip to distinguish a real outage from Firebase
/// merely idling its socket out (which it does by design after ~60s
/// without real data listeners).
///
/// The IO implementation performs an HTTPS GET against a captive-portal
/// check endpoint. On the web there is no `dart:io`; the stub always
/// reports failure, which makes callers fall back to trusting the Firebase
/// signal alone (the pre-probe behavior).
library;

export 'net_probe_io.dart' if (dart.library.js_interop) 'net_probe_web.dart';
