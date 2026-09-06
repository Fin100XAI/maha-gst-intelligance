/**
 * Registers every Hindi catalogue file. Each import runs its
 * `registerMessages('hi', {...})` as a side effect.
 *
 * Only the shell tier exists so far — navigation, screen names, roles, filters
 * and the labels that recur across pages. Body prose falls back to English
 * until the department settles the statutory vocabulary, which is deliberate:
 * an untranslated sentence is visibly incomplete, a mistranslated statutory
 * term is not.
 */
import './shell.js'
import './modules/statutoryAndRecovery.js'
import './modules/revenueProtection.js'
import './modules/capacityAndDeployment.js'
