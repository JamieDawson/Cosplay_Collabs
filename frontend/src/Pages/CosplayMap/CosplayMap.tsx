import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { locationData } from "../../Data/locations";

// Fix default icon paths so markers don't 404
// (Create React App + Leaflet needs this override.)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Ad {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
}

type LatLng = [number, number];

// Basic coordinate lookup for the supported cities.
// You can expand this over time as you add more locations.
const cityCoordinates: Record<string, LatLng> = {
  // USA, CA
  "USA-CA-San Francisco": [37.7749, -122.4194],
  "USA-CA-Los Angeles": [34.0522, -118.2437],
  "USA-CA-San Diego": [32.7157, -117.1611],
  // USA, NY
  "USA-NY-New York": [40.7128, -74.006],
  "USA-NY-Buffalo": [42.8864, -78.8784],
  "USA-NY-Rochester": [43.1566, -77.6088],
  // Canada, ON
  "Canada-ON-Toronto": [43.6532, -79.3832],
  "Canada-ON-Ottawa": [45.4215, -75.6972],
  "Canada-ON-Hamilton": [43.2557, -79.8711],
  // Canada, BC
  "Canada-BC-Vancouver": [49.2827, -123.1207],
  "Canada-BC-Victoria": [48.4284, -123.3656],
  "Canada-BC-Kelowna": [49.8879, -119.496],
};

const getCityKey = (country?: string | null, state?: string | null, city?: string | null) => {
  if (!country || !state || !city) return null;
  return `${country}-${state}-${city}`;
};

const CosplayMap: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:3000/api/ads/all");
        if (!response.ok) {
          throw new Error("Failed to load ads for map");
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setAds(data.data);
        } else {
          setError("Unexpected response from server");
        }
      } catch (err) {
        console.error("Error fetching ads for map:", err);
        setError(
          err instanceof Error ? err.message : "Error fetching ads for map"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  const markers = useMemo(() => {
    return ads
      .map((ad) => {
        const key = getCityKey(ad.country, ad.state, ad.city);
        if (!key) return null;
        const coords = cityCoordinates[key];
        if (!coords) return null;

        return {
          id: ad.id,
          position: coords as LatLng,
          title: ad.title,
          description: ad.description,
          city: ad.city,
          state: ad.state,
          country: ad.country,
        };
      })
      .filter(Boolean) as Array<{
      id: number;
      position: LatLng;
      title: string;
      description: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
    }>;
  }, [ads]);

  const defaultCenter: LatLng = [37.7749, -122.4194];

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 text-center">
        Cosplayer Locations Map
      </h1>
      <p className="text-sm md:text-base text-gray-600 mb-4 text-center max-w-2xl mx-auto">
        This map shows markers for each ad based on the country, state, and city
        selected when creating the ad. When multiple people post from the same
        city (for example, San Francisco), their markers will cluster together.
      </p>

      {loading && (
        <p className="text-center text-gray-600 mb-2">Loading locations…</p>
      )}
      {error && (
        <p className="text-center text-red-600 mb-2">
          {error} — please try again later.
        </p>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={4}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker clustering is provided by leaflet.markercluster CSS/JS */}
        {markers.map((m) => (
          <Marker key={m.id} position={m.position}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{m.title}</div>
                {m.description && (
                  <div className="mb-1 text-gray-700 line-clamp-3">
                    {m.description}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {m.city}, {m.state}, {m.country}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CosplayMap;
