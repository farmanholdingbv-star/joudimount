import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class Api {
  /// Use `http://10.0.2.2:4000` on Android emulator to reach the host machine.
  static const String baseUrl = 'http://localhost:4000';

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
