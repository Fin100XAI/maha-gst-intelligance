/**
 * Registers every Hindi catalogue file. Each import runs its
 * `registerMessages('hi', {...})` as a side effect.
 *
 * Two tiers are complete. The shell — navigation, screen names, roles, filters
 * and the labels that recur across pages — and dataValues, the closed
 * vocabularies carried by the records themselves. dataValues matters out of
 * proportion to its size: those hundred-odd strings render thousands of times,
 * so a screen whose prose is translated still reads as English until they are.
 *
 * Body prose on screens without a module file below falls back to English until
 * the department settles the statutory vocabulary, which is deliberate: an
 * untranslated sentence is visibly incomplete, a mistranslated statutory term
 * is not.
 */
import './shell.js'
import './dataValues.js'
import './shellPanels.js'
import './landingCopy.js'
import './data/coreRecords.js'
import './data/briefCapacityDiscovery.js'
import './data/priorityAndRecovery.js'
import './data/commandCentre.js'
import './data/retrospectiveAndPrecedent.js'
import './data/aiAndRegistry.js'
import './data/mockRecords.js'
import './data/engineStack.js'
import './data/extractSpec.js'
import './data/projectResources.js'
import './data/official.js'
import './data/reportsAndActions.js'
import './modules/remainder.js'
import './modules/executiveAndRevenue.js'
import './modules/auditAndLitigation.js'
import './modules/itcEwayAndRefund.js'
import './modules/benchmarkingAndWarning.js'
import './modules/priorityTwinAndCopilot.js'
import './modules/networkAndPrecedent.js'
import './modules/recoveryAndDiscovery.js'
import './modules/governanceAndDelivery.js'
import './modules/counterfactualAndRetrospective.js'
import './modules/statutoryAndRecovery.js'
import './modules/revenueProtection.js'
import './modules/capacityAndDeployment.js'

/* Section reworks — one catalogue per navigation section. */
import './sections/command.js'
import './sections/revenue.js'
import './sections/priority.js'
import './sections/legal.js'
import './sections/missed.js'
import './sections/bench.js'
import './sections/data.js'
import './sections/discovery.js'
import './sections/gov.js'
import './sections/computed.js'
