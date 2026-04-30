// Icons — match real app's hairline icon style (Lucide-like, 1.5px stroke).

const I = {};
const mk = (children, vb = "0 0 24 24") => ({ size = 16, strokeWidth = 1.6, ...p }) => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke="currentColor"
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);
const mkF = (children, vb = "0 0 24 24") => ({ size = 16, ...p }) => (
  <svg width={size} height={size} viewBox={vb} fill="currentColor" {...p}>{children}</svg>
);

I.Dashboard = mk(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>);
I.Calendar  = mk(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
I.Users     = mk(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3.3-5.5 6.5-5.5s6 2 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M21.5 18c-.3-2-1.7-3.3-3.5-3.5" /></>);
I.User      = mk(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.7 3.7-5.5 7-5.5s6.3 1.8 7 5.5" /></>);
I.Briefcase = mk(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></>);
I.Layers    = mk(<><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5M3 18l9 5 9-5" /></>);
I.Pin       = mk(<><path d="M12 21s7-6 7-12a7 7 0 10-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>);
I.Map       = mk(<><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></>);
I.Help      = mk(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 17h0" /></>);
I.Bell      = mk(<><path d="M6 8a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 004 0" /></>);
I.Sun       = mk(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
I.LogOut    = mk(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></>);
I.Sidebar   = mk(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></>);

I.Search    = mk(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></>);
I.Plus      = mk(<><path d="M12 5v14M5 12h14" /></>);
I.Chevron   = mk(<polyline points="6 9 12 15 18 9" />);
I.ChevRight = mk(<polyline points="9 18 15 12 9 6" />);
I.ChevLeft  = mk(<polyline points="15 18 9 12 15 6" />);
I.Check     = mk(<polyline points="20 6 9 17 4 12" />);
I.X         = mk(<><path d="M18 6L6 18M6 6l12 12" /></>);
I.Info      = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 8h0M11 12h1v5h1" /></>);
I.Alert     = mk(<><path d="M10.3 3.7L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.7a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h0" /></>);
I.Sparkles  = mk(<><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /><path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2zM5 16l.5 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5L5 16z" /></>);
I.Bolt      = mk(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />);
I.Card      = mk(<><rect x="2" y="6" width="20" height="13" rx="2.5" /><path d="M2 11h20M6 16h4" /></>);
I.Receipt   = mk(<><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z" /><path d="M9 8h6M9 12h6M9 16h4" /></>);
I.Download  = mk(<><path d="M12 3v12M7 11l5 4 5-4M5 21h14" /></>);
I.External  = mk(<><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h5" /></>);
I.Refresh   = mk(<><path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" /></>);
I.Building  = mk(<><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 8h.01M14 8h.01M9 12h.01M14 12h.01M9 16h.01M14 16h.01" /></>);
I.SMS       = mk(<><path d="M21 15a2 2 0 01-2 2H8l-5 4V6a2 2 0 012-2h14a2 2 0 012 2v9z" /></>);
I.Gauge     = mk(<><path d="M12 14l4-4M21 12a9 9 0 10-15.5 6.3" /><circle cx="12" cy="12" r="9" /></>);
I.Crown     = mk(<><path d="M3 17l2-9 5 5 2-9 2 9 5-5 2 9H3z" /><path d="M5 21h14" /></>);
I.Lock      = mk(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></>);
I.Clock     = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
I.MoreH     = mk(<><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>);
I.Star      = mk(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />);
I.Dot       = mkF(<circle cx="12" cy="12" r="5" />);
I.CheckCircle = mk(<><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>);
I.Eye       = mk(<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>);
I.Globe     = mk(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></>);
I.RO        = ({ size = 14 }) => ( /* small RO tricolor flag */
  <svg width={size} height={Math.round(size * 0.66)} viewBox="0 0 30 20"><rect width="10" height="20" fill="#002B7F" /><rect x="10" width="10" height="20" fill="#FCD116" /><rect x="20" width="10" height="20" fill="#CE1126" /></svg>
);
I.Inno = ({ size = 22 }) => ( /* Inno wordmark with the red dot */
  <svg width={size * 2.5} height={size} viewBox="0 0 90 32" fill="none">
    <text x="0" y="24" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="700" fill="#111111" letterSpacing="-0.02em">Inno</text>
    <circle cx="22" cy="6" r="3" fill="#E11D48" />
  </svg>
);

window.I = I;
