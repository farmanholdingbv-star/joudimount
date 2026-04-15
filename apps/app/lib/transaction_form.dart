import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'api.dart';
import 'l10n/app_localizations.dart';

/// New or edit transaction — aligned with web TransactionForm.
class TransactionFormPage extends StatefulWidget {
  final String role;
  final String? transactionId;

  const TransactionFormPage({super.key, required this.role, this.transactionId});

  @override
  State<TransactionFormPage> createState() => _TransactionFormPageState();
}

class _TransactionFormPageState extends State<TransactionFormPage> {
  static const List<String> _documentCategoryOptions = [
    'bill_of_lading',
    'certificate_of_origin',
    'invoice',
    'packing_list',
  ];
  static const List<String> _declarationTypeOptions = [
    'Import',
    'Import to Free Zone',
    'Import for Re-Export',
    'Temporary Import',
    'Export',
    'Re-Export',
    'Transfer',
    'Transit',
    'Temporary Admission',
  ];
  static const List<String> _portTypeOptions = ['Seaports', 'Free Zones', 'Mainland'];

  final _client = TextEditingController();
  final _shippingName = TextEditingController();
  final _shippingId = TextEditingController();
  final _declarationNumberInput = TextEditingController();
  final _declarationDateInput = TextEditingController();
  String _declarationType = '';
  String _portType = '';
  final _awb = TextEditingController();
  final _hs = TextEditingController();
  final _goods = TextEditingController();
  final _origin = TextEditingController(text: 'AE');
  final _value = TextEditingController(text: '1000');
  String _currency = 'AED';
  final _rate = TextEditingController();
  final _weight = TextEditingController();
  final _containers = TextEditingController();
  final _containerArrival = TextEditingController();
  final _documentArrival = TextEditingController();
  final _fileNumber = TextEditingController();
  final _containerNumbers = TextEditingController();
  final _unitCount = TextEditingController();
  final _stopReason = TextEditingController();
  final _qty = TextEditingController();
  String? _quality;
  String? _unit = 'cbm';
  bool _isStopped = false;
  String _docStatus = 'copy_received';
  String _paymentStatus = 'pending';
  List<PlatformFile> _picked = [];
  List<String?> _pickedCategories = [];
  List<Map<String, dynamic>> _retainedDocs = [];
  List<Map<String, dynamic>> _clients = [];
  List<Map<String, dynamic>> _shipping = [];
  bool _saving = false;
  String _error = '';
  bool _loadingTx = false;
  String? _releaseCode;
  String? _clearanceStatus;
  double? _customsDuty;

  bool get _isEdit => widget.transactionId != null;

  @override
  void initState() {
    super.initState();
    _loadLookups();
    if (_isEdit) _loadTransaction();
  }

  Future<void> _loadLookups() async {
    try {
      final c = await Api.get('/api/clients') as List<dynamic>;
      final s = await Api.get('/api/shipping-companies') as List<dynamic>;
      if (mounted) {
        setState(() {
          _clients = c.cast<Map<String, dynamic>>();
          _shipping = s.cast<Map<String, dynamic>>();
        });
      }
    } catch (_) {}
  }

  String _isoToDateInput(dynamic iso) {
    if (iso == null) return '';
    final s = iso.toString();
    if (s.length >= 10) return s.substring(0, 10);
    return '';
  }

  Future<void> _loadTransaction() async {
    setState(() {
      _loadingTx = true;
      _error = '';
    });
    try {
      final tx = await Api.get('/api/transactions/${widget.transactionId}') as Map<String, dynamic>;
      _client.text = (tx['clientName'] ?? '').toString();
      _shippingName.text = (tx['shippingCompanyName'] ?? '').toString();
      _shippingId.text = (tx['shippingCompanyId'] ?? '').toString();
      _declarationNumberInput.text = (tx['declarationNumber'] ?? '').toString();
      _declarationDateInput.text = _isoToDateInput(tx['declarationDate']);
      final loadedDeclarationType = (tx['declarationType'] ?? '').toString();
      _declarationType = _declarationTypeOptions.contains(loadedDeclarationType) ? loadedDeclarationType : '';
      final loadedPortType = (tx['portType'] ?? '').toString();
      _portType = _portTypeOptions.contains(loadedPortType) ? loadedPortType : '';
      _awb.text = (tx['airwayBill'] ?? '').toString();
      _hs.text = (tx['hsCode'] ?? '').toString();
      _goods.text = (tx['goodsDescription'] ?? '').toString();
      _origin.text = (tx['originCountry'] ?? 'AE').toString();
      _value.text = (tx['invoiceValue'] ?? '').toString();
      final loadedCurrency = (tx['invoiceCurrency'] ?? 'AED').toString().toUpperCase();
      _currency = const ['AED', 'USD', 'EUR', 'SAR'].contains(loadedCurrency) ? loadedCurrency : 'AED';
      _docStatus = (tx['documentStatus'] ?? 'copy_received').toString();
      _paymentStatus = (tx['paymentStatus'] ?? 'pending').toString();
      if (tx['invoiceToWeightRateAedPerKg'] != null) {
        _rate.text = tx['invoiceToWeightRateAedPerKg'].toString();
      }
      if (tx['goodsWeightKg'] != null) _weight.text = tx['goodsWeightKg'].toString();
      if (tx['containerCount'] != null) _containers.text = tx['containerCount'].toString();
      _containerArrival.text = _isoToDateInput(tx['containerArrivalDate']);
      _documentArrival.text = _isoToDateInput(tx['documentArrivalDate']);
      _fileNumber.text = (tx['fileNumber'] ?? '').toString();
      final nums = tx['containerNumbers'];
      if (nums is List) {
        _containerNumbers.text = nums.map((e) => e.toString()).join(', ');
      }
      if (tx['unitCount'] != null) _unitCount.text = tx['unitCount'].toString();
      _isStopped = tx['isStopped'] == true;
      _stopReason.text = (tx['stopReason'] ?? '').toString();
      if (tx['goodsQuantity'] != null) _qty.text = tx['goodsQuantity'].toString();
      _quality = tx['goodsQuality']?.toString();
      if (_quality != null && _quality!.isEmpty) _quality = null;
      _unit = tx['goodsUnit']?.toString();
      if (_unit != null && _unit!.isEmpty) _unit = null;
      _releaseCode = tx['releaseCode']?.toString();
      _clearanceStatus = tx['clearanceStatus']?.toString();
      final dutyNum = tx['customsDuty'];
      _customsDuty = dutyNum is num ? dutyNum.toDouble() : null;
      final att = tx['documentAttachments'];
      if (att is List) {
        _retainedDocs = att.cast<Map<String, dynamic>>();
      }
      _picked = [];
      _pickedCategories = [];
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loadingTx = false);
    }
  }

  Map<String, dynamic> _jsonBody() {
    final body = <String, dynamic>{
      'clientName': _client.text.trim(),
      'shippingCompanyName': _shippingName.text.trim(),
      'declarationNumber': _declarationNumberInput.text.trim(),
      'declarationDate': _declarationDateInput.text.trim(),
      'declarationType': _declarationType.trim(),
      'portType': _portType.trim(),
      'airwayBill': _awb.text.trim(),
      'hsCode': _hs.text.trim(),
      'goodsDescription': _goods.text.trim(),
      'originCountry': _origin.text.trim().toUpperCase(),
      'invoiceValue': double.tryParse(_value.text.trim()) ?? 0,
      'invoiceCurrency': _currency,
      'documentStatus': _docStatus,
      'paymentStatus': _paymentStatus,
    };
    final sid = _shippingId.text.trim();
    if (sid.isNotEmpty) body['shippingCompanyId'] = sid;
    if (_declarationNumberInput.text.trim().isEmpty) body.remove('declarationNumber');
    if (_declarationDateInput.text.trim().isEmpty) body.remove('declarationDate');
    if (_declarationType.trim().isEmpty) body.remove('declarationType');
    if (_portType.trim().isEmpty) body.remove('portType');
    void addD(String k, TextEditingController c) {
      final v = double.tryParse(c.text.trim());
      if (v != null) body[k] = v;
    }

    void addI(String k, TextEditingController c) {
      final v = int.tryParse(c.text.trim());
      if (v != null) body[k] = v;
    }

    final parsedWeight = double.tryParse(_weight.text.trim());
    if (parsedWeight == null) {
      final invoice = double.tryParse(_value.text.trim());
      final rate = double.tryParse(_rate.text.trim());
      if (invoice != null && rate != null && rate > 0) {
        body['goodsWeightKg'] = invoice / rate;
      }
    }
    addD('invoiceToWeightRateAedPerKg', _rate);
    addD('goodsWeightKg', _weight);
    addI('containerCount', _containers);
    addD('goodsQuantity', _qty);
    if (_quality != null && _quality!.isNotEmpty) body['goodsQuality'] = _quality;
    if (_unit != null && _unit!.isNotEmpty) body['goodsUnit'] = _unit;
    if (_containerArrival.text.trim().isNotEmpty) body['containerArrivalDate'] = _containerArrival.text.trim();
    if (_documentArrival.text.trim().isNotEmpty) body['documentArrivalDate'] = _documentArrival.text.trim();
    if (_fileNumber.text.trim().isNotEmpty) body['fileNumber'] = _fileNumber.text.trim();
    final containerNumbers = _containerNumbers.text
        .split(RegExp(r'[\n,]+'))
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
    if (containerNumbers.isNotEmpty) body['containerNumbers'] = containerNumbers;
    final unitCount = int.tryParse(_unitCount.text.trim());
    if (unitCount != null) body['unitCount'] = unitCount;
    body['isStopped'] = _isStopped;
    if (_stopReason.text.trim().isNotEmpty) body['stopReason'] = _stopReason.text.trim();
    return body;
  }

  Map<String, String> _multipartStringFields() {
    final b = _jsonBody();
    return b.map((k, v) => MapEntry(k, v == null ? '' : v.toString()));
  }

  List<Map<String, dynamic>> _filterClients() {
    final q = _client.text.trim().toLowerCase();
    if (q.isEmpty) return [];
    return _clients
        .where((c) {
          final name = (c['companyName'] ?? '').toString().toLowerCase();
          final trn = (c['trn'] ?? '').toString().toLowerCase();
          final imm = (c['immigrationCode'] ?? '').toString().toLowerCase();
          return name.contains(q) || trn.contains(q) || imm.contains(q);
        })
        .take(12)
        .toList();
  }

  List<Map<String, dynamic>> _filterShipping() {
    final q = _shippingName.text.trim().toLowerCase();
    if (q.isEmpty) return [];
    return _shipping
        .where((s) {
          final name = (s['companyName'] ?? '').toString().toLowerCase();
          final code = (s['code'] ?? '').toString().toLowerCase();
          return name.contains(q) || code.contains(q);
        })
        .take(12)
        .toList();
  }

  Future<void> _pickFiles() async {
    final r = await FilePicker.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: const ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
    );
    if (r == null || r.files.isEmpty) return;
    setState(() {
      _picked = r.files;
      _pickedCategories = List<String?>.filled(_picked.length, null);
    });
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      if (_isEdit) {
        final fields = _multipartStringFields();
        fields['existingAttachments'] = jsonEncode(_retainedDocs);
        if (_picked.isNotEmpty) {
          if (_pickedCategories.any((c) => c == null || c.isEmpty)) {
            throw Exception('Please select a category for each uploaded document.');
          }
          fields['documentPhotoCategories'] = jsonEncode(_pickedCategories);
        }
        await Api.putMultipart('/api/transactions/${widget.transactionId}', fields, _picked);
      } else {
        if (_picked.isEmpty) {
          await Api.post('/api/transactions', _jsonBody());
        } else {
          if (_pickedCategories.any((c) => c == null || c.isEmpty)) {
            throw Exception('Please select a category for each uploaded document.');
          }
          final fields = _multipartStringFields();
          fields['documentPhotoCategories'] = jsonEncode(_pickedCategories);
          await Api.postMultipart('/api/transactions', fields, _picked);
        }
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _client.dispose();
    _shippingName.dispose();
    _shippingId.dispose();
    _declarationNumberInput.dispose();
    _declarationDateInput.dispose();
    _awb.dispose();
    _hs.dispose();
    _goods.dispose();
    _origin.dispose();
    _value.dispose();
    _rate.dispose();
    _weight.dispose();
    _containers.dispose();
    _containerArrival.dispose();
    _documentArrival.dispose();
    _fileNumber.dispose();
    _containerNumbers.dispose();
    _unitCount.dispose();
    _stopReason.dispose();
    _qty.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (_loadingTx) {
      return Scaffold(
        appBar: AppBar(title: Text(_isEdit ? l10n.editTransaction : l10n.newTransaction)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (widget.role == 'accountant') {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.newTransaction)),
        body: Center(child: Padding(padding: const EdgeInsets.all(16), child: Text(l10n.accountantNoTransactionForm, textAlign: TextAlign.center))),
      );
    }

    final clientOpts = _filterClients();
    final shipOpts = _filterShipping();
    final invoice = double.tryParse(_value.text.trim());
    final rate = double.tryParse(_rate.text.trim());
    final derivedWeight = (invoice != null && rate != null && rate > 0) ? (invoice / rate) : null;

    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? l10n.editTransaction : l10n.newTransaction)),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          if (_isEdit) ...[
            Text('Read-only Transaction Fields', style: Theme.of(context).textTheme.titleMedium),
            if ((_releaseCode ?? '').isNotEmpty) _readonlyField(l10n.releaseCode, _releaseCode!),
            if (_customsDuty != null) _readonlyField(l10n.duty, _customsDuty!.toStringAsFixed(2)),
            if ((_clearanceStatus ?? '').isNotEmpty) _readonlyField(l10n.status, _clearanceStatus!),
            const SizedBox(height: 8),
          ],
          _field(_client, l10n.client, onChanged: (_) => setState(() {})),
          if (clientOpts.isNotEmpty)
            Card(
              child: Column(
                children: clientOpts
                    .map(
                      (c) => ListTile(
                        dense: true,
                        title: Text('${c['companyName']}'),
                        subtitle: Text('${c['trn'] ?? ''} ${c['immigrationCode'] ?? ''}'.trim()),
                        onTap: () {
                          _client.text = c['companyName'].toString();
                          setState(() {});
                        },
                      ),
                    )
                    .toList(),
              ),
            ),
          Text(l10n.typeToSearch, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          _field(_shippingName, l10n.shippingCompany, onChanged: (_) => setState(() {})),
          if (shipOpts.isNotEmpty)
            Card(
              child: Column(
                children: shipOpts
                    .map(
                      (s) => ListTile(
                        dense: true,
                        title: Text('${s['companyName']}'),
                        subtitle: Text('${s['code'] ?? ''}'),
                        onTap: () {
                          _shippingName.text = s['companyName'].toString();
                          _shippingId.text = s['id']?.toString() ?? '';
                          setState(() {});
                        },
                      ),
                    )
                    .toList(),
              ),
            ),
          _field(_shippingId, l10n.shippingCompanyIdOptional),
          _field(_declarationNumberInput, 'Declaration Number'),
          _field(_declarationDateInput, 'Declaration Date (YYYY-MM-DD)'),
          DropdownButtonFormField<String>(
            key: ValueKey('tx-declaration-type-${_declarationType.isEmpty ? 'none' : _declarationType}'),
            decoration: const InputDecoration(labelText: 'Declaration Type'),
            initialValue: _declarationType.isEmpty ? null : _declarationType,
            items: [
              DropdownMenuItem<String>(value: null, child: Text(l10n.optionalSelect)),
              ..._declarationTypeOptions.map(
                (type) => DropdownMenuItem<String>(value: type, child: Text(type)),
              ),
            ],
            onChanged: (v) => setState(() => _declarationType = v ?? ''),
          ),
          DropdownButtonFormField<String>(
            key: ValueKey('tx-port-type-${_portType.isEmpty ? 'none' : _portType}'),
            decoration: const InputDecoration(labelText: 'Port Type'),
            initialValue: _portType.isEmpty ? null : _portType,
            items: [
              DropdownMenuItem<String>(value: null, child: Text(l10n.optionalSelect)),
              ..._portTypeOptions.map(
                (type) => DropdownMenuItem<String>(value: type, child: Text(type)),
              ),
            ],
            onChanged: (v) => setState(() => _portType = v ?? ''),
          ),
          _field(_awb, l10n.airwayBill),
          _field(_hs, l10n.hsCode),
          _field(_origin, l10n.originCountry),
          _field(_value, l10n.invoiceValue, keyboard: TextInputType.number),
          DropdownButtonFormField<String>(
            key: ValueKey('tx-currency-$_currency'),
            decoration: const InputDecoration(labelText: 'Currency'),
            initialValue: _currency,
            items: const [
              DropdownMenuItem(value: 'AED', child: Text('AED')),
              DropdownMenuItem(value: 'USD', child: Text('USD')),
              DropdownMenuItem(value: 'EUR', child: Text('EUR')),
              DropdownMenuItem(value: 'SAR', child: Text('SAR')),
            ],
            onChanged: (v) => setState(() => _currency = v ?? 'AED'),
          ),
          _field(_rate, l10n.txRateAedPerKg, keyboard: const TextInputType.numberWithOptions(decimal: true)),
          _field(_weight, l10n.txGoodsWeightKg, keyboard: const TextInputType.numberWithOptions(decimal: true)),
          if (derivedWeight != null && _weight.text.trim().isEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text('${l10n.weightKg}: ${derivedWeight.toStringAsFixed(3)}', style: Theme.of(context).textTheme.bodySmall),
            ),
          _field(_containers, l10n.txContainerCount, keyboard: TextInputType.number),
          _field(_containerArrival, l10n.txContainerArrival),
          _field(_documentArrival, l10n.txDocumentArrival),
          _field(_fileNumber, 'File Number'),
          _field(_containerNumbers, 'Container Numbers', maxLines: 3),
          _field(_unitCount, 'Number of Units', keyboard: TextInputType.number),
          DropdownButtonFormField<bool>(
            key: ValueKey('tx-stop-$_isStopped'),
            decoration: const InputDecoration(labelText: 'Stop Transaction'),
            initialValue: _isStopped,
            items: const [
              DropdownMenuItem(value: false, child: Text('No')),
              DropdownMenuItem(value: true, child: Text('Yes')),
            ],
            onChanged: (v) => setState(() => _isStopped = v ?? false),
          ),
          if (_isStopped) _field(_stopReason, 'Stop Reason', maxLines: 2),
          _field(_qty, l10n.txGoodsQty, keyboard: const TextInputType.numberWithOptions(decimal: true)),
          DropdownButtonFormField<String?>(
            key: ValueKey('tx-quality-${_quality ?? 'none'}'),
            decoration: InputDecoration(labelText: l10n.txGoodsQuality),
            initialValue: _quality,
            items: [
              DropdownMenuItem<String?>(value: null, child: Text(l10n.optionalSelect)),
              DropdownMenuItem(value: 'new', child: Text(l10n.txQualityNew)),
              DropdownMenuItem(value: 'like_new', child: Text(l10n.txQualityLikeNew)),
              DropdownMenuItem(value: 'used', child: Text(l10n.txQualityUsed)),
              DropdownMenuItem(value: 'refurbished', child: Text(l10n.txQualityRefurbished)),
              DropdownMenuItem(value: 'damaged', child: Text(l10n.txQualityDamaged)),
              DropdownMenuItem(value: 'mixed', child: Text(l10n.txQualityMixed)),
            ],
            onChanged: (v) => setState(() => _quality = v),
          ),
          DropdownButtonFormField<String?>(
            key: ValueKey('tx-unit-${_unit ?? 'none'}'),
            decoration: InputDecoration(labelText: l10n.txGoodsUnit),
            initialValue: _unit,
            items: [
              DropdownMenuItem<String?>(value: null, child: Text(l10n.optionalSelect)),
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
          DropdownButtonFormField<String>(
            key: ValueKey('tx-doc-status-$_docStatus'),
            decoration: InputDecoration(labelText: l10n.documentStatus),
            initialValue: _docStatus,
            items: [
              DropdownMenuItem(value: 'copy_received', child: Text(l10n.txDocumentStatusCopy)),
              DropdownMenuItem(value: 'original_received', child: Text(l10n.txDocumentStatusOriginal)),
              DropdownMenuItem(value: 'telex_release', child: Text(l10n.txDocumentStatusTelex)),
            ],
            onChanged: (v) => setState(() => _docStatus = v ?? 'copy_received'),
          ),
          DropdownButtonFormField<String>(
            key: ValueKey('tx-payment-status-$_paymentStatus'),
            decoration: InputDecoration(labelText: l10n.paymentStatus),
            initialValue: _paymentStatus,
            items: [
              DropdownMenuItem(value: 'pending', child: Text(l10n.txPaymentPending)),
              DropdownMenuItem(value: 'paid', child: Text(l10n.txPaymentPaid)),
            ],
            onChanged: widget.role == 'employee' ? null : (v) => setState(() => _paymentStatus = v ?? 'pending'),
          ),
          const SizedBox(height: 8),
          _field(_goods, l10n.goodsDescription, maxLines: 3),
          const SizedBox(height: 12),
          Text(l10n.documentPhotosSection, style: Theme.of(context).textTheme.titleSmall),
          Text(l10n.txAttachDocs, style: Theme.of(context).textTheme.bodySmall),
          if (_isEdit && _retainedDocs.isNotEmpty)
            ..._retainedDocs.map(
              (d) => ListTile(
                title: Text('${d['originalName']}'),
                subtitle: (d['category'] ?? '').toString().isNotEmpty ? Text(_docCategoryLabel('${d['category']}')) : null,
                trailing: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => setState(() => _retainedDocs.removeWhere((x) => x['path'] == d['path'])),
                ),
              ),
            ),
          OutlinedButton.icon(onPressed: _pickFiles, icon: const Icon(Icons.attach_file), label: Text(l10n.txPickFiles)),
          if (_picked.isNotEmpty) ...[
            Text('${_picked.length} ${l10n.txPickFiles}'),
            const SizedBox(height: 8),
            ...List.generate(_picked.length, (idx) {
              final f = _picked[idx];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: DropdownButtonFormField<String?>(
                  key: ValueKey('doc-cat-$idx-${_pickedCategories[idx] ?? 'none'}'),
                  decoration: InputDecoration(labelText: '${f.name} - Category'),
                  initialValue: _pickedCategories[idx],
                  items: [
                    const DropdownMenuItem<String?>(value: null, child: Text('Select category')),
                    ..._documentCategoryOptions.map(
                      (c) => DropdownMenuItem<String?>(value: c, child: Text(_docCategoryLabel(c))),
                    ),
                  ],
                  onChanged: (v) => setState(() => _pickedCategories[idx] = v),
                ),
              );
            }),
          ],
          if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 8),
          FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? l10n.saving : l10n.save)),
        ],
      ),
    );
  }

  Widget _field(TextEditingController c, String label, {TextInputType keyboard = TextInputType.text, int maxLines = 1, void Function(String)? onChanged}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextField(
        controller: c,
        keyboardType: keyboard,
        maxLines: maxLines,
        onChanged: onChanged,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }

  Widget _readonlyField(String label, String value) {
    return Card(
      child: ListTile(
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(value),
      ),
    );
  }

  String _docCategoryLabel(String value) {
    switch (value) {
      case 'bill_of_lading':
        return 'Bill of Lading';
      case 'certificate_of_origin':
        return 'Certificate of Origin';
      case 'invoice':
        return 'Invoice';
      case 'packing_list':
        return 'Packing List';
      default:
        return value;
    }
  }
}
