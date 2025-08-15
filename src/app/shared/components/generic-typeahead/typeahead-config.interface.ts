export interface TypeaheadDisplayField {
  key: string;
  label?: string;
  isPrimary?: boolean;
  isSecondary?: boolean;
}

export interface TypeaheadSearchKey {
  name: string;
  weight: number;
}

export interface TypeaheadConfig<T> {
  title: string;
  searchPlaceholder: string;
  loadingText: string;
  noDataText?: string;
  displayFields: TypeaheadDisplayField[];
  searchKeys: TypeaheadSearchKey[];
  identifierKey: keyof T;
  maxSelections?: number;
  showImages?: boolean;
  imageUrlGenerator?: (item: T) => string;
  customDisplayLogic?: (item: T) => { cssClass?: string; disabled?: boolean };
  customDisplayFormatter?: (item: T, fieldKey: string) => string;
  searchMode: 'local' | 'api';
  apiSearchFn?: (searchTerm: string) => Promise<{ items: T[] }>;
}