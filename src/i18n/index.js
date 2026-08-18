/**
 * src/i18n
 *
 * The platform's language seam. Import `t` from here — never from `./locale`
 * directly — so that importing the translator is what installs the
 * compositional fallback and every catalogue behind it.
 *
 *   import { t } from '../i18n/index.js'
 *   <h1>{t('District Performance')}</h1>
 *   {t('{0} districts are in deficit', count)}
 */

// Side-effect imports: the composer registers itself, and each catalogue
// registers its messages. Order matters only in that both must be installed
// before the first `t()` call, which importing this module guarantees.
import './compose.js'
import './mr/index.js'

export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_INFO,
  LOCALE_STORAGE_KEY,
  catalogueSize,
  clearUntranslatedMessages,
  getLocale,
  getLocaleInfo,
  hasMessage,
  isTranslated,
  registerMessages,
  setActiveLocale,
  t,
  tList,
  tn,
  untranslatedMessages
} from './locale.js'
