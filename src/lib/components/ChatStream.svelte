<script>
  import { fly } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'
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
      <div in:fly={{ x: 100, duration: 500, opacity: 0, easing: cubicOut }}>
        <StatsBlock data={block.data} />
      </div>
    {:else if block.type === 'TASKLIST'}
      <div in:fly={{ x: 100, duration: 500, opacity: 0, easing: cubicOut }}>
        <TaskList data={block.data} />
      </div>
    {:else if block.type === 'ENCOUNTER'}
      <div in:fly={{ x: 100, duration: 500, opacity: 0, easing: cubicOut }}>
        <Encounter data={block.data} attrs={block.attrs ?? {}} />
      </div>
    {:else if block.type === 'DICEROLL'}
      <div in:fly={{ x: 100, duration: 500, opacity: 0, easing: cubicOut }}>
        <DiceRoll data={block.data} />
      </div>
    {:else if block.type === 'AWARD'}
      <div in:fly={{ x: 100, duration: 500, opacity: 0, easing: cubicOut }}>
        <Award data={block.data} />
      </div>
    {:else if block.type === 'SCENE'}
      <div in:fly={{ x: 100, duration: 500, opacity: 0, easing: cubicOut }}>
        <Scene data={block.data} />
      </div>
    {:else if block.type === 'SYSTEM'}
      <div in:fly={{ x: 100, duration: 500, opacity: 0, easing: cubicOut }}>
        <SystemMsg data={block.data} />
      </div>
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
