/** Morning sign-up sheet courts — canonical names match DB `court_name`. */

export type SignupSheetBorough = 'Manhattan' | 'Brooklyn' | 'Queens';

export type SignupSheetStatus =
  | 'sheet_empty'
  | 'few_names'
  | 'line_forming'
  | 'sheet_full';

export const SIGNUP_SHEET_STATUS_LABEL: Record<SignupSheetStatus, string> = {
  sheet_empty: 'Sheet Empty',
  few_names: 'Few Names',
  line_forming: 'Line Forming',
  sheet_full: 'Sheet Full',
};

export const SIGNUP_SHEET_STATUS_ORDER: SignupSheetStatus[] = [
  'sheet_empty',
  'few_names',
  'line_forming',
  'sheet_full',
];

export const SIGNUP_SHEET_STATUS_BUTTON_CLASS: Record<SignupSheetStatus, string> = {
  sheet_empty:
    'bg-[#2D5A27] text-[#FFFDD0] border-[#24481f] active:bg-[#24481f] ring-[#2D5A27]/40',
  few_names:
    'bg-amber-400 text-[#1a1a1a] border-amber-500 active:bg-amber-500 ring-amber-500/40',
  line_forming:
    'bg-orange-500 text-white border-orange-600 active:bg-orange-600 ring-orange-400/40',
  sheet_full: 'bg-red-600 text-white border-red-700 active:bg-red-700 ring-red-500/40',
};

export type SignupSheetCourt = {
  name: string;
  borough: SignupSheetBorough;
};

export const SIGNUP_SHEET_COURTS: SignupSheetCourt[] = [
  { name: 'Riverside Park Tennis Courts', borough: 'Manhattan' },
  { name: '96th St Clay', borough: 'Manhattan' },
  { name: 'Washington Market Tennis Court', borough: 'Manhattan' },
  { name: 'Central Park Tennis Center', borough: 'Manhattan' },
  { name: 'Van Voorhees Park Tennis Courts', borough: 'Brooklyn' },
  { name: 'McCarren Park Tennis Courts', borough: 'Brooklyn' },
  { name: 'Fort Greene Tennis Courts', borough: 'Brooklyn' },
  { name: 'Prospect Park Tennis Courts', borough: 'Brooklyn' },
  { name: 'Astoria Park Tennis Courts', borough: 'Queens' },
];

export const SIGNUP_SHEET_BOROUGHS: SignupSheetBorough[] = ['Manhattan', 'Brooklyn', 'Queens'];

export function courtsByBorough(borough: SignupSheetBorough): SignupSheetCourt[] {
  return SIGNUP_SHEET_COURTS.filter((c) => c.borough === borough);
}

/** Solid dot for list/detail (Tailwind bg-*). */
export function signupStatusDotClass(status: SignupSheetStatus): string {
  switch (status) {
    case 'sheet_empty':
      return 'bg-[#2D5A27]';
    case 'few_names':
      return 'bg-amber-400';
    case 'line_forming':
      return 'bg-orange-500';
    case 'sheet_full':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}
