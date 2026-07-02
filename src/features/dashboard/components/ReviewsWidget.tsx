import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';

interface RatingDistribution {
  '5': number;
  '4': number;
  '3': number;
  '2': number;
  '1': number;
}

interface ReviewsWidgetProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
}

const EYEBROW =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-500';
const IOS_EASE = '[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]';

const GAUGE_COLORS = ['#E8785E', '#E8B44C', '#D6CE5C', '#5CC4A8', '#2EA88E'];
const GRADIENT = 'linear-gradient(to right, #E8907A, #F2C87A, #ECE0A0, #A8D8C8, #58B5A9)';

function toXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const s = toXY(cx, cy, r, from);
  const e = toXY(cx, cy, r, to);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
}

export function ReviewsWidget({
  averageRating,
  totalReviews,
}: ReviewsWidgetProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { isTeamMember } = usePermissions();
  const reviewsHref = isTeamMember ? '/my-profile?tab=reviews' : '/marketplace?tab=reviews';
  const isEmpty = totalReviews === 0;

  const cx = 100;
  const cy = 100;
  const r = 64;
  const sw = 18;
  const gap = 3;
  const seg = 36; // 180° / 5

  // Indicator is always fixed dead-center under the 3rd wedge (90°)
  const dotX = cx;
  const dotY = cy - r + sw;

  // Which wedge the rating falls into (0–4)
  const clampedRating = Math.min(Math.max(averageRating, 0), 5);
  const activeWedge = Math.min(Math.floor(clampedRating), 4);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className={EYEBROW}>{t('reviews.title')}</p>
        <button
          onClick={() => navigate(reviewsHref)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-primary hover:bg-primary/10 active:bg-primary/15 active:scale-[0.97] transition-[background-color,transform] cursor-pointer ${IOS_EASE}`}
        >
          <span className="text-xs font-medium">{t('reviews.seeAll')}</span>
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {/* Gauge */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <svg viewBox="0 0 200 116" className="w-full max-w-[240px]">
          {/* Shadow filter for indicator */}
          <defs>
            <filter id="dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Arc segments */}
          {GAUGE_COLORS.map((color, i) => (
            <path
              key={i}
              d={arc(cx, cy, r, 180 - i * seg - gap / 2, 180 - (i + 1) * seg + gap / 2)}
              fill="none"
              stroke={isEmpty ? '#D6D9DE' : color}
              strokeWidth={sw}
              strokeLinecap="butt"
              opacity={isEmpty ? 0.5 : i === activeWedge ? 1 : 0.35}
            />
          ))}

          {/* Number labels: 0, 2, 3, 4, 5 at 45° intervals */}
          {[0, 2, 3, 4, 5].map((n, i) => {
            const p = toXY(cx, cy, r + sw / 2 + 12, 180 - i * 45);
            return (
              <text
                key={n}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10.5"
                fontWeight="500"
                fill="currentColor"
                opacity={0.38}
              >
                {n}
              </text>
            );
          })}

          {/* Rating indicator pill */}
          {!isEmpty && (
            <g filter="url(#dot-shadow)">
              <rect
                x={dotX - 14}
                y={dotY - 9}
                width={28}
                height={18}
                rx={6}
                fill={GAUGE_COLORS[activeWedge]}
              />
              <rect
                x={dotX - 14}
                y={dotY - 9}
                width={28}
                height={18}
                rx={6}
                fill="none"
                stroke="white"
                strokeWidth={2.5}
              />
              <text
                x={dotX}
                y={dotY + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="700"
                fill="white"
              >
                {Number(averageRating).toFixed(1)}
              </text>
            </g>
          )}

          {/* Center text — review count or empty label */}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fill="currentColor"
            opacity={0.38}
          >
            {isEmpty
              ? t('reviews.noReviews')
              : `${totalReviews} ${totalReviews === 1 ? t('reviews.review') : t('reviews.reviews')}`}
          </text>
        </svg>

        {/* Gradient bar + Worst / Amazing labels */}
        <div className="w-full max-w-[160px] flex flex-col gap-1 -mt-2">
          <div className="relative">
            <div
              className="h-[5px] rounded-full"
              style={{
                background: isEmpty ? '#D6D9DE' : GRADIENT,
                opacity: isEmpty ? 0.5 : 1,
              }}
            />
            {!isEmpty && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-[3px] h-3 rounded-full"
                style={{
                  left: `${(clampedRating / 5) * 100}%`,
                  marginLeft: '-1.5px',
                  backgroundColor: GAUGE_COLORS[activeWedge],
                }}
              />
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-foreground-3">{t('reviews.worst')}</span>
            <span className="text-xs text-foreground-3">{t('reviews.amazing')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
