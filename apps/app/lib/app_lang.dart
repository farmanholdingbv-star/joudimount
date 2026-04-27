import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class Lang {
  static final ValueNotifier<String> locale = ValueNotifier<String>('ar');

  static Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString('locale') ?? 'ar';
    locale.value = (value == 'en') ? 'en' : 'ar';
  }

  static Future<void> setLocale(String value) async {
    locale.value = value == 'en' ? 'en' : 'ar';
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('locale', locale.value);
  }
}
