export type ShareNumberField<T extends Record<string, string>> = {
  key: keyof T & string;
  param: string;
  type: 'number';
  min?: number;
  max?: number;
  integer?: boolean;
  include?: (values: Partial<T>) => boolean;
};

export type ShareEnumField<T extends Record<string, string>> = {
  key: keyof T & string;
  param: string;
  type: 'enum';
  options: readonly string[];
  include?: (values: Partial<T>) => boolean;
};

export type ShareField<T extends Record<string, string>> = ShareNumberField<T> | ShareEnumField<T>;

export type ShareSchema<T extends Record<string, string>> = {
  fields: readonly ShareField<T>[];
};

export type ParsedShareState<T extends Record<string, string>> = {
  values: Partial<T>;
  loaded: boolean;
  ignoredInvalid: boolean;
};
