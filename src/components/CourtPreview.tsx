import { CourtThemeId } from '../types/CourtTheme'
import { COURT_THEME_DATA } from '../contexts/SettingsContext'
import './CourtPreview.css'

type CourtPreviewProps = {
  themeId: CourtThemeId
  className?: string
}

/** Minimal court SVG for preview (no players/positions). */
export function CourtPreview({ themeId, className = '' }: CourtPreviewProps) {
  const theme = COURT_THEME_DATA[themeId]
  if (!theme) return null

  return (
    <div className={`court-preview ${className}`}>
      <svg
        viewBox="8 5 54 70"
        className="court-preview-svg"
        style={{ background: theme.backgroundColor }}
      >
        {/* Court surface */}
        <rect x="8" y="5" width="54" height="70" fill={theme.courtColor} rx="0" />
        <rect x="8" y="5" width="54" height="1.5" fill={theme.grainColor} opacity="0.3" />
        <rect x="8" y="15" width="54" height="1" fill={theme.grainColor} opacity="0.2" />
        <rect x="8" y="30" width="54" height="1.5" fill={theme.grainColor} opacity="0.25" />
        <rect x="8" y="45" width="54" height="1" fill={theme.grainColor} opacity="0.2" />
        <rect x="8" y="60" width="54" height="1.5" fill={theme.grainColor} opacity="0.3" />
        <rect x="8" y="5" width="54" height="70" stroke={theme.lineColor} strokeWidth="0.5" fill="none" rx="0" />
        <line x1="8" y1="20" x2="62" y2="20" stroke={theme.lineColor} strokeWidth="0.4" />
        <circle cx="35" cy="20" r="8" stroke={theme.lineColor} strokeWidth="0.4" fill="none" />
        <path d="M 12 75 Q 12 42, 35 42 Q 58 42, 58 75" stroke={theme.lineColor} strokeWidth="0.5" fill="none" />
        <rect x="26" y="58" width="18" height="17" fill="none" stroke={theme.lineColor} strokeWidth="0.4" />
        <path d="M 26 58 A 9 9 0 0 1 44 58" stroke={theme.lineColor} strokeWidth="0.4" fill="none" />
        <line x1="26" y1="58" x2="44" y2="58" stroke={theme.lineColor} strokeWidth="0.4" />
        <circle cx="35" cy="72" r={2.5} fill="#ff6b35" stroke={theme.lineColor} strokeWidth="0.4" />
      </svg>
    </div>
  )
}
