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
(L.Marker.prototype as any).options.icon = DefaultIcon;

const DEFAULT_CENTER: [number, number] = [25.2048, 55.2708];

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  hint: string;
  clearLabel: string;
};

export default function LocationMapPicker({ latitude, longitude, onChange, hint, clearLabel }: Props) {
  const center: [number, number] = useMemo(() => {
    if (latitude != null && longitude != null && !Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      return [latitude, longitude];
    }
    return DEFAULT_CENTER;
  }, [latitude, longitude]);

  const hasPin = latitude != null && longitude != null;
  const mapKey = hasPin ? `${latitude.toFixed(5)},${longitude.toFixed(5)}` : "no-marker";

  return (
    <div className="location-map-picker">
      <p className="muted map-hint">{hint}</p>
      <MapContainer
        key={mapKey}
        center={center}
        zoom={hasPin ? 13 : 8}
        className="location-map-container"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={(lat, lng) => onChange(lat, lng)} />
        {hasPin ? <Marker position={[latitude, longitude]} /> : null}
      </MapContainer>
      {hasPin ? (
        <button type="button" className="link-button map-clear" onClick={() => onChange(null, null)}>
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}
