/**
 * The marker an agent wraps every quoted figure in.
 *
 * ``[[calc:<hash>]] 1,98,000.00``. The fidelity middleware rejects a response
 * containing any number that did not come back from a tool, so the chip is not
 * decoration: it is the evidence that the figure is the engine's and not the
 * model's.
 */
export const CHIP_PATTERN = String.raw`\[\[calc:([0-9a-f]{8,64})\]\]\s*`

/** How many figures in an answer carry a handle. Shown beside the answer. */
export function countChips(text: string): number {
  return [...text.matchAll(new RegExp(CHIP_PATTERN, 'g'))].length
}
