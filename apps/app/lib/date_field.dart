import 'package:flutter/material.dart';

/// Formats [d] as `YYYY-MM-DD` for API payloads.
String apiDateFormatYmd(DateTime d) {
  final y = d.year.toString().padLeft(4, '0');
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$y-$m-$day';
}

/// Parses leading `YYYY-MM-DD` from [text], or returns null.
DateTime? apiDateParseYmd(String text) {
  final t = text.trim();
  if (t.length < 10) return null;
  final d = DateTime.tryParse(t.substring(0, 10));
  if (d == null) return null;
  return DateTime(d.year, d.month, d.day);
}

/// Read-only text field that opens [showDatePicker] (tap field or calendar icon).
/// Optional clear control when the field is non-empty and [enabled].
class ApiDateField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final bool enabled;
  final ValueChanged<String>? onChanged;

  const ApiDateField({
    super.key,
    required this.controller,
    required this.label,
    this.enabled = true,
    this.onChanged,
  });

  @override
  State<ApiDateField> createState() => _ApiDateFieldState();
}

class _ApiDateFieldState extends State<ApiDateField> {
  void _onController() => setState(() {});

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onController);
  }

  @override
  void didUpdateWidget(ApiDateField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_onController);
      widget.controller.addListener(_onController);
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onController);
    super.dispose();
  }

  Future<void> _pick() async {
    if (!widget.enabled) return;
    final ctx = context;
    final now = DateTime.now();
    final initial =
        apiDateParseYmd(widget.controller.text) ?? DateTime(now.year, now.month, now.day);
    final picked = await showDatePicker(
      context: ctx,
      initialDate: initial,
      firstDate: DateTime(1990, 1, 1),
      lastDate: DateTime(now.year + 15, 12, 31),
      locale: Localizations.maybeLocaleOf(ctx),
    );
    if (picked != null && mounted) {
      widget.controller.text = apiDateFormatYmd(picked);
      widget.onChanged?.call(widget.controller.text);
    }
  }

  void _clear() {
    widget.controller.clear();
    widget.onChanged?.call('');
  }

  @override
  Widget build(BuildContext context) {
    final hasText = widget.controller.text.trim().isNotEmpty;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextField(
        controller: widget.controller,
        readOnly: true,
        enabled: widget.enabled,
        onTap: _pick,
        decoration: InputDecoration(
          labelText: widget.label,
          suffixIcon: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (hasText && widget.enabled)
                IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: _clear,
                ),
              IconButton(
                icon: const Icon(Icons.calendar_today_outlined),
                onPressed: widget.enabled ? _pick : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
