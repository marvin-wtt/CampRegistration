export interface IconMapping {
  value: string | number;
  icon: string;
  color: string;
}

export interface IconMappingFallback {
  icon?: string | undefined;
  color?: string | undefined;
}

export interface IconMappingOptions {
  mappings?: IconMapping[];
  fallback?: IconMappingFallback | undefined;
}
