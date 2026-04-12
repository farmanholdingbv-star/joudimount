import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';
import 'l10n/app_localizations.dart';

class EmployeesTab extends StatefulWidget {
  final String role;
  const EmployeesTab({super.key, required this.role});

  @override
  State<EmployeesTab> createState() => _EmployeesTabState();
}

class _EmployeesTabState extends State<EmployeesTab> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String _error = '';
  String? _editingId;
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  String _role = 'employee';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final data = await Api.get('/api/employees') as List<dynamic>;
      _items = data.cast<Map<String, dynamic>>();
    } catch (e) {
      _error = e.toString();
    } finally {
      setState(() => _loading = false);
    }
  }

  void _startEdit(Map<String, dynamic> e) {
    setState(() {
      _editingId = e['id']?.toString();
      _name.text = (e['name'] ?? '').toString();
      _email.text = (e['email'] ?? '').toString();
      _password.clear();
      _role = (e['role'] ?? 'employee').toString();
    });
  }

  void _cancelEdit() {
    setState(() {
      _editingId = null;
      _name.clear();
      _email.clear();
      _password.clear();
      _role = 'employee';
      _error = '';
    });
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    setState(() => _error = '');
    try {
      final body = <String, dynamic>{
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'role': _role,
      };
      if (_editingId == null) {
        if (_password.text.length < 4) {
          setState(() => _error = l10n.employeePassword);
          return;
        }
        body['password'] = _password.text;
        await Api.post('/api/employees', body);
      } else {
        if (_password.text.isNotEmpty) body['password'] = _password.text;
        await Api.put('/api/employees/$_editingId', body);
      }
      _cancelEdit();
      await _load();
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _delete(Map<String, dynamic> e) async {
    final l10n = AppLocalizations.of(context)!;
    final prefs = await SharedPreferences.getInstance();
    final selfRaw = prefs.getString('user');
    final selfId = selfRaw != null ? (jsonDecode(selfRaw) as Map)['id']?.toString() : null;
    final id = e['id']?.toString() ?? '';
    if (selfId != null && id == selfId) {
      setState(() => _error = l10n.managerOnlyEmployees);
      return;
    }
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(l10n.confirmDelete),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.cancel)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l10n.delete)),
        ],
      ),
    );
    if (ok != true) return;
    if (!context.mounted) return;
    try {
      await Api.delete('/api/employees/$id');
      await _load();
    } catch (err) {
      if (mounted) setState(() => _error = err.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isManager = widget.role == 'manager';
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Text(l10n.employeesTitle, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text(l10n.roleFromAccount),
        const SizedBox(height: 8),
        Text('${l10n.currentRole}: ${widget.role}', style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        if (!isManager) Text(l10n.managerOnlyEmployees, style: const TextStyle(color: Colors.grey)),
        if (isManager) ...[
          TextField(controller: _name, decoration: InputDecoration(labelText: l10n.employeeName)),
          TextField(controller: _email, decoration: InputDecoration(labelText: l10n.employeeEmail)),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: InputDecoration(
              labelText: l10n.employeePassword,
              hintText: _editingId != null ? l10n.passwordHintEdit : null,
            ),
          ),
          DropdownButtonFormField<String>(
            decoration: InputDecoration(labelText: l10n.employeeRole),
            value: _role,
            items: [
              DropdownMenuItem(value: 'manager', child: Text(l10n.roleManager)),
              DropdownMenuItem(value: 'employee', child: Text(l10n.roleEmployee)),
              DropdownMenuItem(value: 'accountant', child: Text(l10n.roleAccountant)),
            ],
            onChanged: (v) => setState(() => _role = v ?? 'employee'),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              FilledButton(onPressed: _save, child: Text(l10n.save)),
              const SizedBox(width: 12),
              if (_editingId != null) OutlinedButton(onPressed: _cancelEdit, child: Text(l10n.cancelEdit)),
            ],
          ),
        ],
        if (_error.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error, style: const TextStyle(color: Colors.red))),
        const SizedBox(height: 16),
        if (_loading) const Center(child: CircularProgressIndicator()),
        ..._items.map(
          (e) => Card(
            child: ListTile(
              title: Text('${e['name']}'),
              subtitle: Text('${e['email']} • ${e['role']}'),
              trailing: isManager
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(icon: const Icon(Icons.edit), onPressed: () => _startEdit(e)),
                        IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _delete(e)),
                      ],
                    )
                  : null,
            ),
          ),
        ),
      ],
    );
  }
}
