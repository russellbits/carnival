<script>
    const taglines = [
        "Enter the realm where heroes get chores done!",
        "Your tasks await, adventurer. The dungeon is real.",
        "Fame, glory, and a completed to-do list await.",
        "The bravest heroes still do their laundry.",
        "Every quest begins with a single checkbox.",
        "Slay procrastination. Earn experience points.",
        "The dungeon doesn't care about your feelings. Only your productivity.",
    ];

    const tagline = taglines[Math.floor(Math.random() * taglines.length)];

    let { onCommand = () => {} } = $props();

    const buttons = [
        { label: "LOGIN", cmd: null },
        { label: "START", cmd: "/start" },
        { label: "RECAP", cmd: "/story" },
        { label: "INBOX", cmd: "/inbox" },
        { label: "STATS", cmd: "/stats" },
    ];
</script>

<div class="home-screen">
    <img src="/assets/title.png" alt="Taskcraft" class="hero-image" />
    <div class="tagline-box">{tagline}</div>
    <nav class="button-row">
        {#each buttons as btn}
            <button
                class="nav-btn"
                disabled={btn.cmd === null}
                onclick={() => btn.cmd && onCommand(btn.cmd)}
                >{btn.label}</button
            >
        {/each}
    </nav>
</div>

<style>
    .home-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        padding-bottom: var(--space-lg);
        margin-top: 150px;
    }

    .hero-image {
        width: min(90vw, 830px);
        height: auto;
        display: block;
        margin: 0 auto;
    }

    .tagline-box {
        width: 100%;
        max-width: 640px;
        border: var(--border-width) var(--border-style) var(--border-color);
        padding: var(--space-sm) var(--space-md);
        margin: var(--space-lg) 0 var(--space-md);
        text-align: center;
        color: var(--color-text);
        font-family: var(--font-mono);
        font-size: var(--font-size-base);
    }

    .button-row {
        display: flex;
        gap: var(--space-md);
        flex-wrap: wrap;
        justify-content: center;
    }

    .nav-btn {
        font-family: var(--font-display);
        font-size: var(--font-size-base);
        color: var(--color-bg);
        background: var(--color-accent);
        border: var(--border-width) var(--border-style) var(--color-accent);
        padding: var(--space-xs) var(--space-lg);
        cursor: pointer;
        letter-spacing: 0.15em;
        transition:
            background 0.15s,
            color 0.15s;
    }

    .nav-btn:hover:not(:disabled) {
        background: var(--color-bg);
        color: var(--color-accent);
    }

    .nav-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }
</style>
