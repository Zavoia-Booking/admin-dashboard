import { useTranslation, Trans } from 'react-i18next';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { DashedDivider } from '../../../../shared/components/common/DashedDivider';
import {
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Star,
  Heart,
  Award,
  Briefcase,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { PersonAvatar } from '../../../../shared/components/common/PersonAvatar';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../app/providers/store';

interface NoProfileYetViewProps {
  onCreateProfile: () => void;
}

export function NoProfileYetView({ onCreateProfile }: NoProfileYetViewProps) {
  const { t } = useTranslation('myProfile');
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.firstName || t('noProfileYet.fallbackName');

  return (
    <div className="max-w-7xl mx-auto px-0 space-y-6 cursor-default">
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Main Hero / Header Card - 3/4 Width */}
        <div className="md:col-span-3 relative group bg-surface border border-border rounded-xl p-4 overflow-hidden flex flex-col justify-between gap-8 transition-all duration-300 shadow-sm">
          {/* Subtle Accent Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-purple-500/[0.03] pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 w-full">
            {/* Header Row: Avatar + Title */}
            <div className="flex flex-row items-center gap-5 text-left">
              <PersonAvatar
                id={user?.id ?? user?.email ?? ''}
                firstName={user?.firstName}
                lastName={user?.lastName}
                profileImage={user?.profileImage}
                className="h-14 w-14 md:h-16 md:w-16 border-2 border-border shadow-md transition-all duration-500 ease-out group-hover:scale-107"
                initialsClassName="text-xl font-bold"
              />
              <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground-1">
                {t('noProfileYet.greeting', { name: firstName })}
              </h2>
            </div>

            {/* Full Width Subtitle */}
            <p className="text-foreground-2 text-base md:text-xl leading-relaxed max-w-4xl text-left">
              <Trans
                t={t}
                i18nKey="noProfileYet.heroSubtitle"
                components={{ bold: <span className="font-bold text-foreground-1" /> }}
              />
            </p>
          </div>

          {/* Bottom Row: Badges + Button */}
          <div className="relative z-10 w-full">
            <DashedDivider marginTop="mt-0" paddingTop="pb-6" />
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="flex flex-wrap justify-center justify-start gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-medium bg-surface border border-border rounded-full px-3 py-1.5 text-foreground-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{t('noProfileYet.takesMinutes')}</span>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-medium bg-surface border border-border rounded-full px-3 py-1.5 text-foreground-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <span>{t('noProfileYet.boostVisibility')}</span>
                </div>
              </div>

              <Button
                onClick={onCreateProfile}
                className="btn-primary group !h-8 text-base w-full md:!w-52 rounded-full shadow-lg active:scale-95 flex items-center gap-2"
              >
                <span>{t('noProfileYet.createProfile')}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* What You Can Showcase Card */}
        <Card className="md:col-span-1 group relative overflow-hidden bg-surface border-border transition-all duration-300 rounded-xl p-0 shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 dark:bg-primary/70 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="h-full p-4 md:pt-8 relative flex flex-col gap-4">
            <div className="space-y-1 mb-0">
              <h4 className="font-bold text-base mb-3 uppercase tracking-widest text-foreground-2">
                {t('noProfileYet.showcase')}
              </h4>
              <p className="text-xs text-foreground-2 leading-tight">
                {t('noProfileYet.showcaseDescription')}
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-1 mb-2 flex flex-row md:flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-bold text-foreground-1 block leading-tight">
                    {t('noProfileYet.professionalTitle')}
                  </span>
                </div>
                <span className="text-xs text-foreground-3 block">
                  {t('noProfileYet.professionalTitleHint')}
                </span>
              </div>

              <DashedDivider
                marginTop="mt-0"
                paddingTop="pt-2 md:pt-0"
                className="mb-4 md:mb-2"
              />

              <div className="space-y-1 mb-2 flex flex-row md:flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-pink-500" />
                  <span className="text-sm font-bold text-foreground-1 block leading-tight">
                    {t('noProfileYet.aboutMe')}
                  </span>
                </div>
                <span className="text-xs text-foreground-3 block">
                  {t('noProfileYet.aboutMeHint')}
                </span>
              </div>

              <DashedDivider
                marginTop="mt-0"
                paddingTop="pt-2 md:pt-0"
                className="mb-4 md:mb-2"
              />

              <div className="space-y-1 flex flex-row md:flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-sm font-bold text-foreground-1 block leading-tight">
                    {t('noProfileYet.socialLinks')}
                  </span>
                </div>
                <span className="text-xs text-foreground-3 block">
                  {t('noProfileYet.socialLinksHint')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Preview Card - 2x1 */}
        <Card className="md:col-span-2 group relative overflow-hidden border-border rounded-xl p-0">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-400/10 dark:bg-green-400/70 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="h-full p-4 relative flex flex-col justify-start">
            <div className="space-y-3">
              <div className="space-y-1 mb-0 md:mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base uppercase tracking-widest text-foreground-2">
                    {t('noProfileYet.yourPublicProfile')}
                  </h4>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground-2">
                  {t('noProfileYet.publicProfileHint')}
                </div>
              </div>
              <p className="text-sm text-foreground-2 mt-3 md:mt-6 leading-relaxed">
                <Trans
                  t={t}
                  i18nKey="noProfileYet.publicProfileDescription"
                  components={{ bold: <span className="font-semibold text-foreground-1" /> }}
                />
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefit: Get Discovered */}
        <Card className="md:col-span-1 group relative overflow-hidden bg-surface border-border transition-all duration-300 rounded-xl p-0">
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/10 dark:bg-primary/40 rounded-full translate-y-8 -translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="h-full p-4 flex flex-col justify-start items-start min-h-[160px]">
            <div className="space-y-1">
              <h4 className="font-bold text-base uppercase tracking-widest text-foreground-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {t('noProfileYet.getDiscovered')}
              </h4>
              <p className="text-sm text-foreground-2 mt-6 md:mt-2 leading-relaxed">
                <Trans
                  t={t}
                  i18nKey="noProfileYet.getDiscoveredDescription"
                  components={{ bold: <span className="font-semibold" /> }}
                />
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefit: Build Trust */}
        <Card className="md:col-span-1 group relative overflow-hidden bg-surface border-border transition-all duration-300 rounded-xl p-0">
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-info/10 dark:bg-info/70 rounded-full translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="h-full p-4 flex flex-col justify-start items-start min-h-[160px]">
            <div className="space-y-1">
              <h4 className="font-bold text-base uppercase tracking-widest text-foreground-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                {t('noProfileYet.buildTrust')}
              </h4>
              <p className="text-sm text-foreground-2 mt-6 md:mt-2 leading-relaxed">
                {t('noProfileYet.buildTrustDescription')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom CTA - Full Width */}
        <Card className="md:col-span-4 group relative overflow-hidden bg-surface border-border transition-all duration-300 rounded-xl p-0">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardContent className="h-full p-4 py-6 flex flex-col md:flex-row items-start justify-between gap-12 relative">
            <div className="flex items-center gap-10">
              <div className="space-y-4">
                <h4 className="text-2xl font-bold tracking-tight text-foreground-1">
                  {t('noProfileYet.successStarts')}
                </h4>
                <p className="text-foreground-2 text-base md:text-lg leading-relaxed max-w-2xl">
                  <Trans
                    t={t}
                    i18nKey="noProfileYet.successDescription"
                    components={{ bold: <span className="font-semibold" /> }}
                  />
                </p>
              </div>
            </div>

            <div className="bg-base p-6 w-full md:w-auto rounded-xl border border-border shadow-lg group-hover:-translate-y-2 transition-all duration-500 flex flex-col gap-4 min-w-[260px]">
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-foreground-3">
                    {t('noProfileYet.quickStart')}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">1</div>
                  <span className="text-sm text-foreground-2">{t('noProfileYet.step1')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">2</div>
                  <span className="text-sm text-foreground-2">{t('noProfileYet.step2')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">3</div>
                  <span className="text-sm text-foreground-2">{t('noProfileYet.step3')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  </div>
                  <span className="text-sm text-foreground-2">{t('noProfileYet.step4')}</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={onCreateProfile}
              className="btn-primary group !h-8 text-base w-full md:!w-52 rounded-full shadow-lg active:scale-95 flex items-center gap-2 w-full md:hidden"
            >
              <span>{t('noProfileYet.createProfile')}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default NoProfileYetView;
