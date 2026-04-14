import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart' as intl;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';

import 'api.dart';
import 'l10n/app_localizations.dart';
import 'transaction_form.dart';

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

  Future<void> _delete() async {
    final l10n = AppLocalizations.of(context)!;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.deleteTransaction),
        content: Text(l10n.confirmDeleteTransaction),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.cancel)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l10n.delete)),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await Api.delete('/api/transactions/${widget.id}');
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _openShippingPaper() async {
    final l10n = AppLocalizations.of(context)!;
    final t = tx!;
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    // Default PDF fonts (Helvetica) have no Arabic glyphs — embed Noto Sans Arabic (OFL).
    final pw.Font pdfFont;
    try {
      pdfFont = pw.Font.ttf(await rootBundle.load('assets/fonts/NotoSansArabic-Regular.ttf'));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not load PDF font: $e')));
      return;
    }
    final pdfTheme = pw.ThemeData.withFont(
      base: pdfFont,
      bold: pdfFont,
      italic: pdfFont,
      boldItalic: pdfFont,
    );
    final pdf = pw.Document();
    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        theme: pdfTheme,
        textDirection: isRtl ? pw.TextDirection.rtl : pw.TextDirection.ltr,
        build: (ctx) => [
          pw.Header(level: 0, child: pw.Text(l10n.shippingPaperHeading, style: pw.TextStyle(font: pdfFont))),
          pw.Paragraph(text: l10n.shippingPaperSub, style: pw.TextStyle(font: pdfFont)),
          pw.SizedBox(height: 12),
          _pdfRow(l10n.toShippingCompany, '${t['shippingCompanyName']}', pdfFont),
          _pdfRow(l10n.fromClient, '${t['clientName']}', pdfFont),
          _pdfRow(l10n.declaration, '${t['declarationNumber']}', pdfFont),
          _pdfRow(l10n.airwayBillShort, '${t['airwayBill']}', pdfFont),
          _pdfRow(l10n.hsCode, '${t['hsCode']}', pdfFont),
          _pdfRow(l10n.origin, '${t['originCountry']}', pdfFont),
          _pdfRow(l10n.valueAed, '${t['invoiceValue']}', pdfFont),
          _pdfRow(l10n.releaseCode, '${t['releaseCode'] ?? l10n.notIssued}', pdfFont),
          if (t['goodsWeightKg'] != null) _pdfRow(l10n.weightKg, '${t['goodsWeightKg']}', pdfFont),
          if (t['goodsQuantity'] != null) _pdfRow(l10n.quantity, '${t['goodsQuantity']}', pdfFont),
          pw.SizedBox(height: 8),
          pw.Text(l10n.goods, style: pw.TextStyle(font: pdfFont, fontWeight: pw.FontWeight.bold)),
          pw.Paragraph(style: pw.TextStyle(font: pdfFont), text: '${t['goodsDescription']}'),
        ],
      ),
    );
    final bytes = await pdf.save();
    try {
      await Printing.layoutPdf(onLayout: (format) async => bytes);
    } on MissingPluginException catch (_) {
      // Linux desktop / some embeds: no native printing plugin — share PDF instead.
      await SharePlus.instance.share(
        ShareParams(
          files: [
            XFile.fromData(
              bytes,
              name: 'shipping_paper_${widget.id}.pdf',
              mimeType: 'application/pdf',
            ),
          ],
          subject: l10n.shippingPaperHeading,
          title: l10n.shippingPaperHeading,
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  pw.Widget _pdfRow(String k, String v, pw.Font font) => pw.Padding(
        padding: const pw.EdgeInsets.only(bottom: 4),
        child: pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.SizedBox(
              width: 140,
              child: pw.Text('$k:', style: pw.TextStyle(font: font, fontWeight: pw.FontWeight.bold)),
            ),
            pw.Expanded(child: pw.Text(v, style: pw.TextStyle(font: font))),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context).toLanguageTag();
    final numberFormat = intl.NumberFormat.decimalPattern(locale);
    final canEdit = widget.role != 'accountant';
    final canAccounting = widget.role == 'manager' || widget.role == 'accountant';
    final paid = tx?['paymentStatus'] == 'paid';
    final doc = tx?['documentStatus']?.toString() ?? '';
    final canRelease = paid && (doc == 'original_received' || doc == 'telex_release');

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.details),
        actions: [
          if (tx != null && canEdit)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () async {
                final r = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(
                    builder: (_) => TransactionFormPage(role: widget.role, transactionId: widget.id),
                  ),
                );
                if (r == true) {
                  await load();
                  if (mounted) setState(() {});
                }
              },
            ),
          if (tx != null)
            IconButton(
              icon: const Icon(Icons.picture_as_pdf_outlined),
              tooltip: l10n.shippingPaper,
              onPressed: _openShippingPaper,
            ),
          if (tx != null && canEdit)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: _delete,
            ),
        ],
      ),
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
                    if (tx!['declarationDate'] != null)
                      _kv('Declaration Date', _formatDateTime('${tx!['declarationDate']}', locale)),
                    if (tx!['declarationType'] != null && tx!['declarationType'].toString().isNotEmpty)
                      _kv('Declaration Type', '${tx!['declarationType']}'),
                    if (tx!['portType'] != null && tx!['portType'].toString().isNotEmpty) _kv('Port Type', '${tx!['portType']}'),
                    if (tx!['shippingCompanyId'] != null && tx!['shippingCompanyId'].toString().isNotEmpty)
                      _kv(l10n.shippingCompanyIdOptional, '${tx!['shippingCompanyId']}'),
                    _kv(l10n.airwayBill, '${tx!['airwayBill']}'),
                    _kv(l10n.hsCode, '${tx!['hsCode']}'),
                    _kv(l10n.goods, '${tx!['goodsDescription']}'),
                    _kv(l10n.origin, '${tx!['originCountry']}'),
                    _kv(l10n.invoiceValue, numberFormat.format(tx!['invoiceValue'] ?? 0)),
                    _kv(l10n.duty, numberFormat.format(tx!['customsDuty'] ?? 0)),
                    _kv(l10n.document, '${tx!['documentStatus']}'),
                    _kv(l10n.status, '${tx!['clearanceStatus']}'),
                    _kv(l10n.payment, '${tx!['paymentStatus']}'),
                    if (tx!['containerCount'] != null) _kv(l10n.txContainerCount, '${tx!['containerCount']}'),
                    if (tx!['goodsWeightKg'] != null) _kv(l10n.txGoodsWeightKg, '${tx!['goodsWeightKg']}'),
                    if (tx!['invoiceToWeightRateAedPerKg'] != null)
                      _kv(l10n.txRateAedPerKg, '${tx!['invoiceToWeightRateAedPerKg']}'),
                    if (tx!['containerArrivalDate'] != null) _kv(l10n.txContainerArrival, '${tx!['containerArrivalDate']}'),
                    if (tx!['documentArrivalDate'] != null) _kv(l10n.txDocumentArrival, '${tx!['documentArrivalDate']}'),
                    if (tx!['fileNumber'] != null && tx!['fileNumber'].toString().isNotEmpty)
                      _kv('File Number', '${tx!['fileNumber']}'),
                    if (tx!['containerNumbers'] is List && (tx!['containerNumbers'] as List).isNotEmpty)
                      _kv('Container Numbers', (tx!['containerNumbers'] as List).map((e) => '$e').join(', ')),
                    if (tx!['unitCount'] != null) _kv('Number of Units', '${tx!['unitCount']}'),
                    _kv('Stopped', tx!['isStopped'] == true ? 'Yes' : 'No'),
                    if (tx!['isStopped'] == true && tx!['stopReason'] != null && tx!['stopReason'].toString().isNotEmpty)
                      _kv('Stop Reason', '${tx!['stopReason']}'),
                    if (tx!['goodsQuantity'] != null) _kv(l10n.txGoodsQty, '${tx!['goodsQuantity']}'),
                    if (tx!['goodsUnit'] != null) _kv(l10n.txGoodsUnit, _unitLabel('${tx!['goodsUnit']}', l10n)),
                    _kv(l10n.createdAt, _formatDateTime('${tx!['createdAt']}', locale)),
                    const SizedBox(height: 12),
                    if ((tx!['documentAttachments'] as List?)?.isNotEmpty ?? false) ...[
                      Text(l10n.documentPhotosSection, style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 8),
                      ...((tx!['documentAttachments'] as List).cast<Map<String, dynamic>>().map(_attachmentTile)),
                    ],
                    const SizedBox(height: 12),
                    if (widget.role == 'manager' || widget.role == 'employee')
                      FilledButton.tonal(
                        onPressed: () => _action('original-bl'),
                        child: Text(l10n.originalBl),
                      ),
                    if (canAccounting) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          FilledButton(
                            onPressed: paid ? null : () => _action('pay'),
                            child: Text(l10n.markPaid),
                          ),
                          FilledButton(
                            onPressed: !canRelease ? null : () => _action('release'),
                            child: Text(l10n.release),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
    );
  }

  Widget _attachmentTile(Map<String, dynamic> a) {
    final path = (a['path'] ?? '').toString();
    final name = (a['originalName'] ?? '').toString();
    final isImg = RegExp(r'\.(png|jpe?g|gif|webp)$', caseSensitive: false).hasMatch(name);
    return Card(
      child: ListTile(
        title: Text(name),
        onTap: () => _openAttachment(path, name),
        subtitle: isImg
            ? SizedBox(
                height: 120,
                child: FutureBuilder(
                  future: Api.getBytes(path),
                  builder: (context, snap) {
                    if (snap.hasError) return Text('${snap.error}');
                    if (!snap.hasData) return const Center(child: CircularProgressIndicator());
                    return Image.memory(snap.data!, fit: BoxFit.contain);
                  },
                ),
              )
            : const Text('PDF / file (tap to open)'),
      ),
    );
  }

  String _formatDateTime(String raw, String locale) {
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return intl.DateFormat.yMd(locale).add_jm().format(dt.toLocal());
  }

  String _unitLabel(String unit, AppLocalizations l10n) {
    switch (unit) {
      case 'kg':
        return l10n.txUnitKg;
      case 'ton':
        return l10n.txUnitTon;
      case 'piece':
        return l10n.txUnitPiece;
      case 'carton':
        return l10n.txUnitCarton;
      case 'pallet':
        return l10n.txUnitPallet;
      case 'cbm':
        return l10n.txUnitCbm;
      case 'liter':
        return l10n.txUnitLiter;
      case 'set':
        return l10n.txUnitSet;
      default:
        return unit;
    }
  }

  Future<void> _openAttachment(String path, String name) async {
    try {
      final bytes = await Api.getBytes(path);
      final ext = name.toLowerCase();
      final mime = ext.endsWith('.pdf') ? 'application/pdf' : null;
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile.fromData(bytes, name: name, mimeType: mime)],
          title: name,
          subject: name,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Widget _kv(String k, String v) => Card(
        child: ListTile(
          title: Text(k, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text(v),
        ),
      );
}
