import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'l10n/app_localizations.dart';

class LocationMapPicker extends StatefulWidget {
  final double? latitude;
  final double? longitude;
  final void Function(double? lat, double? lng) onChanged;

  const LocationMapPicker({
    super.key,
    this.latitude,
    this.longitude,
    required this.onChanged,
  });

  @override
  State<LocationMapPicker> createState() => _LocationMapPickerState();
}

class _LocationMapPickerState extends State<LocationMapPicker> {
  late final MapController _mapController;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  void _handleTap(TapPosition tapPosition, LatLng point) {
    widget.onChanged(point.latitude, point.longitude);
  }

  void _clearLocation() {
    widget.onChanged(null, null);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final hasLocation = widget.latitude != null && widget.longitude != null;
    final center = hasLocation
        ? LatLng(widget.latitude!, widget.longitude!)
        : const LatLng(25.2048, 55.2708); // Dubai default

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              hasLocation
                  ? '${l10n.latitudeOptional}: ${widget.latitude!.toStringAsFixed(4)}, ${widget.longitude!.toStringAsFixed(4)}'
                  : l10n.shippingLatLngBothOrEmpty,
              style: TextStyle(
                color: hasLocation ? Colors.black87 : Colors.grey.shade600,
                fontSize: 13,
              ),
            ),
            if (hasLocation)
              TextButton(
                onPressed: _clearLocation,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(l10n.cancel, style: const TextStyle(fontSize: 13)),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          height: 200,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          clipBehavior: Clip.antiAlias,
          child: FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: center,
              initialZoom: hasLocation ? 13.0 : 8.0,
              onTap: _handleTap,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.farmanholdingbv.tracker',
              ),
              if (hasLocation)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: center,
                      width: 40,
                      height: 40,
                      alignment: Alignment.topCenter,
                      child: const Icon(
                        Icons.location_on,
                        size: 40,
                        color: Color(0xFFE63946),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ],
    );
  }
}
