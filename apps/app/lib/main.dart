import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';
import 'employees.dart';
import 'l10n/app_localizations.dart';
import 'transactions_list.dart';

void main() {
  runApp(const TrackerMobileApp());
}

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

class TrackerMobileApp extends StatefulWidget {
  const TrackerMobileApp({super.key});

  @override
  State<TrackerMobileApp> createState() => _TrackerMobileAppState();
}

class _TrackerMobileAppState extends State<TrackerMobileApp> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    Lang.load().then((_) {
      if (mounted) setState(() => _ready = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return const MaterialApp(home: Scaffold(body: Center(child: CircularProgressIndicator())));
    }
    return ValueListenableBuilder<String>(
      valueListenable: Lang.locale,
      builder: (context, value, _) => MaterialApp(
        title: 'Transaction Tracker Mobile',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(colorSchemeSeed: Colors.teal, useMaterial3: true),
        locale: Locale(value),
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: const AuthGate(),
      ),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _loading = true;
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final userRaw = prefs.getString('user');
    if (userRaw != null) {
      _user = jsonDecode(userRaw) as Map<String, dynamic>;
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_user == null) {
      return LoginPage(onLogin: (user) => setState(() => _user = user));
    }
    return HomePage(
      user: _user!,
      onLogout: () => setState(() => _user = null),
    );
  }
}

class LoginPage extends StatefulWidget {
  final ValueChanged<Map<String, dynamic>> onLogin;
  const LoginPage({super.key, required this.onLogin});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailCtrl = TextEditingController(text: 'manager@tracker.local');
  final _passCtrl = TextEditingController(text: '123456');
  bool _loading = false;
  String _error = '';

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final data = await Api.post('/api/auth/login', {
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
      }) as Map<String, dynamic>;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token'] as String);
      await prefs.setString('user', jsonEncode(data['user']));
      widget.onLogin(data['user'] as Map<String, dynamic>);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(l10n.login, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                TextField(controller: _emailCtrl, decoration: InputDecoration(labelText: l10n.email)),
                const SizedBox(height: 10),
                TextField(controller: _passCtrl, decoration: InputDecoration(labelText: l10n.password), obscureText: true),
                const SizedBox(height: 16),
                if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: _loading ? null : _submit,
                  child: Text(_loading ? l10n.signingIn : l10n.login),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  final Map<String, dynamic> user;
  final VoidCallback onLogout;
  const HomePage({super.key, required this.user, required this.onLogout});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _index = 0;

  Future<void> _logout() async {
    try {
      await Api.post('/api/auth/logout', {});
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    widget.onLogout();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final role = widget.user['role'] as String? ?? 'employee';
    final pages = [
      TransactionsTab(role: role),
      ClientsTab(role: role),
      ShippingTab(role: role),
      EmployeesTab(role: role),
      ProfileTab(user: widget.user, onLogout: _logout),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text('${l10n.tracker} (${widget.user['role']})'),
        actions: [
          Row(
            children: [
              Text(l10n.language),
              const SizedBox(width: 8),
              DropdownButton<String>(
                value: Lang.locale.value,
                items: const [
                  DropdownMenuItem(value: 'ar', child: Text('العربية')),
                  DropdownMenuItem(value: 'en', child: Text('English')),
                ],
                onChanged: (v) {
                  if (v != null) {
                    Lang.setLocale(v);
                  }
                },
              ),
              const SizedBox(width: 8),
            ],
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (v) => setState(() => _index = v),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.receipt_long), label: l10n.transactions),
          NavigationDestination(icon: const Icon(Icons.groups), label: l10n.clients),
          NavigationDestination(icon: const Icon(Icons.local_shipping), label: l10n.shipping),
          NavigationDestination(icon: const Icon(Icons.badge_outlined), label: l10n.employees),
          NavigationDestination(icon: const Icon(Icons.person), label: l10n.profile),
        ],
      ),
    );
  }
}

class ClientsTab extends StatefulWidget {
  final String role;
  const ClientsTab({super.key, required this.role});

  @override
  State<ClientsTab> createState() => _ClientsTabState();
}

class _ClientsTabState extends State<ClientsTab> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final data = await Api.get('/api/clients') as List<dynamic>;
      _items = data.cast<Map<String, dynamic>>();
    } catch (e) {
      _error = e.toString();
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _createClient() async {
    final created = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const ClientFormPage()));
    if (created == true) _load();
  }

  Future<void> _editClient(Map<String, dynamic> client) async {
    final updated = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => ClientFormPage(existing: client)));
    if (updated == true) _load();
  }

  Future<void> _deleteClient(String id) async {
    final l10n = AppLocalizations.of(context)!;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(l10n.confirmDelete),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l10n.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(l10n.delete)),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await Api.delete('/api/clients/$id');
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  String _clientListSubtitle(Map<String, dynamic> c, AppLocalizations l10n) {
    String dash(dynamic v) {
      final s = (v ?? '').toString().trim();
      return s.isEmpty ? '—' : s;
    }

    final idPart = dash(c['immigrationCode']);
    final emailPart = dash(c['email']);
    final countryPart = dash(c['country']);
    return '${l10n.phone}: ${c['trn']} • ${l10n.immigrationCode}: $idPart • ${l10n.clientEmail}: $emailPart • ${l10n.country}: $countryPart • ${l10n.status}: ${c['status']}';
  }

  String _entityId(Map<String, dynamic> item) {
    return (item['id'] ?? item['_id'] ?? '').toString();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isManager = widget.role == 'manager';
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        if (isManager) FilledButton.icon(onPressed: _createClient, icon: const Icon(Icons.add), label: Text(l10n.addClient)),
        if (!isManager) Text(l10n.managerOnlyClients, style: const TextStyle(color: Colors.grey)),
        if (_loading) const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator())),
        if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
        ..._items.map((c) => Card(
              child: ListTile(
                title: Text('${c['companyName']}'),
                subtitle: Text(_clientListSubtitle(c, l10n)),
                trailing: isManager
                    ? PopupMenuButton<String>(
                        onSelected: (value) {
                          if (value == 'edit') {
                            _editClient(c);
                          } else if (value == 'delete') {
                            _deleteClient(_entityId(c));
                          }
                        },
                        itemBuilder: (_) => [
                          PopupMenuItem(value: 'edit', child: Text(l10n.edit)),
                          PopupMenuItem(value: 'delete', child: Text(l10n.delete)),
                        ],
                      )
                    : null,
              ),
            )),
      ],
    );
  }
}

class ClientFormPage extends StatefulWidget {
  final Map<String, dynamic>? existing;
  const ClientFormPage({super.key, this.existing});

  @override
  State<ClientFormPage> createState() => _ClientFormPageState();
}

class _ClientFormPageState extends State<ClientFormPage> {
  late final TextEditingController _name;
  late final TextEditingController _trn;
  late final TextEditingController _imm;
  late final TextEditingController _email;
  late final TextEditingController _country;
  late final TextEditingController _credit;
  String _status = 'active';
  bool _saving = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _name = TextEditingController(text: (e?['companyName'] ?? '').toString());
    _trn = TextEditingController(text: (e?['trn'] ?? '').toString());
    _imm = TextEditingController(text: (e?['immigrationCode'] ?? '').toString());
    _email = TextEditingController(text: (e?['email'] ?? '').toString());
    _country = TextEditingController(text: (e?['country'] ?? '').toString());
    _credit = TextEditingController(text: (e?['creditLimit'] ?? 0).toString());
    _status = (e?['status'] ?? 'active').toString();
  }

  String get _existingId => (widget.existing?['id'] ?? widget.existing?['_id'] ?? '').toString();

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      final body = {
        'companyName': _name.text.trim(),
        'trn': _trn.text.trim(),
        'immigrationCode': _imm.text.trim(),
        'email': _email.text.trim(),
        'country': _country.text.trim(),
        'creditLimit': double.tryParse(_credit.text.trim()) ?? 0,
        'status': _status,
      };
      final id = _existingId;
      if (id.isNotEmpty) {
        await Api.put('/api/clients/$id', body);
      } else {
        await Api.post('/api/clients', body);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isEdit = widget.existing != null;
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? l10n.edit : l10n.addClient)),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          TextField(controller: _name, decoration: InputDecoration(labelText: l10n.companyName)),
          TextField(
            controller: _trn,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(labelText: l10n.trn),
          ),
          TextField(controller: _imm, decoration: InputDecoration(labelText: l10n.immigrationCode)),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: l10n.clientEmail),
          ),
          TextField(controller: _country, decoration: InputDecoration(labelText: l10n.country)),
          TextField(controller: _credit, decoration: InputDecoration(labelText: l10n.creditLimit)),
          DropdownButtonFormField<String>(
            decoration: InputDecoration(labelText: l10n.clientStatus),
            value: _status,
            items: [
              DropdownMenuItem(value: 'active', child: Text(l10n.statusActive)),
              DropdownMenuItem(value: 'suspended', child: Text(l10n.statusSuspended)),
            ],
            onChanged: (v) => setState(() => _status = v ?? 'active'),
          ),
          if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 8),
          FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? l10n.saving : l10n.save)),
        ],
      ),
    );
  }
}

class ShippingTab extends StatefulWidget {
  final String role;
  const ShippingTab({super.key, required this.role});

  @override
  State<ShippingTab> createState() => _ShippingTabState();
}

class _ShippingTabState extends State<ShippingTab> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final data = await Api.get('/api/shipping-companies') as List<dynamic>;
      _items = data.cast<Map<String, dynamic>>();
    } catch (e) {
      _error = e.toString();
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _createShipping() async {
    final created = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const ShippingFormPage()));
    if (created == true) _load();
  }

  Future<void> _editShipping(Map<String, dynamic> shipping) async {
    final updated = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => ShippingFormPage(existing: shipping)));
    if (updated == true) _load();
  }

  Future<void> _deleteShipping(String id) async {
    final l10n = AppLocalizations.of(context)!;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(l10n.confirmDelete),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l10n.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(l10n.delete)),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await Api.delete('/api/shipping-companies/$id');
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  String _entityId(Map<String, dynamic> item) {
    return (item['id'] ?? item['_id'] ?? '').toString();
  }

  String _shippingSubtitle(Map<String, dynamic> s) {
    final email = (s['email'] ?? '').toString().trim();
    final lat = s['latitude'];
    final lng = s['longitude'];
    final loc = (lat != null && lng != null) ? ' • $lat, $lng' : '';
    final em = email.isNotEmpty ? ' • $email' : '';
    return 'Code: ${s['code']} • Status: ${s['status']}$em$loc';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isManager = widget.role == 'manager';
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        if (isManager)
          FilledButton.icon(onPressed: _createShipping, icon: const Icon(Icons.add), label: Text(l10n.addShipping)),
        if (!isManager) Text(l10n.managerOnlyShipping, style: const TextStyle(color: Colors.grey)),
        if (_loading) const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator())),
        if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
        ..._items.map((s) => Card(
              child: ListTile(
                title: Text('${s['companyName']}'),
                subtitle: Text(_shippingSubtitle(s)),
                trailing: isManager
                    ? PopupMenuButton<String>(
                        onSelected: (value) {
                          if (value == 'edit') {
                            _editShipping(s);
                          } else if (value == 'delete') {
                            _deleteShipping(_entityId(s));
                          }
                        },
                        itemBuilder: (_) => [
                          PopupMenuItem(value: 'edit', child: Text(l10n.edit)),
                          PopupMenuItem(value: 'delete', child: Text(l10n.delete)),
                        ],
                      )
                    : null,
              ),
            )),
      ],
    );
  }
}

class ShippingFormPage extends StatefulWidget {
  final Map<String, dynamic>? existing;
  const ShippingFormPage({super.key, this.existing});

  @override
  State<ShippingFormPage> createState() => _ShippingFormPageState();
}

class _ShippingFormPageState extends State<ShippingFormPage> {
  late final TextEditingController _name;
  late final TextEditingController _code;
  late final TextEditingController _contact;
  late final TextEditingController _phone;
  late final TextEditingController _email;
  late final TextEditingController _lat;
  late final TextEditingController _lng;
  String _shipStatus = 'active';
  bool _saving = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _name = TextEditingController(text: (e?['companyName'] ?? '').toString());
    _code = TextEditingController(text: (e?['code'] ?? '').toString());
    _contact = TextEditingController(text: (e?['contactName'] ?? '').toString());
    _phone = TextEditingController(text: (e?['phone'] ?? '').toString());
    _email = TextEditingController(text: (e?['email'] ?? '').toString());
    _lat = TextEditingController(
      text: e != null && e['latitude'] != null ? '${e['latitude']}' : '',
    );
    _lng = TextEditingController(
      text: e != null && e['longitude'] != null ? '${e['longitude']}' : '',
    );
    _shipStatus = (e?['status'] ?? 'active').toString();
  }

  String get _existingId => (widget.existing?['id'] ?? widget.existing?['_id'] ?? '').toString();

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      final latStr = _lat.text.trim();
      final lngStr = _lng.text.trim();
      if (latStr.isEmpty != lngStr.isEmpty) {
        setState(() => _error = 'Enter both latitude and longitude, or leave both empty.');
        return;
      }
      final body = <String, dynamic>{
        'companyName': _name.text.trim(),
        'code': _code.text.trim(),
        'contactName': _contact.text.trim(),
        'phone': _phone.text.trim(),
        'status': _shipStatus,
      };
      final em = _email.text.trim();
      if (em.isNotEmpty) {
        body['email'] = em;
      } else if (_existingId.isNotEmpty) {
        body['email'] = null;
      }
      if (latStr.isNotEmpty && lngStr.isNotEmpty) {
        final lat = double.tryParse(latStr);
        final lng = double.tryParse(lngStr);
        if (lat == null || lng == null) {
          setState(() => _error = 'Invalid latitude or longitude.');
          return;
        }
        body['latitude'] = lat;
        body['longitude'] = lng;
      } else if (_existingId.isNotEmpty) {
        body['latitude'] = null;
        body['longitude'] = null;
      }
      final id = _existingId;
      if (id.isNotEmpty) {
        await Api.put('/api/shipping-companies/$id', body);
      } else {
        await Api.post('/api/shipping-companies', body);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isEdit = widget.existing != null;
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? l10n.edit : l10n.addShipping)),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          TextField(controller: _name, decoration: InputDecoration(labelText: l10n.companyName)),
          TextField(controller: _code, decoration: InputDecoration(labelText: l10n.code)),
          TextField(controller: _contact, decoration: InputDecoration(labelText: l10n.contactName)),
          TextField(controller: _phone, decoration: InputDecoration(labelText: l10n.phone)),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: l10n.shippingEmailOptional),
          ),
          TextField(
            controller: _lat,
            keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
            decoration: InputDecoration(labelText: l10n.latitudeOptional),
          ),
          TextField(
            controller: _lng,
            keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
            decoration: InputDecoration(labelText: l10n.longitudeOptional),
          ),
          DropdownButtonFormField<String>(
            decoration: InputDecoration(labelText: l10n.shippingStatus),
            value: _shipStatus,
            items: [
              DropdownMenuItem(value: 'active', child: Text(l10n.statusActive)),
              DropdownMenuItem(value: 'inactive', child: Text(l10n.statusInactive)),
            ],
            onChanged: (v) => setState(() => _shipStatus = v ?? 'active'),
          ),
          if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 8),
          FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? l10n.saving : l10n.save)),
        ],
      ),
    );
  }
}

class ProfileTab extends StatelessWidget {
  final Map<String, dynamic> user;
  final Future<void> Function() onLogout;
  const ProfileTab({super.key, required this.user, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Card(
          child: ListTile(
            title: Text('${user['name']}'),
            subtitle: Text('${user['email']} • ${user['role']}'),
          ),
        ),
        const SizedBox(height: 8),
        FilledButton.tonal(
          onPressed: () async => onLogout(),
          child: Text(l10n.logout),
        ),
      ],
    );
  }
}
