export type BaseLayer = {
  id: string;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
};

export const BASE_LAYERS: BaseLayer[] = [
  {
    id: "osm",
    label: "Calle",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  {
    id: "sat",
    label: "Satélite",
    // Esri World Imagery uses {z}/{y}/{x} order.
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  {
    id: "topo",
    label: "Relieve",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; OpenStreetMap, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
    subdomains: "abc",
  },
  {
    id: "cycle",
    label: "Ciclovías",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attribution:
      '<a href="https://www.cyclosm.org">CyclOSM</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
    subdomains: "abc",
  },
];

export function layerById(id: string): BaseLayer {
  return BASE_LAYERS.find((l) => l.id === id) ?? BASE_LAYERS[0];
}
