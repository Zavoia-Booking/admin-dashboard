export type ParamType = 'string' | 'number' | 'email' | 'url' | 'date' | 'time';

export type TemplateCategory = 'security' | 'billing' | 'appointment' | 'lifecycle' | 'team' | 'welcome' | 'marketplace' | 'other';

export type ParamDef = {
  name: string;
  type: ParamType;
  required: boolean;
  defaultValue: string | number;
  description?: string;
};

export type TemplateMetadata = {
  key: string;
  label: string;
  category: TemplateCategory;
  description: string;
  params: ParamDef[];
};

export type PreviewResult = {
  subject: string;
  html: string;
  text: string;
};

export type Locale = 'en' | 'ro';

export type PreviewRequest = {
  templateKey: string;
  locale: Locale;
  params: Record<string, string | number>;
};

export type SendRequest = {
  templateKey: string;
  recipient: string;
  locale: Locale;
  params: Record<string, string | number>;
};
