export interface MapLayer {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  color: string;
  icon?: string; // Make icon optional so it doesn't cause TypeScript errors
}