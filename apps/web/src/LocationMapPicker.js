import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import L from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
const DefaultIcon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
L.Marker.prototype.options.icon = DefaultIcon;
const DEFAULT_CENTER = [25.2048, 55.2708];
function MapClickHandler({ onPick }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}
export default function LocationMapPicker({ latitude, longitude, onChange, hint, clearLabel }) {
    const center = useMemo(() => {
        if (latitude != null && longitude != null && !Number.isNaN(latitude) && !Number.isNaN(longitude)) {
            return [latitude, longitude];
        }
        return DEFAULT_CENTER;
    }, [latitude, longitude]);
    const hasPin = latitude != null && longitude != null;
    const mapKey = hasPin ? `${latitude.toFixed(5)},${longitude.toFixed(5)}` : "no-marker";
    return (_jsxs("div", { className: "location-map-picker col-12", children: [_jsx("p", { className: "muted map-hint", children: hint }), _jsxs(MapContainer, { center: center, zoom: hasPin ? 13 : 8, className: "location-map-container", scrollWheelZoom: true, children: [_jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(MapClickHandler, { onPick: (lat, lng) => onChange(lat, lng) }), hasPin ? _jsx(Marker, { position: [latitude, longitude] }) : null] }, mapKey), hasPin ? (_jsx("button", { type: "button", className: "btn btn-outline-secondary btn-sm map-clear", onClick: () => onChange(null, null), children: clearLabel })) : null] }));
}
