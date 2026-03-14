<script>
  import { updateCharacter } from '$lib/stores/character.js'

  export let data = { hp: 0, hp_max: 0, mp: 0, mp_max: 0, xp: 0, xp_next: 0, level: 1, title: '', attributes: {} }

  $: { updateCharacter(data) }

  $: hpPct = data.hp_max > 0 ? (data.hp / data.hp_max) * 100 : 0
  $: xpPct = data.xp_next > 0 ? ((data.xp_next - data.xp) / data.xp_next) * 100 : 0
</script>

<div class="stats-block">
  <div class="header">
    <span class="title">{data.title}</span>
    <span class="level">Level {data.level}</span>
  </div>

  <div class="bars">
    <div class="bar-row">
      <span class="bar-label">HP</span>
      <div class="bar-track">
        <div class="bar-fill bar-fill--hp" style="width: {hpPct}%"></div>
      </div>
      <span class="bar-val">{data.hp}/{data.hp_max}</span>
    </div>
    <div class="bar-row">
      <span class="bar-label">XP</span>
      <div class="bar-track">
        <div class="bar-fill bar-fill--xp" style="width: {xpPct}%"></div>
      </div>
      <span class="bar-val">{data.xp_next} to next</span>
    </div>
  </div>

  <div class="attributes">
    {#each Object.entries(data.attributes) as [name, attr]}
      <div class="attr-bubble">
        <span class="attr-emoji">{attr.emoji}</span>
        <span class="attr-score">{attr.score}</span>
        <span class="attr-name">{name.slice(0, 3).toUpperCase()}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .stats-block {
    border: var(--border-width) var(--border-style) var(--border-color);
    padding: var(--space-md);
    margin: var(--space-md) 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space-sm);
    font-size: var(--font-size-lg);
    color: var(--color-accent);
  }
  .bars { margin-bottom: var(--space-sm); }
  .bar-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-xs);
  }
  .bar-label { width: 2ch; font-size: var(--font-size-sm); color: var(--color-text-dim); }
  .bar-track {
    flex: 1;
    height: 8px;
    background: var(--color-accent-dim);
    border: var(--border-width) var(--border-style) var(--border-color);
  }
  .bar-fill { height: 100%; transition: width 0.3s ease; }
  .bar-fill--hp { background: var(--color-danger); }
  .bar-fill--xp { background: var(--color-success); }
  .bar-val { font-size: var(--font-size-sm); color: var(--color-text-dim); min-width: 10ch; text-align: right; }
  .attributes { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
  .attr-bubble {
    border: var(--border-width) var(--border-style) var(--border-color);
    padding: var(--space-xs) var(--space-sm);
    text-align: center;
    min-width: 52px;
  }
  .attr-emoji { display: block; font-size: var(--font-size-base); }
  .attr-score { display: block; font-size: var(--font-size-lg); color: var(--color-accent); }
  .attr-name { display: block; font-size: var(--font-size-sm); color: var(--color-text-dim); }
</style>
