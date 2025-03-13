declare module 'leaflet.markercluster' {
  import * as L from 'leaflet';
  
  declare namespace MarkerClusterGroup {
    interface Options {
      showCoverageOnHover?: boolean;
      zoomToBoundsOnClick?: boolean;
      spiderfyOnMaxZoom?: boolean;
      removeOutsideVisibleBounds?: boolean;
      animate?: boolean;
      animateAddingMarkers?: boolean;
      disableClusteringAtZoom?: number;
      maxClusterRadius?: number;
      polygonOptions?: L.PolylineOptions;
      singleMarkerMode?: boolean;
      spiderLegPolylineOptions?: L.PolylineOptions;
      spiderfyDistanceMultiplier?: number;
      iconCreateFunction?: (cluster: L.MarkerCluster) => L.Icon | L.DivIcon;
    }
  }

  declare class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: MarkerClusterGroup.Options);
    addLayer(layer: L.Layer): this;
    addLayers(layers: L.Layer[]): this;
    removeLayers(layers: L.Layer[]): this;
    clearLayers(): this;
    hasLayer(layer: L.Layer): boolean;
    zoomToShowLayer(layer: L.Layer, callback?: () => void): void;
  }

  export = MarkerClusterGroup;
}
