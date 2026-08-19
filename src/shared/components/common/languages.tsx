// Single source of truth for supported UI languages, consumed by
// LanguageSwitcher (dropdown), LanguageDrawer (bottom sheet), and the
// mobile nav drawer. Add new entries here and every picker stays in sync.

export const languages = [
  {
    code: 'en',
    name: 'English',
    flag: (
      <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="15" rx="2" fill="#B22234"/>
        <rect y="1" width="20" height="1" fill="white"/>
        <rect y="3" width="20" height="1" fill="white"/>
        <rect y="5" width="20" height="1" fill="white"/>
        <rect y="7" width="20" height="1" fill="white"/>
        <rect y="9" width="20" height="1" fill="white"/>
        <rect y="11" width="20" height="1" fill="white"/>
        <rect y="13" width="20" height="1" fill="white"/>
        <rect width="8" height="8" fill="#3C3B6E"/>
      </svg>
    ),
  },
  {
    code: 'ro',
    name: 'Română',
    flag: (
      <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="15" rx="2" fill="#FCD116"/>
        <rect width="6.67" height="15" rx="2" fill="#002B7F"/>
        <rect x="13.33" width="6.67" height="15" rx="2" fill="#CE1126"/>
      </svg>
    ),
  },
];
