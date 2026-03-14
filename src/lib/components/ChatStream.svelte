<script>
  import Prose from './blocks/Prose.svelte'
  import StatsBlock from './blocks/StatsBlock.svelte'
  import TaskList from './blocks/TaskList.svelte'
  import Encounter from './blocks/Encounter.svelte'
  import DiceRoll from './blocks/DiceRoll.svelte'
  import Award from './blocks/Award.svelte'
  import Scene from './blocks/Scene.svelte'
  import SystemMsg from './blocks/SystemMsg.svelte'

  let { blocks = [], onRefocus = () => {} } = $props()

  let el

  $effect(() => {
    // Re-run whenever blocks changes to scroll to bottom
    blocks
    if (el) el.scrollTop = el.scrollHeight
  })
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="chat-stream" bind:this={el} onclick={onRefocus} role="presentation">
  {#each blocks as block, i (i)}
    {#if block.type === 'prose'}
      <Prose text={block.text} />
    {:else if block.type === 'STATS'}
      <StatsBlock data={block.data} />
    {:else if block.type === 'TASKLIST'}
      <TaskList data={block.data} />
    {:else if block.type === 'ENCOUNTER'}
      <Encounter data={block.data} attrs={block.attrs ?? {}} />
    {:else if block.type === 'DICEROLL'}
      <DiceRoll data={block.data} />
    {:else if block.type === 'AWARD'}
      <Award data={block.data} />
    {:else if block.type === 'SCENE'}
      <Scene data={block.data} />
    {:else if block.type === 'SYSTEM'}
      <SystemMsg data={block.data} />
    {/if}
  {/each}
</div>

<style>
  .chat-stream {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
    scroll-behavior: smooth;
  }
  .chat-stream::-webkit-scrollbar { width: 4px; }
  .chat-stream::-webkit-scrollbar-track { background: var(--color-bg); }
  .chat-stream::-webkit-scrollbar-thumb { background: var(--color-accent-dim); }
</style>
