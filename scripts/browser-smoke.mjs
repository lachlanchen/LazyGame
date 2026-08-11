#!/usr/bin/env node
import { lstat, mkdir, open, readFile, readlink, realpath, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright-core'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appPort = process.env.GAME_APP_PORT ?? '8011'
const cdpPort = process.env.GAME_CDP_PORT ?? '9480'
const appUrl = `http://127.0.0.1:${appPort}/`
const cdpUrl = `http://127.0.0.1:${cdpPort}`
const requestedRuntimeDir = resolve(
  process.env.GAME_NOVNC_RUNTIME_DIR ?? `${projectRoot}/.local/runtime/browser`,
)
const localRoot = await realpath(`${projectRoot}/.local`)
const requestedStat = await lstat(requestedRuntimeDir)
if (requestedStat.isSymbolicLink()) throw new Error('Browser runtime must not be a symbolic link')
const runtimeDir = await realpath(requestedRuntimeDir)
if (!runtimeDir.startsWith(`${localRoot}/`)) {
  throw new Error('Browser evidence must stay below the project .local directory')
}
const requestedEvidenceDir = `${runtimeDir}/evidence`
await mkdir(requestedEvidenceDir, { recursive: true, mode: 0o700 })
const evidenceStat = await lstat(requestedEvidenceDir)
if (evidenceStat.isSymbolicLink()) throw new Error('Browser evidence directory must not be a symbolic link')
const evidenceDir = await realpath(requestedEvidenceDir)
if (!evidenceDir.startsWith(`${runtimeDir}/`)) throw new Error('Browser evidence path escaped its runtime')
const runId = `${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${process.pid}`
const screenshots = []
const checks = {}
const failures = []
const consoleErrors = []
const pageErrors = []
const requestFailures = []
const badResponses = []
const externalRequests = []
let browser
let cdp
const smokeLockPath = `${runtimeDir}/.smoke.lock`
async function processStartTicks(pid) {
  const stat = await readFile(`/proc/${pid}/stat`, 'utf8')
  return stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/)[19] ?? ''
}

async function lockOwnerIsAlive() {
  const lockStat = await lstat(smokeLockPath)
  if (lockStat.isSymbolicLink() || !lockStat.isFile()) {
    throw new Error('Browser smoke lock is not a private regular file')
  }
  let owner
  try {
    owner = JSON.parse(await readFile(smokeLockPath, 'utf8'))
  } catch {
    owner = { pid: Number.parseInt(await readFile(smokeLockPath, 'utf8'), 10), startTicks: '' }
  }
  if (!Number.isSafeInteger(owner.pid) || owner.pid < 1) return false
  try {
    const [startTicks, command, cwd] = await Promise.all([
      processStartTicks(owner.pid),
      readFile(`/proc/${owner.pid}/cmdline`, 'utf8'),
      readlink(`/proc/${owner.pid}/cwd`),
    ])
    return (!owner.startTicks || owner.startTicks === startTicks) &&
      command.includes('browser-smoke.mjs') && await realpath(cwd) === projectRoot
  } catch {
    return false
  }
}

async function acquireSmokeLock() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await open(smokeLockPath, 'wx', 0o600)
      await handle.writeFile(`${JSON.stringify({ pid: process.pid, startTicks: await processStartTicks(process.pid) })}\n`)
      return handle
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')) throw error
      if (await lockOwnerIsAlive()) {
        throw new Error('Another browser smoke is already running for this Game runtime')
      }
      await unlink(smokeLockPath)
    }
  }
  throw new Error('Could not acquire the browser smoke lock')
}

const smokeLock = await acquireSmokeLock()

async function screenshot(page, name) {
  const path = `${evidenceDir}/${runId}-${name}.png`
  await page.screenshot({ path, fullPage: false })
  screenshots.push(path.replace(`${projectRoot}/`, ''))
}

function sessionCount(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('game-demo.sessions.v2.index')
    if (!raw) return 0
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.ids) ? parsed.ids.length : -1
  })
}

function sessionSnapshot(page) {
  return page.evaluate(() => {
    const rawIndex = localStorage.getItem('game-demo.sessions.v2.index')
    if (!rawIndex) return null
    const index = JSON.parse(rawIndex)
    const id = Array.isArray(index.ids) ? index.ids[0] : null
    if (typeof id !== 'string') return null
    const rawSession = localStorage.getItem(`game-demo.sessions.v2.session.${id}`)
    if (!rawSession) return null
    const session = JSON.parse(rawSession)
    return {
      schemaVersion: session.schemaVersion,
      revision: session.revision,
      historyLength: Array.isArray(session.history) ? session.history.length : -1,
    }
  })
}

try {
  browser = await chromium.connectOverCDP(cdpUrl)
  const context = browser.contexts()[0]
  if (!context) throw new Error('Dedicated browser context is unavailable')
  const pages = context.pages()
  const page = pages.find((item) => item.url().startsWith(appUrl)) ?? pages[0] ?? await context.newPage()
  await page.bringToFront()
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}`))
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname !== '127.0.0.1' && url.hostname !== 'localhost'
    ) {
      externalRequests.push(`${request.method()} ${request.url()}`)
    }
  })
  page.on('response', (response) => {
    if (response.url().startsWith(appUrl) && response.status() >= 400) {
      badResponses.push(`${response.status()} ${response.url()}`)
    }
  })

  await page.goto(appUrl, { waitUntil: 'networkidle' })
  await page.getByTestId('game-shell').waitFor()
  checks.title = await page.title()
  checks.shellVisible = await page.getByTestId('game-shell').isVisible()

  await page.getByTestId('locale-switch').selectOption('en')
  await page.getByRole('button', { name: 'New demo' }).click()
  checks.sessionCountAfterReset = await sessionCount(page)
  checks.legalCandidateCount = await page.getByTestId('candidate').count()

  const candidate = page.getByTestId('candidate').first()
  await candidate.hover()
  checks.pointerInspection = await candidate.getAttribute('data-active') === 'true'
  await candidate.focus()
  checks.keyboardInspection = await candidate.getAttribute('data-active') === 'true'
  await candidate.click()
  checks.previewVisible = await page.getByText('Preview only · the board has not changed').isVisible()
  checks.previewNonMutating = await page.locator('.demo-cell.sun, .demo-cell.moon').count() === 0
  const otherCandidate = page.getByTestId('candidate').nth(1)
  await otherCandidate.hover()
  checks.hoverOverridesSelected = await otherCandidate.getAttribute('data-active') === 'true' &&
    await page.locator('.demo-cell.ghost').count() === 1 &&
    await page.locator('.demo-cell[aria-label="1, 2"].ghost').count() === 1 &&
    await page.getByText('Sun would occupy row 1, column 2.').isVisible()
  await page.mouse.move(0, 0)
  await page.getByRole('button', { name: 'Place mark' }).click()
  checks.commitMutatesOnce = await page.locator('.demo-cell.sun').count() === 1
  checks.sessionCountAfterCommit = await sessionCount(page)
  const committedSession = await sessionSnapshot(page)
  checks.chronicleAfterCommit = committedSession?.schemaVersion === 1 &&
    committedSession.revision === 2 && committedSession.historyLength === 1

  await page.reload({ waitUntil: 'networkidle' })
  checks.reloadResumesMove = await page.locator('.demo-cell.sun').count() === 1
  checks.reloadDoesNotDuplicate = await sessionCount(page) === 1
  await page.getByTestId('locale-switch').selectOption('zh-Hans')
  checks.simplifiedChinese = await page.getByText('通用游戏教学框架').isVisible()
  checks.simplifiedChineseLang = await page.evaluate(() => document.documentElement.lang === 'zh-Hans')
  await page.getByTestId('locale-switch').selectOption('ja')
  checks.japanese = await page.getByText('ゲーム指導フレームワーク').isVisible()
  checks.japaneseLang = await page.evaluate(() => document.documentElement.lang === 'ja')

  const localeLabels = {
    en: 'English',
    ar: 'العربية',
    es: 'Español',
    fr: 'Français',
    ja: '日本語',
    ko: '한국어',
    vi: 'Tiếng Việt',
    'zh-Hans': '简体中文',
    'zh-Hant': '繁體中文',
    de: 'Deutsch',
    ru: 'Русский',
  }
  checks.localeOptions = await page.getByTestId('locale-switch').locator('option').evaluateAll(
    (options) => options.map((option) => [option.value, option.textContent]),
  )
  checks.localeOptionsExact = JSON.stringify(checks.localeOptions) === JSON.stringify(Object.entries(localeLabels))
  const localeMetadata = []
  for (const locale of Object.keys(localeLabels)) {
    await page.getByTestId('locale-switch').selectOption(locale)
    await page.waitForFunction((expectedLocale) => document.documentElement.lang === expectedLocale, locale)
    localeMetadata.push(await page.evaluate((expectedLocale) => {
      const title = document.querySelector('.game-header strong')?.textContent?.trim() ?? ''
      const subtitle = document.querySelector('.game-header span')?.textContent?.trim() ?? ''
      return {
        locale: expectedLocale,
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        titleMatches: title.length > 0 && document.title === title,
        descriptionMatches: subtitle.length > 0 &&
          document.querySelector('meta[name="description"]')?.getAttribute('content') === subtitle,
      }
    }, locale))
  }
  checks.allLocaleMetadata = localeMetadata.every((entry) =>
    entry.lang === entry.locale && entry.dir === (entry.locale === 'ar' ? 'rtl' : 'ltr') &&
    entry.titleMatches && entry.descriptionMatches,
  )
  await page.getByTestId('locale-switch').selectOption('ar')
  checks.arabicRtl = await page.evaluate(() =>
    document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl',
  )

  checks.desktopFits = await page.evaluate(() => {
    const root = document.documentElement
    const board = document.querySelector('[data-testid="demo-board"]')?.getBoundingClientRect()
    return Boolean(board) && root.scrollWidth === root.clientWidth && board.top >= 0 && board.bottom <= innerHeight
  })
  await screenshot(page, 'desktop')

  cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  })
  await page.waitForTimeout(250)
  checks.mobileFits = await page.evaluate(() => {
    const root = document.documentElement
    const shell = document.querySelector('[data-testid="game-shell"]')?.getBoundingClientRect()
    const board = document.querySelector('[data-testid="demo-board"]')?.getBoundingClientRect()
    return Boolean(shell && board) && root.scrollWidth === root.clientWidth &&
      root.scrollHeight === root.clientHeight && shell.bottom <= innerHeight &&
      board.width >= 280 && board.bottom <= innerHeight
  })
  checks.mobileTouchTargets = await page.evaluate(() =>
    [...document.querySelectorAll('button:not([disabled]), select')]
      .filter((element) => {
        const box = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return box.width > 0 && box.height > 0 && style.visibility !== 'hidden'
      })
      .every((element) => element.getBoundingClientRect().height >= 42),
  )
  checks.mobileHeaderCompact = await page.evaluate(() => {
    const header = document.querySelector('.game-header')?.getBoundingClientRect()
    const reset = document.querySelector('.game-toolbar button')?.getBoundingClientRect()
    return Boolean(header && reset) && header.height <= 60 && reset.width <= 48 && reset.height <= 48
  })
  await screenshot(page, 'mobile')
  await cdp.send('Emulation.clearDeviceMetricsOverride')

  checks.consoleErrors = consoleErrors.length
  checks.pageErrors = pageErrors.length
  checks.requestFailures = requestFailures.length
  checks.badResponses = badResponses.length
  checks.externalRequests = externalRequests.length
  const expected = {
    title: 'Game Teaching Framework',
    shellVisible: true,
    sessionCountAfterReset: 1,
    legalCandidateCount: 9,
    pointerInspection: true,
    keyboardInspection: true,
    previewVisible: true,
    previewNonMutating: true,
    hoverOverridesSelected: true,
    commitMutatesOnce: true,
    sessionCountAfterCommit: 1,
    chronicleAfterCommit: true,
    reloadResumesMove: true,
    reloadDoesNotDuplicate: true,
    simplifiedChinese: true,
    simplifiedChineseLang: true,
    japanese: true,
    japaneseLang: true,
    localeOptionsExact: true,
    allLocaleMetadata: true,
    arabicRtl: true,
    desktopFits: true,
    mobileFits: true,
    mobileTouchTargets: true,
    mobileHeaderCompact: true,
    consoleErrors: 0,
    pageErrors: 0,
    requestFailures: 0,
    badResponses: 0,
    externalRequests: 0,
  }
  for (const [key, value] of Object.entries(expected)) {
    if (checks[key] !== value) failures.push(`${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(checks[key])}`)
  }
} catch (error) {
  failures.push(error instanceof Error ? `${error.name}: ${error.message}` : String(error))
} finally {
  if (cdp) await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => undefined)
  if (browser) await browser.close().catch(() => undefined)
  const status = {
    status: failures.length === 0 ? 'passed' : 'failed',
    url: appUrl,
    noVnc: `http://127.0.0.1:${process.env.GAME_NOVNC_PORT ?? '6140'}/vnc.html?host=127.0.0.1&port=${process.env.GAME_NOVNC_PORT ?? '6140'}&autoconnect=1&resize=scale`,
    checks,
    failures,
    consoleErrors,
    pageErrors,
    requestFailures,
    badResponses,
    externalRequests,
    screenshots,
  }
  const statusPath = `${evidenceDir}/${runId}-status.json`
  try {
    await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`, { mode: 0o600, flag: 'wx' })
    console.log(JSON.stringify({ ...status, statusFile: statusPath.replace(`${projectRoot}/`, '') }, null, 2))
    if (failures.length > 0) process.exitCode = 1
  } finally {
    await smokeLock.close().catch(() => undefined)
    await unlink(smokeLockPath).catch(() => undefined)
  }
}
