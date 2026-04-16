import 'package:flutter/material.dart';

import 'api.dart';
import 'l10n/app_localizations.dart';
import 'transaction_detail.dart';
import 'transaction_form.dart';

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
    final cs = Theme.of(context).colorScheme;
    final statuses = _items.map((e) => (e['clearanceStatus'] ?? '').toString()).where((e) => e.isNotEmpty).toSet().toList();
    final filtered = _items.where((tx) {
      final q = _query.toLowerCase();
      final matchesQ = q.isEmpty ||
          (tx['clientName'] ?? '').toString().toLowerCase().contains(q) ||
          (tx['shippingCompanyName'] ?? '').toString().toLowerCase().contains(q) ||
          (tx['declarationNumber'] ?? '').toString().toLowerCase().contains(q) ||
          (tx['airwayBill'] ?? '').toString().toLowerCase().contains(q);
      final matchesS = _status == 'all' || (tx['clearanceStatus'] ?? '') == _status;
      return matchesQ && matchesS;
    }).toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
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
                  child: Icon(Icons.receipt_long_outlined, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    l10n.transactions,
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
                      MaterialPageRoute(builder: (_) => TransactionFormPage(role: widget.role)),
                    );
                    if (created == true) _load();
                  },
                  icon: const Icon(Icons.add),
                  label: Text(l10n.newLabel),
                ),
            ],
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            key: ValueKey('tx-list-status-$_status'),
            initialValue: _status,
            items: ['all', ...statuses]
                .map((e) => DropdownMenuItem(value: e, child: Text(e == 'all' ? l10n.allStatuses : e)))
                .toList(),
            onChanged: (v) => setState(() => _status = v ?? 'all'),
          ),
          const SizedBox(height: 8),
          if (_loading) const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator())),
          if (_error.isNotEmpty)
            Card(
              color: cs.errorContainer,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(_error, style: TextStyle(color: cs.onErrorContainer)),
              ),
            ),
          ...filtered.map(
            (tx) => Card(
              child: ListTile(
                title: Text('${tx['clientName']}'),
                subtitle: Text('${tx['shippingCompanyName']} • ${tx['transactionStage'] ?? 'PREPARATION'} • ${tx['clearanceStatus']}'),
                onTap: () async {
                  await Navigator.of(context).push<bool>(
                    MaterialPageRoute(
                      builder: (_) => TransactionDetailsPage(id: tx['id'] as String, role: widget.role),
                    ),
                  );
                  _load();
                },
              ),
            ),
          ),
          if (!_loading && filtered.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(l10n.noMatch, style: TextStyle(color: Colors.grey.shade700)),
              ),
            ),
        ],
      ),
    );
  }
}
