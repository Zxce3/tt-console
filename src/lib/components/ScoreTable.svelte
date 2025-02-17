<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { ScoreRecord } from '$lib/types';
    
    export let scores: ScoreRecord[] = [];
    export let show: boolean = false;

    let modal: HTMLDivElement;
    let closeButton: HTMLButtonElement;
    
    function handleEscape(e: KeyboardEvent) {
        if (e.key === 'Escape' && show) {
            show = false;
        }
    }

    function handleOutsideClick(e: MouseEvent) {
        if (modal && !modal.contains(e.target as Node)) {
            show = false;
        }
    }

    $: if (show) {
        document.body.style.overflow = 'hidden';
        // Focus the close button when modal opens
        setTimeout(() => closeButton?.focus(), 0);
    } else {
        document.body.style.overflow = '';
    }

    onMount(() => {
        document.addEventListener('keydown', handleEscape);
    });

    onDestroy(() => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
    });
</script>

{#if show}
    <div 
        class="score-modal"
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
    >
        <div class="modal-overlay" role="presentation"></div>
        <div 
            class="modal-content"
            bind:this={modal}
            role="dialog"
        >
            <button 
                class="close-button"
                bind:this={closeButton}
                onclick={() => show = false}
                aria-label="Close high scores"
            >
                ×
            </button>
            <h2 id="modal-title">High Scores</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Score</th>
                            <th>Time</th>
                            <th>Duration</th>
                            <th>Board Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each scores as record}
                            <tr>
                                <td>{record.score}</td>
                                <td>{record.timestamp}</td>
                                <td>{record.duration}</td>
                                <td>{record.rows}×{record.cols}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
{/if}

<style>
    .score-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease-out;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        animation: fadeIn 0.2s ease-out;
    }

    .modal-content {
        position: relative;
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        z-index: 1001;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.2s ease-out;
    }

    .table-container {
        overflow-y: auto;
        max-height: calc(80vh - 6rem);
    }

    .close-button {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .close-button:hover {
        background: #f0f0f0;
        color: #000;
    }

    .close-button:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
    }

    h2 {
        margin-top: 0;
        color: var(--primary-color);
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideIn {
        from { 
            opacity: 0;
            transform: translateY(-20px);
        }
        to { 
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Add responsive styles */
    @media (max-width: 480px) {
        .modal-content {
            padding: 1rem;
            width: 95%;
        }
    }
</style>
