import DiceRoll from './DiceRoll.svelte'
export default { title: 'Blocks/DiceRoll', component: DiceRoll }
export const CriticalSuccess = { args: { data: { dice: '1d20', modifier: 2, result: 20, total: 22, dc: 13, outcome: 'critical_success', label: 'Attack Roll' } } }
export const Success = { args: { data: { dice: '1d20', modifier: 2, result: 14, total: 16, dc: 13, outcome: 'success', label: 'Attack Roll' } } }
export const Failure = { args: { data: { dice: '1d20', modifier: 2, result: 3, total: 5, dc: 13, outcome: 'failure', label: 'Attack Roll' } } }
export const CriticalFailure = { args: { data: { dice: '1d20', modifier: 2, result: 1, total: 3, dc: 13, outcome: 'critical_failure', label: 'Attack Roll' } } }
export const NoModifier = { args: { data: { dice: '1d20', modifier: 0, result: 9, total: 9, dc: null, outcome: 'success', label: 'Perception Check' } } }
