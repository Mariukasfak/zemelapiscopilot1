// This file provides type definitions for react-leaflet components

import * as L from 'leaflet';

declare module 'react-leaflet' {
  interface MapContainerProps extends L.MapOptions {
    center: L.LatLngExpression;
    zoom: number;
    style?: React.CSSProperties;
    className?: string;
    id?: string;
    placeholder?: React.ReactNode;
    whenReady?: () => void;
    whenCreated?: (map: L.Map) => void;
    eventHandlers?: { [key: string]: (...args: any[]) => void };
    maxBoundsViscosity?: number;
    children?: React.ReactNode;
    ref?: React.Ref<L.Map>;
  }
}
