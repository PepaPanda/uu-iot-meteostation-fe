<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { me } from '$lib/api/auth';
    import { auth, clearAuth } from '$lib/stores/auth';

    let { children } = $props();
    let checkingSession = $state(true);

    const publicRoutes = ['/login', '/register'];

    function isPublicRoute(pathname: string): boolean {
        return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
    }

    async function ensureAuthenticated(pathname: string) {
        if (isPublicRoute(pathname)) {
            checkingSession = false;
            return;
        }

        if (get(auth).user) {
            checkingSession = false;
            return;
        }

        checkingSession = true;

        try {
            await me();
            checkingSession = false;
        } catch {
            clearAuth();
            checkingSession = false;
            await goto('/login', { replaceState: true });
        }
    }

    onMount(() => {
        const unsubscribe = page.subscribe(($page) => {
            ensureAuthenticated($page.url.pathname);
        });

        return unsubscribe;
    });
</script>

{#if checkingSession && !isPublicRoute($page.url.pathname)}
    <div class="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
            <p class="font-medium text-slate-700">Ověřuji přihlášení…</p>
        </div>
    </div>
{:else}
    {@render children()}
{/if}

