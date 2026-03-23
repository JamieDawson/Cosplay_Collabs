import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { apiUrl } from "../../config/api";

// Fix default icon paths so markers don't 404
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
  lat?: number | null;
  lng?: number | null;
}

type LatLng = [number, number];

type MarkerItem = {
  id: number;
  position: LatLng;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  const t = String(s);
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(m: MarkerItem): string {
  const location =
    [m.city, m.state, m.country].filter(Boolean).join(", ") || "—";
  return `<div class="text-sm">
    <div class="font-semibold mb-1">${escapeHtml(m.title)}</div>
    ${m.description ? `<div class="mb-1 text-gray-700 line-clamp-3">${escapeHtml(m.description)}</div>` : ""}
    <div class="text-xs text-gray-500">${escapeHtml(location)}</div>
  </div>`;
}

/** Renders markers in a Leaflet MarkerClusterGroup. Clicking (when zoomed in enough) navigates to the location page (ads by country/state/city). */
function MarkerClusterLayer({ markers }: { markers: MarkerItem[] }) {
  const map = useMap();
  const navigate = useNavigate();

  useEffect(() => {
    const LMC = L as typeof L & { markerClusterGroup: (opts?: object) => L.LayerGroup };
    if (!LMC.markerClusterGroup || !map) return;

    const MIN_NAV_ZOOM = 6;

    const group = LMC.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 80,
      chunkDelay: 50,
      singleMarkerMode: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#22c55e;color:white;font-weight:700;font-size:14px;box-shadow:0 0 0 2px #bbf7d0;">${count}</div>`,
          className: "",
          iconSize: L.point(36, 36, true),
        });
      },
    });

    markers.forEach((m) => {
      const marker = L.marker(m.position, {
        adData: m,
      } as L.MarkerOptions);
      // Popup is optional now; main interaction is cluster click -> navigate
      marker.bindPopup(popupHtml(m), { className: "cosplay-popup" });
      group.addLayer(marker);
    });
    map.addLayer(group);

    const groupWithHandler = group as L.LayerGroup & { _zoomOrSpiderfy?: (e: L.LeafletEvent) => void };
    if (typeof groupWithHandler._zoomOrSpiderfy === "function") {
      group.off("clusterclick", groupWithHandler._zoomOrSpiderfy, group);
    }

    const goToLocation = (adData?: MarkerItem) => {
      if (adData?.country && adData?.state && adData?.city) {
        const path = `/places/${encodeURIComponent(adData.country)}/${encodeURIComponent(
          adData.state
        )}/${encodeURIComponent(adData.city)}`;
        navigate(path);
      }
    };

    // When clicking a cluster (2+ markers)
    group.on("clusterclick", (e: L.LeafletEvent) => {
      const cluster = (e as unknown as { layer: { getAllChildMarkers: () => L.Marker[]; zoomToBounds: () => void } }).layer;
      // At low zooms, just zoom into the cluster instead of navigating
      if (map.getZoom() < MIN_NAV_ZOOM) {
        cluster.zoomToBounds();
        return;
      }
      const children = cluster.getAllChildMarkers();
      const first = children[0];
      const adData = (first?.options as { adData?: MarkerItem })?.adData;
      goToLocation(adData);
    });

    // When clicking a single marker (in singleMarkerMode, shown as a green circle with "1")
    group.on("click", (e: L.LeafletEvent) => {
      const marker = (e as unknown as { layer: L.Marker }).layer;
      // At low zooms, zoom into the marker instead of navigating
      if (map.getZoom() < MIN_NAV_ZOOM) {
        map.setView(marker.getLatLng(), MIN_NAV_ZOOM);
        return;
      }
      const adData = (marker?.options as { adData?: MarkerItem })?.adData;
      goToLocation(adData);
    });

    return () => {
      map.removeLayer(group);
    };
  }, [map, markers, navigate]);

  return null;
}

const CosplayMap: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(apiUrl("/api/ads/all"));
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
      .filter(
        (ad) =>
          ad.lat != null &&
          ad.lng != null &&
          !Number.isNaN(Number(ad.lat)) &&
          !Number.isNaN(Number(ad.lng))
      )
      .map((ad) => ({
        id: ad.id,
        position: [Number(ad.lat), Number(ad.lng)] as LatLng,
        title: ad.title,
        description: ad.description,
        city: ad.city,
        state: ad.state,
        country: ad.country,
      }));
  }, [ads]);

  const defaultCenter: LatLng = [37.7749, -122.4194];

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 text-center">
        Cosplayer Locations Map
      </h1>
      <p className="text-sm md:text-base text-gray-600 mb-4 text-center max-w-2xl mx-auto">
        Click a cluster number (e.g. 3) to go to the page that lists all ads in
        that location. Click a single marker to see its popup.
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

        <MarkerClusterLayer markers={markers} />
      </MapContainer>
    </div>
  );
};

export default CosplayMap;
