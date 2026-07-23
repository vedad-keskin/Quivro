import 'dart:async';
import 'dart:io';

/// Checks real internet reachability with a lightweight HTTPS request.
///
/// Uses Google's captive-portal check endpoint: it returns an empty
/// HTTP 204 and is built for exactly this purpose (Android itself pings it
/// to detect "wifi but no internet"). Anything other than a 204 — timeouts,
/// DNS failures, or a captive portal serving its login page — counts as
/// unreachable.
Future<bool> probeInternet({
  Duration timeout = const Duration(seconds: 3),
}) async {
  final client = HttpClient()..connectionTimeout = timeout;
  try {
    final request = await client
        .getUrl(Uri.parse('https://clients3.google.com/generate_204'))
        .timeout(timeout);
    final response = await request.close().timeout(timeout);
    await response.drain<void>().timeout(timeout);
    return response.statusCode == 204;
  } catch (_) {
    return false;
  } finally {
    client.close(force: true);
  }
}
