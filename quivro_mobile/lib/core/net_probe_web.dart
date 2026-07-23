/// Web stub: no `dart:io` here, so no active probe. Always reporting
/// "unreachable" makes the offline chip fall back to trusting Firebase's
/// `.info/connected` signal alone — the same behavior it had before the
/// probe existed.
Future<bool> probeInternet({
  Duration timeout = const Duration(seconds: 3),
}) async {
  return false;
}
