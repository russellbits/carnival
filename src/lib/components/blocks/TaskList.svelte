<script>
  export let data = { label: '', tasks: [] }

  const priorityColors = { A: 'var(--color-danger)', B: 'var(--color-warning)', C: 'var(--color-success)', D: 'var(--color-text-dim)', E: 'var(--color-text-dim)' }
</script>

<div class="task-list">
  {#if data.label}
    <div class="label">{data.label}</div>
  {/if}
  <ol class="tasks">
    {#each data.tasks as task (task.id)}
      <li class="task" class:complete={task.complete}>
        <span class="priority" style="color: {priorityColors[task.priority] ?? 'inherit'}">[{task.priority}]</span>
        <span class="text">{task.text}</span>
        <span class="attr">{task.attribute}</span>
        <span class="points">+{task.points}xp</span>
      </li>
    {/each}
  </ol>
</div>

<style>
  .task-list {
    margin: var(--space-md) 0;
  }
  .label {
    color: var(--color-text-dim);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-sm);
  }
  .tasks {
    list-style: decimal;
    padding-left: var(--space-lg);
  }
  .task {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-xs) 0;
    align-items: baseline;
    font-size: var(--font-size-base);
  }
  .task.complete { opacity: 0.4; text-decoration: line-through; }
  .priority { font-family: var(--font-mono); min-width: 3ch; }
  .text { flex: 1; }
  .attr { font-size: var(--font-size-sm); }
  .points { font-size: var(--font-size-sm); color: var(--color-text-dim); min-width: 8ch; text-align: right; }
</style>
