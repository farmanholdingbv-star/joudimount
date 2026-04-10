import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'l10n/app_localizations.dart';

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

class Api {
  static const String baseUrl = 'http://localhost:4000';

  static Future<Map<String, String>> _authHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final headers = <String, String>{'Content-Type': 'application/json'};
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

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final headers = await _authHeaders();
    final res = await http.post(Uri.parse('$baseUrl$path'), headers: headers, body: jsonEncode(body));
    return _handle(res);
  }

  /// Multipart POST for transactions with [documentPhotos] files (field name matches API).
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

  static dynamic _handle(http.Response res) {
    final body = res.body.isEmpty ? null : jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    throw Exception((body is Map && body['error'] != null) ? body['error'] : 'Request failed');
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
          NavigationDestination(icon: const Icon(Icons.person), label: l10n.profile),
        ],
      ),
    );
  }
}

class TransactionsTab extends StatefulWidget {
  final String role;
  const TransactionsTab({super.key, required this.role});

  @override
  State<TransactionsTab> createState() => _TransactionsTabState();
}

class _TransactionsTabState extends State<TransactionsTab> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String _error = '';
  String _query = '';
  String _status = 'all';
  String _channel = 'all';

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
      final data = await Api.get('/api/transactions') as List<dynamic>;
      _items = data.cast<Map<String, dynamic>>();
    } catch (e) {
      _error = e.toString();
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final statuses = _items.map((e) => (e['clearanceStatus'] ?? '').toString()).where((e) => e.isNotEmpty).toSet().toList();
    final filtered = _items.where((tx) {
      final q = _query.toLowerCase();
      final matchesQ = q.isEmpty ||
          (tx['clientName'] ?? '').toString().toLowerCase().contains(q) ||
          (tx['shippingCompanyName'] ?? '').toString().toLowerCase().contains(q) ||
          (tx['declarationNumber'] ?? '').toString().toLowerCase().contains(q) ||
          (tx['airwayBill'] ?? '').toString().toLowerCase().contains(q);
      final matchesS = _status == 'all' || (tx['clearanceStatus'] ?? '') == _status;
      final matchesC = _channel == 'all' || (tx['channel'] ?? '') == _channel;
      return matchesQ && matchesS && matchesC;
    }).toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: l10n.search),
                  onChanged: (v) => setState(() => _query = v),
                ),
              ),
              const SizedBox(width: 8),
              if (widget.role != 'accountant')
                FilledButton.icon(
                  onPressed: () async {
                    final created = await Navigator.of(context).push<bool>(
                      MaterialPageRoute(builder: (_) => const TransactionFormPage()),
                    );
                    if (created == true) _load();
                  },
                  icon: const Icon(Icons.add),
                  label: Text(l10n.newLabel),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _status,
                  items: ['all', ...statuses]
                      .map((e) => DropdownMenuItem(value: e, child: Text(e == 'all' ? l10n.allStatuses : e)))
                      .toList(),
                  onChanged: (v) => setState(() => _status = v ?? 'all'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _channel,
                  items: [
                    DropdownMenuItem(value: 'all', child: Text(l10n.allChannels)),
                    const DropdownMenuItem(value: 'green', child: Text('Green')),
                    const DropdownMenuItem(value: 'yellow', child: Text('Yellow')),
                    const DropdownMenuItem(value: 'red', child: Text('Red')),
                  ],
                  onChanged: (v) => setState(() => _channel = v ?? 'all'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_loading) const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator())),
          if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
          ...filtered.map(
            (tx) => Card(
              child: ListTile(
                title: Text('${tx['declarationNumber']} - ${tx['clientName']}'),
                subtitle: Text('${tx['shippingCompanyName']} • ${tx['clearanceStatus']}'),
                trailing: Text((tx['channel'] ?? '').toString().toUpperCase()),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => TransactionDetailsPage(id: tx['id'] as String, role: widget.role)),
                ),
              ),
            ),
          ),
          if (!_loading && filtered.isEmpty) Padding(padding: const EdgeInsets.all(16), child: Text(l10n.noMatch)),
        ],
      ),
    );
  }
}

class TransactionDetailsPage extends StatefulWidget {
  final String id;
  final String role;
  const TransactionDetailsPage({super.key, required this.id, required this.role});

  @override
  State<TransactionDetailsPage> createState() => _TransactionDetailsPageState();
}

class _TransactionDetailsPageState extends State<TransactionDetailsPage> {
  Map<String, dynamic>? tx;
  String error = '';
  bool loading = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = '';
    });
    try {
      tx = await Api.get('/api/transactions/${widget.id}') as Map<String, dynamic>;
    } catch (e) {
      error = e.toString();
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _action(String name) async {
    try {
      await Api.post('/api/transactions/${widget.id}/$name', {});
      await load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.details)),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error.isNotEmpty
              ? Center(child: Text(error))
              : ListView(
                  padding: const EdgeInsets.all(12),
                  children: [
                    _kv(l10n.client, '${tx!['clientName']}'),
                    _kv(l10n.shippingCompany, '${tx!['shippingCompanyName']}'),
                    _kv(l10n.declaration, '${tx!['declarationNumber']}'),
                    _kv(l10n.status, '${tx!['clearanceStatus']}'),
                    _kv(l10n.channel, '${tx!['channel']}'),
                    _kv(l10n.createdAt, '${tx!['createdAt']}'),
                    _kv(l10n.duty, '${tx!['customsDuty']}'),
                    const SizedBox(height: 8),
                    if (widget.role == 'manager' || widget.role == 'accountant')
                      Wrap(
                        spacing: 8,
                        children: [
                          FilledButton(onPressed: () => _action('pay'), child: Text(l10n.markPaid)),
                          FilledButton(onPressed: () => _action('release'), child: Text(l10n.release)),
                        ],
                      ),
                  ],
                ),
    );
  }

  Widget _kv(String k, String v) => Card(
        child: ListTile(
          title: Text(k),
          subtitle: Text(v),
        ),
      );
}

class TransactionFormPage extends StatefulWidget {
  const TransactionFormPage({super.key});

  @override
  State<TransactionFormPage> createState() => _TransactionFormPageState();
}

class _TransactionFormPageState extends State<TransactionFormPage> {
  final _client = TextEditingController();
  final _shippingName = TextEditingController();
  final _shippingId = TextEditingController();
  final _awb = TextEditingController();
  final _hs = TextEditingController();
  final _goods = TextEditingController();
  final _origin = TextEditingController(text: 'AE');
  final _value = TextEditingController(text: '1000');
  final _rate = TextEditingController();
  final _weight = TextEditingController();
  final _containers = TextEditingController();
  final _containerArrival = TextEditingController();
  final _documentArrival = TextEditingController();
  final _postal = TextEditingController();
  final _qty = TextEditingController();
  String? _quality;
  String? _unit;
  List<PlatformFile> _picked = [];
  bool _saving = false;
  String _error = '';

  Map<String, dynamic> _jsonBody() {
    final body = <String, dynamic>{
      'clientName': _client.text.trim(),
      'shippingCompanyName': _shippingName.text.trim(),
      'airwayBill': _awb.text.trim(),
      'hsCode': _hs.text.trim(),
      'goodsDescription': _goods.text.trim(),
      'originCountry': _origin.text.trim().toUpperCase(),
      'invoiceValue': double.tryParse(_value.text.trim()) ?? 0,
    };
    final sid = _shippingId.text.trim();
    if (sid.isNotEmpty) body['shippingCompanyId'] = sid;
    void addD(String k, TextEditingController c) {
      final v = double.tryParse(c.text.trim());
      if (v != null) body[k] = v;
    }

    void addI(String k, TextEditingController c) {
      final v = int.tryParse(c.text.trim());
      if (v != null) body[k] = v;
    }

    addD('invoiceToWeightRateAedPerKg', _rate);
    addD('goodsWeightKg', _weight);
    addI('containerCount', _containers);
    addD('goodsQuantity', _qty);
    if (_quality != null) body['goodsQuality'] = _quality;
    if (_unit != null) body['goodsUnit'] = _unit;
    if (_containerArrival.text.trim().isNotEmpty) body['containerArrivalDate'] = _containerArrival.text.trim();
    if (_documentArrival.text.trim().isNotEmpty) body['documentArrivalDate'] = _documentArrival.text.trim();
    if (_postal.text.trim().isNotEmpty) body['documentPostalNumber'] = _postal.text.trim();
    return body;
  }

  Map<String, String> _multipartFields() {
    final b = _jsonBody();
    return b.map((k, v) => MapEntry(k, v == null ? '' : v.toString()));
  }

  Future<void> _pickFiles() async {
    final r = await FilePicker.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: const ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
    );
    if (r == null || r.files.isEmpty) return;
    setState(() => _picked = r.files);
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      if (_picked.isEmpty) {
        await Api.post('/api/transactions', _jsonBody());
      } else {
        await Api.postMultipart('/api/transactions', _multipartFields(), _picked);
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
    return Scaffold(
      appBar: AppBar(title: Text(l10n.newTransaction)),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          _field(_client, l10n.client),
          _field(_shippingName, l10n.shippingCompany),
          _field(_shippingId, l10n.shippingCompanyIdOptional),
          _field(_awb, l10n.airwayBill),
          _field(_hs, l10n.hsCode),
          _field(_goods, l10n.goodsDescription),
          _field(_origin, l10n.originCountry),
          _field(_value, l10n.invoiceValue, keyboard: TextInputType.number),
          _field(_rate, l10n.txRateAedPerKg, keyboard: const TextInputType.numberWithOptions(decimal: true)),
          _field(_weight, l10n.txGoodsWeightKg, keyboard: const TextInputType.numberWithOptions(decimal: true)),
          _field(_containers, l10n.txContainerCount, keyboard: TextInputType.number),
          _field(_containerArrival, l10n.txContainerArrival),
          _field(_documentArrival, l10n.txDocumentArrival),
          _field(_postal, l10n.txDocumentPostal),
          _field(_qty, l10n.txGoodsQty, keyboard: const TextInputType.numberWithOptions(decimal: true)),
          DropdownButtonFormField<String>(
            decoration: InputDecoration(labelText: l10n.txGoodsQuality),
            initialValue: _quality,
            items: [
              DropdownMenuItem(value: 'new', child: Text(l10n.txQualityNew)),
              DropdownMenuItem(value: 'like_new', child: Text(l10n.txQualityLikeNew)),
              DropdownMenuItem(value: 'used', child: Text(l10n.txQualityUsed)),
              DropdownMenuItem(value: 'refurbished', child: Text(l10n.txQualityRefurbished)),
              DropdownMenuItem(value: 'damaged', child: Text(l10n.txQualityDamaged)),
              DropdownMenuItem(value: 'mixed', child: Text(l10n.txQualityMixed)),
            ],
            onChanged: (v) => setState(() => _quality = v),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            decoration: InputDecoration(labelText: l10n.txGoodsUnit),
            initialValue: _unit,
            items: [
              DropdownMenuItem(value: 'kg', child: Text(l10n.txUnitKg)),
              DropdownMenuItem(value: 'ton', child: Text(l10n.txUnitTon)),
              DropdownMenuItem(value: 'piece', child: Text(l10n.txUnitPiece)),
              DropdownMenuItem(value: 'carton', child: Text(l10n.txUnitCarton)),
              DropdownMenuItem(value: 'pallet', child: Text(l10n.txUnitPallet)),
              DropdownMenuItem(value: 'cbm', child: Text(l10n.txUnitCbm)),
              DropdownMenuItem(value: 'liter', child: Text(l10n.txUnitLiter)),
              DropdownMenuItem(value: 'set', child: Text(l10n.txUnitSet)),
            ],
            onChanged: (v) => setState(() => _unit = v),
          ),
          const SizedBox(height: 8),
          Text(l10n.txAttachDocs, style: Theme.of(context).textTheme.titleSmall),
          OutlinedButton.icon(onPressed: _pickFiles, icon: const Icon(Icons.attach_file), label: Text(l10n.txPickFiles)),
          if (_picked.isNotEmpty) Text('${_picked.length} files'),
          if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 8),
          FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? l10n.saving : l10n.save)),
        ],
      ),
    );
  }

  Widget _field(TextEditingController c, String label, {TextInputType keyboard = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextField(controller: c, keyboardType: keyboard, decoration: InputDecoration(labelText: label)),
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
        'status': (widget.existing?['status'] ?? 'active').toString(),
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
        'status': (widget.existing?['status'] ?? 'active').toString(),
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
