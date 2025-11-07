export interface StatDefinition {
  label: string;
  key: string;
  id: string;
  isPercentage?: boolean;
  toolTip?: string;
  prevKey?: string;
  secondaryKey?: string; // For displaying x/y format (e.g., "5/10")
}
