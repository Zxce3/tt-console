import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import devtools from 'devtools-detect';

function createDevToolsStore() {
    const { subscribe, set, update } = writable({
        isOpen: browser ? devtools.isOpen : false,
        orientation: browser ? devtools.orientation : undefined as string | undefined
    });

    if (browser) {
        window.addEventListener('devtoolschange', (event: any) => {
            set({
                isOpen: event.detail.isOpen,
                orientation: event.detail.orientation
            });
        });
    }

    return {
        subscribe,
        update,
        set
    };
}

export const devToolsStore = createDevToolsStore();
