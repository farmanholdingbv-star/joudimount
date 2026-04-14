import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class Api {
  static void _clearSessionIfUnauthorized(int statusCode) {
    if (statusCode != 401) return;
    SharedPreferences.getInstance().then((prefs) async {
      await prefs.remove('token');
      await prefs.remove('user');
    });
  }

  /// Optional override: use a **real** LAN IP, e.g.
  /// `flutter run --dart-define=API_BASE=http://192.168.1.10:4000`
  /// (do not use the words `your_pc_lan_ip` — that was documentation, not a hostname).
  static const String _apiBaseFromEnv = String.fromEnvironment('API_BASE');

  static bool _isInvalidApiBasePlaceholder(String raw) {
    final s = raw.trim().toLowerCase();
    if (s.isEmpty) return true;
    // Common mistake: copying doc text instead of an actual IP.
    if (s.contains('your_pc') || s.contains('<') || s.contains('>')) return true;
    final uri = Uri.tryParse(raw.trim());
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) return true;
    return false;
  }

  /// API origin. On Android emulator, `localhost` is the device — use host alias [10.0.2.2].
  /// On a **physical phone**, use [API_BASE] with your PC’s real LAN IP (e.g. 192.168.x.x), or
  /// `adb reverse tcp:4000 tcp:4000` and `API_BASE=http://127.0.0.1:4000`.
  static String get baseUrl {
    if (_apiBaseFromEnv.isNotEmpty && !_isInvalidApiBasePlaceholder(_apiBaseFromEnv)) {
      final t = _apiBaseFromEnv.trim();
      return t.endsWith('/') ? t.substring(0, t.length - 1) : t;
    }
    const port = 4000;
    if (kIsWeb) return 'http://192.168.1.104:$port';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://192.168.1.104:$port';
    }
    return 'http://192.168.1.104:$port';
  }

  static Future<Map<String, String>> _authHeaders({bool jsonBody = true}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final headers = <String, String>{};
    if (jsonBody) headers['Content-Type'] = 'application/json';
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<dynamic> get(String path) async {
    final headers = await _authHeaders();
    final res = await http.get(Uri.parse('$baseUrl$path'), headers: headers);
    return _handle(res);
  }

  /// Authenticated GET for binary assets (e.g. document attachment images).
  static Future<Uint8List> getBytes(String path) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final headers = <String, String>{};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    final uri = path.startsWith('http') ? Uri.parse(path) : Uri.parse('$baseUrl$path');
    final res = await http.get(uri, headers: headers);
    if (res.statusCode >= 200 && res.statusCode < 300) return res.bodyBytes;
    _clearSessionIfUnauthorized(res.statusCode);
    throw Exception('Failed to load asset');
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final headers = await _authHeaders();
    final res = await http.post(Uri.parse('$baseUrl$path'), headers: headers, body: jsonEncode(body));
    return _handle(res);
  }

  static Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final headers = await _authHeaders();
    final res = await http.put(Uri.parse('$baseUrl$path'), headers: headers, body: jsonEncode(body));
    return _handle(res);
  }

  static Future<dynamic> delete(String path) async {
    final headers = await _authHeaders();
    final res = await http.delete(Uri.parse('$baseUrl$path'), headers: headers);
    return _handle(res);
  }

  static Future<dynamic> postMultipart(String path, Map<String, String> fields, List<PlatformFile> files) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final uri = Uri.parse('$baseUrl$path');
    final req = http.MultipartRequest('POST', uri);
    if (token != null && token.isNotEmpty) {
      req.headers['Authorization'] = 'Bearer $token';
    }
    fields.forEach((k, v) => req.fields[k] = v);
    for (final pf in files) {
      if (pf.path != null) {
        req.files.add(await http.MultipartFile.fromPath('documentPhotos', pf.path!));
      }
    }
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    return _handle(res);
  }

  static Future<dynamic> putMultipart(String path, Map<String, String> fields, List<PlatformFile> files) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final uri = Uri.parse('$baseUrl$path');
    final req = http.MultipartRequest('PUT', uri);
    if (token != null && token.isNotEmpty) {
      req.headers['Authorization'] = 'Bearer $token';
    }
    fields.forEach((k, v) => req.fields[k] = v);
    for (final pf in files) {
      if (pf.path != null) {
        req.files.add(await http.MultipartFile.fromPath('documentPhotos', pf.path!));
      }
    }
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    return _handle(res);
  }

  static dynamic _handle(http.Response res) {
    _clearSessionIfUnauthorized(res.statusCode);
    dynamic body;
    if (res.body.isNotEmpty) {
      try {
        body = jsonDecode(res.body);
      } catch (_) {
        body = res.body;
      }
    }
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    if (body is Map && body['error'] != null) {
      final e = body['error'];
      throw Exception(e is String ? e : jsonEncode(e));
    }
    throw Exception('Request failed (${res.statusCode})');
  }
}
