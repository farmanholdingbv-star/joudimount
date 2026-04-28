import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'app_lang.dart';
import 'client_detail.dart';
import 'employees.dart';
import 'home_dashboard.dart';
import 'l10n/app_localizations.dart';
import 'shipping_detail.dart';
import 'transactions_list.dart';

void main() {
  runApp(const TrackerMobileApp());
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
      return const MaterialApp(
          home: Scaffold(body: Center(child: CircularProgressIndicator())));
    }
    return ValueListenableBuilder<String>(
      valueListenable: Lang.locale,
      builder: (context, value, _) {
        final isArabic = value.toLowerCase().startsWith('ar');
        return MaterialApp(
          title: 'Transaction Tracker Mobile',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            useMaterial3: true,
            fontFamily: isArabic ? 'NotoSansArabic' : null,
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF1e3a8a),
              brightness: Brightness.light,
            ),
            scaffoldBackgroundColor: const Color(0xFFF8FAFC),
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.white,
              foregroundColor: Color(0xFF1e3a8a),
              centerTitle: false,
              elevation: 0,
              scrolledUnderElevation: 0,
            ),
            cardTheme: CardThemeData(
              color: Colors.white,
              elevation: 0,
              margin: const EdgeInsets.symmetric(vertical: 6),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.grey.shade200),
              ),
            ),
            listTileTheme: const ListTileThemeData(
              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            ),
            inputDecorationTheme: InputDecorationTheme(
              filled: true,
              fillColor: Colors.white,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: const OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(14)),
                borderSide: BorderSide(color: Color(0xFF2563EB), width: 1.2),
              ),
            ),
            filledButtonTheme: FilledButtonThemeData(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF1e3a8a),
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            outlinedButtonTheme: OutlinedButtonThemeData(
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF1e3a8a),
                side: const BorderSide(color: Color(0xFF2563EB)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        locale: Locale(value),
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: const AuthGate(),
        );
      },
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
    final rememberMe = prefs.getBool('remember_me') ?? true;
    if (rememberMe) {
      final userRaw = prefs.getString('user');
      if (userRaw != null) {
        _user = jsonDecode(userRaw) as Map<String, dynamic>;
      }
    } else {
      await prefs.remove('token');
      await prefs.remove('user');
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
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _rememberMe = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadRememberMe();
  }

  Future<void> _loadRememberMe() async {
    final prefs = await SharedPreferences.getInstance();
    final remember = prefs.getBool('remember_me') ?? true;
    final savedEmail = prefs.getString('remembered_email') ?? '';
    if (!mounted) return;
    setState(() {
      _rememberMe = remember;
      if (savedEmail.isNotEmpty) {
        _emailCtrl.text = savedEmail;
      } else {
        _emailCtrl.text = 'manager@tracker.local';
      }
      if (_passCtrl.text.isEmpty) {
        _passCtrl.text = '123456';
      }
    });
  }

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
      await prefs.setBool('remember_me', _rememberMe);
      if (_rememberMe) {
        await prefs.setString('remembered_email', _emailCtrl.text.trim());
      } else {
        await prefs.remove('remembered_email');
      }
      widget.onLogin(data['user'] as Map<String, dynamic>);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1e3a8a), Color(0xFF2563eb)],
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.track_changes_outlined,
                          color: Colors.white, size: 26),
                      const SizedBox(height: 8),
                      Text(
                        l10n.loginBannerTitle,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(l10n.login,
                            style: const TextStyle(
                                fontSize: 24, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 14),
                        TextField(
                            controller: _emailCtrl,
                            decoration: InputDecoration(labelText: l10n.email)),
                        const SizedBox(height: 10),
                        TextField(
                            controller: _passCtrl,
                            decoration:
                                InputDecoration(labelText: l10n.password),
                            obscureText: true),
                        const SizedBox(height: 6),
                        CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          dense: true,
                          controlAffinity: ListTileControlAffinity.leading,
                          value: _rememberMe,
                          onChanged: _loading
                              ? null
                              : (v) => setState(() => _rememberMe = v ?? true),
                          title: Text(l10n.rememberMe),
                        ),
                        const SizedBox(height: 14),
                        if (_error.isNotEmpty)
                          Text(_error, style: const TextStyle(color: Colors.red)),
                        FilledButton(
                          onPressed: _loading ? null : _submit,
                          child: Text(_loading ? l10n.signingIn : l10n.login),
                        ),
                      ],
                    ),
                  ),
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

  String _appBarTitle(AppLocalizations l10n) {
    switch (_index) {
      case 1:
        return l10n.transactions;
      case 2:
        return l10n.transfers;
      case 3:
        return l10n.exports;
      case 4:
        return l10n.clients;
      case 5:
        return l10n.shipping;
      case 6:
        return l10n.employees;
      case 7:
        return l10n.profile;
      default:
        return l10n.tracker;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isAr = Lang.locale.value.toLowerCase().startsWith('ar');
    final role = widget.user['role'] as String? ?? 'employee';
    final pages = [
      DashboardHome(
        user: widget.user,
        role: role,
        onSwitchTab: (i) => setState(() => _index = i),
        onOpenProfile: () => setState(() => _index = 7),
      ),
      TransactionsTab(role: role, module: 'transactions'),
      TransactionsTab(role: role, module: 'transfers'),
      TransactionsTab(role: role, module: 'exports'),
      ClientsTab(role: role),
      ShippingTab(role: role),
      EmployeesTab(role: role),
      ProfileTab(user: widget.user, onLogout: _logout),
    ];

    final userName = (widget.user['name'] ?? '').toString().trim();

    return Scaffold(
      appBar: _index == 0
          ? null
          : AppBar(
              title: Text(_appBarTitle(l10n)),
              actions: [
                if (userName.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Center(
                      child: Text(
                        userName,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: Lang.locale.value,
                      items: [
                        DropdownMenuItem(value: 'ar', child: Text(l10n.languageAr)),
                        DropdownMenuItem(value: 'en', child: Text(l10n.languageEn)),
                      ],
                      onChanged: (v) {
                        if (v != null) Lang.setLocale(v);
                      },
                    ),
                  ),
                ),
              ],
            ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _index,
        onTap: (v) => setState(() => _index = v),
        selectedItemColor: const Color(0xFFF97316),
        unselectedItemColor: const Color(0xFF2563EB),
        items: [
          BottomNavigationBarItem(
              icon: const Icon(Icons.dashboard_outlined),
              label: l10n.dashboardTab),
          BottomNavigationBarItem(
              icon: const Icon(Icons.receipt_long_outlined),
              label: l10n.transactions),
          BottomNavigationBarItem(
              icon: const Icon(Icons.swap_horiz_outlined), label: l10n.transfers),
          BottomNavigationBarItem(
              icon: const Icon(Icons.outbox_outlined), label: l10n.exports),
          BottomNavigationBarItem(
              icon: const Icon(Icons.groups_outlined), label: l10n.clients),
          BottomNavigationBarItem(
              icon: const Icon(Icons.local_shipping_outlined),
              label: l10n.shipping),
          BottomNavigationBarItem(
              icon: const Icon(Icons.badge_outlined), label: l10n.employees),
          BottomNavigationBarItem(
              icon: const Icon(Icons.person_outline), label: l10n.profile),
        ],
        // Swap module labels to Arabic at runtime.
        // We keep item count and order identical to web modules.
        selectedLabelStyle: isAr ? const TextStyle(fontFamily: 'NotoSansArabic') : null,
        unselectedLabelStyle: isAr ? const TextStyle(fontFamily: 'NotoSansArabic') : null,
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
    final created = await Navigator.of(context)
        .push<bool>(MaterialPageRoute(builder: (_) => const ClientFormPage()));
    if (created == true) _load();
  }

  Future<void> _editClient(Map<String, dynamic> client) async {
    final updated = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => ClientFormPage(existing: client)));
    if (updated == true) _load();
  }

  Future<void> _deleteClient(String id) async {
    final l10n = AppLocalizations.of(context)!;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(l10n.confirmDelete),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(l10n.cancel)),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(l10n.delete)),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await Api.delete('/api/clients/$id');
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      }
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
    final cs = Theme.of(context).colorScheme;
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1e3a8a), Color(0xFF2563eb)],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              const CircleAvatar(
                backgroundColor: Color(0x33FFFFFF),
                child: Icon(Icons.groups_outlined, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  l10n.clients,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        if (isManager)
          FilledButton.icon(
              onPressed: _createClient,
              icon: const Icon(Icons.add),
              label: Text(l10n.addClient)),
        if (!isManager)
          Text(l10n.managerOnlyClients,
              style: const TextStyle(color: Colors.grey)),
        if (_loading)
          const Center(
              child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator())),
        if (_error.isNotEmpty)
          Card(
            color: cs.errorContainer,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Text(_error, style: TextStyle(color: cs.onErrorContainer)),
            ),
          ),
        if (!_loading && _error.isEmpty && _items.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                l10n.noMatch,
                style: TextStyle(color: Colors.grey.shade700),
              ),
            ),
          ),
        ..._items.map((c) => Card(
              child: ListTile(
                onTap: () {
                  Navigator.of(context).push<void>(
                    MaterialPageRoute(
                        builder: (_) => ClientDetailPage(id: _entityId(c))),
                  );
                },
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
                          PopupMenuItem(
                              value: 'delete', child: Text(l10n.delete)),
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
    _imm =
        TextEditingController(text: (e?['immigrationCode'] ?? '').toString());
    _email = TextEditingController(text: (e?['email'] ?? '').toString());
    _country = TextEditingController(text: (e?['country'] ?? '').toString());
    _credit = TextEditingController(text: (e?['creditLimit'] ?? 0).toString());
    _status = (e?['status'] ?? 'active').toString();
  }

  String get _existingId =>
      (widget.existing?['id'] ?? widget.existing?['_id'] ?? '').toString();

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
          TextField(
              controller: _name,
              decoration: InputDecoration(labelText: l10n.companyName)),
          TextField(
            controller: _trn,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(labelText: l10n.trn),
          ),
          TextField(
              controller: _imm,
              decoration: InputDecoration(labelText: l10n.immigrationCode)),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: l10n.clientEmail),
          ),
          TextField(
              controller: _country,
              decoration: InputDecoration(labelText: l10n.country)),
          TextField(
              controller: _credit,
              decoration: InputDecoration(labelText: l10n.creditLimit)),
          DropdownButtonFormField<String>(
            key: ValueKey('client-status-$_status'),
            decoration: InputDecoration(labelText: l10n.clientStatus),
            initialValue: _status,
            items: [
              DropdownMenuItem(value: 'active', child: Text(l10n.statusActive)),
              DropdownMenuItem(
                  value: 'suspended', child: Text(l10n.statusSuspended)),
            ],
            onChanged: (v) => setState(() => _status = v ?? 'active'),
          ),
          if (_error.isNotEmpty)
            Text(_error, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 8),
          FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? l10n.saving : l10n.save)),
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
    final created = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => const ShippingFormPage()));
    if (created == true) _load();
  }

  Future<void> _editShipping(Map<String, dynamic> shipping) async {
    final updated = await Navigator.of(context).push<bool>(MaterialPageRoute(
        builder: (_) => ShippingFormPage(existing: shipping)));
    if (updated == true) _load();
  }

  Future<void> _deleteShipping(String id) async {
    final l10n = AppLocalizations.of(context)!;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(l10n.confirmDelete),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(l10n.cancel)),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(l10n.delete)),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await Api.delete('/api/shipping-companies/$id');
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      }
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
    final cs = Theme.of(context).colorScheme;
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1e3a8a), Color(0xFF2563eb)],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              const CircleAvatar(
                backgroundColor: Color(0x33FFFFFF),
                child: Icon(Icons.local_shipping_outlined, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  l10n.shipping,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        if (isManager)
          FilledButton.icon(
              onPressed: _createShipping,
              icon: const Icon(Icons.add),
              label: Text(l10n.addShipping)),
        if (!isManager)
          Text(l10n.managerOnlyShipping,
              style: const TextStyle(color: Colors.grey)),
        if (_loading)
          const Center(
              child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator())),
        if (_error.isNotEmpty)
          Card(
            color: cs.errorContainer,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Text(_error, style: TextStyle(color: cs.onErrorContainer)),
            ),
          ),
        if (!_loading && _error.isEmpty && _items.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                l10n.noMatch,
                style: TextStyle(color: Colors.grey.shade700),
              ),
            ),
          ),
        ..._items.map((s) => Card(
              child: ListTile(
                onTap: () {
                  Navigator.of(context).push<void>(
                    MaterialPageRoute(
                        builder: (_) =>
                            ShippingCompanyDetailPage(id: _entityId(s))),
                  );
                },
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
                          PopupMenuItem(
                              value: 'delete', child: Text(l10n.delete)),
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
  late final TextEditingController _dispatchTemplate;
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
    _contact =
        TextEditingController(text: (e?['contactName'] ?? '').toString());
    _phone = TextEditingController(text: (e?['phone'] ?? '').toString());
    _email = TextEditingController(text: (e?['email'] ?? '').toString());
    _dispatchTemplate = TextEditingController(
        text: (e?['dispatchFormTemplate'] ?? '').toString());
    _lat = TextEditingController(
      text: e != null && e['latitude'] != null ? '${e['latitude']}' : '',
    );
    _lng = TextEditingController(
      text: e != null && e['longitude'] != null ? '${e['longitude']}' : '',
    );
    _shipStatus = (e?['status'] ?? 'active').toString();
  }

  String get _existingId =>
      (widget.existing?['id'] ?? widget.existing?['_id'] ?? '').toString();

  @override
  void dispose() {
    _name.dispose();
    _code.dispose();
    _contact.dispose();
    _phone.dispose();
    _email.dispose();
    _dispatchTemplate.dispose();
    _lat.dispose();
    _lng.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      final latStr = _lat.text.trim();
      final lngStr = _lng.text.trim();
      if (latStr.isEmpty != lngStr.isEmpty) {
        setState(() => _error = l10n.shippingLatLngBothOrEmpty);
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
      final tpl = _dispatchTemplate.text.trim();
      if (tpl.isNotEmpty) {
        body['dispatchFormTemplate'] = tpl;
      } else if (_existingId.isNotEmpty) {
        body['dispatchFormTemplate'] = null;
      }
      if (latStr.isNotEmpty && lngStr.isNotEmpty) {
        final lat = double.tryParse(latStr);
        final lng = double.tryParse(lngStr);
        if (lat == null || lng == null) {
          setState(() => _error = l10n.shippingInvalidLatLng);
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
          TextField(
              controller: _name,
              decoration: InputDecoration(labelText: l10n.companyName)),
          TextField(
              controller: _code,
              decoration: InputDecoration(labelText: l10n.code)),
          TextField(
              controller: _contact,
              decoration: InputDecoration(labelText: l10n.contactName)),
          TextField(
              controller: _phone,
              decoration: InputDecoration(labelText: l10n.phone)),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: l10n.shippingEmailOptional),
          ),
          TextField(
            controller: _dispatchTemplate,
            minLines: 3,
            maxLines: 5,
            decoration: InputDecoration(
                labelText: l10n.shippingDispatchTemplateOptional),
          ),
          TextField(
            controller: _lat,
            keyboardType: const TextInputType.numberWithOptions(
                decimal: true, signed: true),
            decoration: InputDecoration(labelText: l10n.latitudeOptional),
          ),
          TextField(
            controller: _lng,
            keyboardType: const TextInputType.numberWithOptions(
                decimal: true, signed: true),
            decoration: InputDecoration(labelText: l10n.longitudeOptional),
          ),
          DropdownButtonFormField<String>(
            key: ValueKey('shipping-status-$_shipStatus'),
            decoration: InputDecoration(labelText: l10n.shippingStatus),
            initialValue: _shipStatus,
            items: [
              DropdownMenuItem(value: 'active', child: Text(l10n.statusActive)),
              DropdownMenuItem(
                  value: 'inactive', child: Text(l10n.statusInactive)),
            ],
            onChanged: (v) => setState(() => _shipStatus = v ?? 'active'),
          ),
          if (_error.isNotEmpty)
            Text(_error, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 8),
          FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? l10n.saving : l10n.save)),
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
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1e3a8a), Color(0xFF2563eb)],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              const CircleAvatar(
                backgroundColor: Color(0x33FFFFFF),
                child: Icon(Icons.person_outline, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  l10n.profile,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
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
