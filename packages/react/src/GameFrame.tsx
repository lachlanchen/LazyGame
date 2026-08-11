import type { Locale } from '@lazyingart/game-core'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

export interface GameFrameProps {
  title: string
  subtitle: string
  locale: Locale
  localeLabels: Readonly<Record<Locale, string>>
  languageLabel: string
  onLocaleChange(locale: Locale): void
  toolbar?: ReactNode
  board: ReactNode
  teaching: ReactNode
  actions: ReactNode
}

export function GameFrame({
  title,
  subtitle,
  locale,
  localeLabels,
  languageLabel,
  onLocaleChange,
  toolbar,
  board,
  teaching,
  actions,
}: GameFrameProps) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <div className="game-shell" data-testid="game-shell" data-locale={locale}>
      <header className="game-header">
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        <div className="game-toolbar">
          {toolbar}
          <label>
            <span className="sr-only">{languageLabel}</span>
            <select
              data-testid="locale-switch"
              value={locale}
              onChange={(event) => onLocaleChange(event.target.value as Locale)}
            >
              {(Object.keys(localeLabels) as Locale[]).map((item) => (
                <option key={item} value={item}>{localeLabels[item]}</option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main className="game-main">
        <section className="game-board-zone">{board}</section>
        <aside className="game-teaching-zone">{teaching}</aside>
      </main>
      <footer className="game-actions">{actions}</footer>
    </div>
  )
}
