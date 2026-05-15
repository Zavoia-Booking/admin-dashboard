import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Loader2, Send, Eye, Mail, Code2, AlertCircle, Sun, Moon } from 'lucide-react';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { selectCurrentUser } from '../../auth/selectors';
import { cn } from '../../../shared/lib/utils';
import { emailTestApi } from '../api';
import type { Locale, PreviewResult, TemplateMetadata } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  billing: 'Billing',
  appointment: 'Appointment',
  lifecycle: 'Lifecycle',
  team: 'Team',
  welcome: 'Welcome',
  marketplace: 'Marketplace',
  other: 'Other',
};

const CATEGORY_ORDER = ['security', 'billing', 'appointment', 'team', 'welcome', 'marketplace', 'lifecycle', 'other'];

function groupByCategory(templates: TemplateMetadata[]): Record<string, TemplateMetadata[]> {
  const groups: Record<string, TemplateMetadata[]> = {};
  for (const t of templates) {
    (groups[t.category] ??= []).push(t);
  }
  for (const k of Object.keys(groups)) groups[k].sort((a, b) => a.label.localeCompare(b.label));
  return groups;
}

// Unwrap `@media (prefers-color-scheme: dark) { ... }` so its rules apply
// unconditionally. Lets the preview iframe show dark-mode rendering without
// requiring the OS to be in dark mode. Brace-balanced so nested rule blocks
// are handled correctly.
function forceDarkMode(html: string): string {
  const marker = '@media (prefers-color-scheme: dark) {';
  const start = html.indexOf(marker);
  if (start === -1) return html;
  let depth = 1;
  let i = start + marker.length;
  while (i < html.length && depth > 0) {
    const ch = html[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  if (depth !== 0) return html;
  const inner = html.slice(start + marker.length, i);
  return html.slice(0, start) + inner + html.slice(i + 1);
}

const EmailTestPage = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [templates, setTemplates] = useState<TemplateMetadata[] | null>(null);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [locale, setLocale] = useState<Locale>('en');
  const [recipient, setRecipient] = useState<string>(currentUser?.email || '');
  const [params, setParams] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<'html' | 'text'>('html');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    emailTestApi
      .getTemplates()
      .then((list) => {
        setTemplates(list);
        if (list.length && !selectedKey) {
          const first = list[0];
          setSelectedKey(first.key);
          setParams(toDefaults(first));
        }
      })
      .catch((err) => {
        setTemplatesError(err?.response?.data?.message || err?.message || 'Failed to load templates');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser?.email && !recipient) setRecipient(currentUser.email);
  }, [currentUser?.email, recipient]);

  const selectedTemplate = useMemo(
    () => templates?.find((t) => t.key === selectedKey) || null,
    [templates, selectedKey],
  );

  function toDefaults(tpl: TemplateMetadata): Record<string, string> {
    const out: Record<string, string> = {};
    for (const p of tpl.params) out[p.name] = String(p.defaultValue ?? '');
    return out;
  }

  const buildPayloadParams = useCallback((): Record<string, string | number> => {
    if (!selectedTemplate) return {};
    const out: Record<string, string | number> = {};
    for (const def of selectedTemplate.params) {
      const raw = params[def.name];
      if (raw === undefined || raw === '') continue;
      out[def.name] = def.type === 'number' ? Number(raw) : raw;
    }
    return out;
  }, [selectedTemplate, params]);

  const handlePreview = useCallback(
    async (silent = false) => {
      if (!selectedTemplate) return;
      setPreviewLoading(true);
      try {
        const result = await emailTestApi.preview({
          templateKey: selectedTemplate.key,
          locale,
          params: buildPayloadParams(),
        });
        setPreview(result);
      } catch (err) {
        const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
        const message = anyErr?.response?.data?.message || anyErr?.message || 'Preview failed';
        if (!silent) toast.error(message);
        // surface backend error inline so the user always sees why it's empty
        setPreview({ subject: 'Error', html: '', text: message });
      } finally {
        setPreviewLoading(false);
      }
    },
    [selectedTemplate, locale, buildPayloadParams],
  );

  // Reset params when a new template is selected and auto-render the preview so
  // the right pane never feels empty.
  useEffect(() => {
    if (!selectedTemplate) return;
    setParams(toDefaults(selectedTemplate));
  }, [selectedTemplate]);

  // Debounced auto-preview whenever inputs change.
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!selectedTemplate) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void handlePreview(true);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [selectedTemplate, locale, params, handlePreview]);

  async function handleSend() {
    if (!selectedTemplate) return;
    if (!recipient) {
      toast.error('Enter a recipient email address');
      return;
    }
    setSendLoading(true);
    try {
      await emailTestApi.send({
        templateKey: selectedTemplate.key,
        recipient,
        locale,
        params: buildPayloadParams(),
      });
      toast.success(`Test email sent to ${recipient}`);
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = anyErr?.response?.data?.message || anyErr?.message || 'Send failed';
      toast.error(message);
    } finally {
      setSendLoading(false);
    }
  }

  const grouped = useMemo(() => (templates ? groupByCategory(templates) : {}), [templates]);
  const categoryKeys = useMemo(
    () => CATEGORY_ORDER.filter((k) => grouped[k]?.length),
    [grouped],
  );

  return (
    <AppLayout contentClassName="md:max-w-[1400px]">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-slate-800" />
            <h1 className="text-2xl font-semibold text-slate-900">Email template tester</h1>
            <Badge variant="secondary" className="ml-1">Internal</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-700">
            Render any of the 24 transactional email templates in EN or RO, then preview the HTML or send a real test to an inbox.
          </p>
        </div>

        {templatesError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-2 py-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Failed to load templates: {templatesError}</span>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* LEFT: Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-slate-900">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-select" className="text-slate-800">Template</Label>
                <Select value={selectedKey} onValueChange={setSelectedKey} disabled={!templates}>
                  <SelectTrigger id="template-select" className="w-full">
                    <SelectValue placeholder={templates ? 'Choose a template' : 'Loading…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryKeys.map((cat) => (
                      <SelectGroup key={cat}>
                        <SelectLabel>{CATEGORY_LABELS[cat] || cat}</SelectLabel>
                        {grouped[cat].map((tpl) => (
                          <SelectItem key={tpl.key} value={tpl.key}>
                            {tpl.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate?.description && (
                  <p className="text-xs text-slate-600">{selectedTemplate.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="locale-select" className="text-slate-800">Locale</Label>
                  <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
                    <SelectTrigger id="locale-select" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (en)</SelectItem>
                      <SelectItem value="ro">Romanian (ro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-input" className="text-slate-800">Recipient</Label>
                  <Input
                    id="recipient-input"
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {selectedTemplate && selectedTemplate.params.length > 0 && (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Template params</h3>
                    <button
                      type="button"
                      onClick={() => setParams(toDefaults(selectedTemplate))}
                      className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
                    >
                      Reset to defaults
                    </button>
                  </div>
                  <div className="space-y-3">
                    {selectedTemplate.params.map((def) => (
                      <div key={def.name} className="space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <Label
                            htmlFor={`param-${def.name}`}
                            className="text-xs font-medium text-slate-800"
                          >
                            {def.name}
                            {def.required ? <span className="ml-1 text-red-600">*</span> : null}
                          </Label>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{def.type}</span>
                        </div>
                        <Input
                          id={`param-${def.name}`}
                          type={def.type === 'number' ? 'number' : 'text'}
                          value={params[def.name] ?? ''}
                          onChange={(e) => setParams((p) => ({ ...p, [def.name]: e.target.value }))}
                          placeholder={String(def.defaultValue ?? '')}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePreview(false)}
                  disabled={!selectedTemplate || previewLoading}
                  className="flex-1"
                >
                  {previewLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                  Refresh preview
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={!selectedTemplate || !recipient || sendLoading}
                  className="flex-1"
                >
                  {sendLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send test
                </Button>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-600">
                Sends go through the real email pipeline. They are still subject to <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-800">EMAIL_SEND_ENABLED</code> and <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-800">EMAIL_ALLOWLIST</code> backend env vars — if a send appears to succeed but no email arrives, check those.
              </p>
            </CardContent>
          </Card>

          {/* RIGHT: Preview */}
          <Card className="min-h-[520px]">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-slate-900">Preview</CardTitle>
                {previewLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
              </div>
              {preview && (
                <p className="mt-1 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Subject:</span> {preview.subject}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!preview ? (
                <div className="flex h-[600px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-600">
                  <Eye className="h-8 w-8 text-slate-400" />
                  <span>Pick a template — the preview will appear here automatically.</span>
                </div>
              ) : (
                <div className="flex h-[720px] flex-col">
                  <div className="flex items-center gap-1 border-b border-slate-100 px-4 py-2">
                    {(['html', 'text'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setPreviewTab(tab)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                          previewTab === tab
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-700 hover:bg-slate-100',
                        )}
                      >
                        {tab === 'html' ? <Eye className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
                        {tab === 'html' ? 'HTML' : 'Plain text'}
                      </button>
                    ))}
                    {previewTab === 'html' && (
                      <button
                        type="button"
                        onClick={() => setPreviewTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                        title={previewTheme === 'light' ? 'Preview dark mode' : 'Preview light mode'}
                        className={cn(
                          'ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                          previewTheme === 'dark'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-700 hover:bg-slate-100',
                        )}
                      >
                        {previewTheme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                        {previewTheme === 'light' ? 'Dark mode' : 'Light mode'}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden bg-slate-50">
                    {previewTab === 'html' ? (
                      <iframe
                        key={`${preview.html.length}-${previewTheme}`}
                        title="Email HTML preview"
                        sandbox=""
                        srcDoc={previewTheme === 'dark' ? forceDarkMode(preview.html) : preview.html}
                        className="h-full w-full border-0 bg-white"
                      />
                    ) : (
                      <pre className="h-full overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-slate-800">
                        {preview.text}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default EmailTestPage;
