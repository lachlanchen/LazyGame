import { SUPPORTED_LOCALES, type Locale } from '@lazyingart/game-core'
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

export function documentMetadata(locale: Locale, title: string, description: string) {
  return { locale, direction: locale === 'ar' ? 'rtl' as const : 'ltr' as const, title, description }
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
    const metadata = documentMetadata(locale, title, subtitle)
    document.documentElement.lang = metadata.locale
    document.documentElement.dir = metadata.direction
    document.title = metadata.title
    let descriptionElement = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!descriptionElement) {
      descriptionElement = document.createElement('meta')
      descriptionElement.name = 'description'
      document.head.append(descriptionElement)
    }
    descriptionElement.content = metadata.description
  }, [locale, subtitle, title])

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
              onChange={(event) => {
                const next = event.target.value
                if ((SUPPORTED_LOCALES as readonly string[]).includes(next)) onLocaleChange(next as Locale)
              }}
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
