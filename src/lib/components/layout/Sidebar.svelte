<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon, { type IconName } from '$lib/components/ui/Icon.svelte';
	import { authState } from '$lib/features/auth/auth-state.svelte';
	import { uiState } from '$lib/state/ui-state.svelte';
	import type { Role } from '$lib/types/common';
	import { initials } from '$lib/utils/format';
	import { roleLabel } from '$lib/utils/role';

	interface NavItem {
		href: string;
		label: string;
		icon: IconName;
		minRole: Role;
	}

	const NAV_ITEMS: NavItem[] = [
		{ href: '/dashboard', label: 'Přehled', icon: 'dashboard', minRole: 'guest' },
		{ href: '/gateways', label: 'Gatewaye', icon: 'gateway', minRole: 'guest' },
		{ href: '/notifications', label: 'Notifikace', icon: 'bell', minRole: 'guest' },
		{ href: '/users', label: 'Uživatelé', icon: 'users', minRole: 'supervisor' }
	];

	const visibleItems = $derived(NAV_ITEMS.filter((item) => authState.can(item.minRole)));
	const collapsed = $derived(uiState.sidebarCollapsed);

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	async function handleLogout() {
		await authState.logout();
		await goto('/login');
	}
</script>

<!-- Desktop sidebar -->
<aside class="sidebar" class:collapsed aria-label="Hlavní navigace">
	<div class="brand">
		<span class="logo" aria-hidden="true"><Icon name="thermometer" size={22} /></span>
		{#if !collapsed}<span class="brand-name">MeteoTrack</span>{/if}
	</div>

	<nav class="nav">
		{#each visibleItems as item (item.href)}
			<a
				class="nav-link"
				class:active={isActive(item.href)}
				href={item.href}
				title={collapsed ? item.label : undefined}
				aria-current={isActive(item.href) ? 'page' : undefined}
			>
				<span class="nav-icon"><Icon name={item.icon} /></span>
				{#if !collapsed}<span class="nav-label">{item.label}</span>{/if}
			</a>
		{/each}
	</nav>

	<div class="footer">
		{#if authState.user}
			<div class="user" class:collapsed>
				<span class="avatar" aria-hidden="true">{initials(authState.user.nickname)}</span>
				{#if !collapsed}
					<span class="user-info">
						<span class="user-name">{authState.user.nickname}</span>
						<span class="user-role">{roleLabel(authState.user.role)}</span>
					</span>
				{/if}
			</div>
		{/if}

		<button class="action" type="button" onclick={handleLogout} title="Odhlásit se">
			<span class="nav-icon"><Icon name="logout" /></span>
			{#if !collapsed}<span>Odhlásit se</span>{/if}
		</button>

		<button
			class="action collapse-toggle"
			type="button"
			onclick={() => uiState.toggleSidebar()}
			title={collapsed ? 'Rozbalit' : 'Sbalit'}
			aria-label={collapsed ? 'Rozbalit panel' : 'Sbalit panel'}
		>
			<span class="nav-icon">
				<Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
			</span>
			{#if !collapsed}<span>Sbalit</span>{/if}
		</button>
	</div>
</aside>

<!-- Mobile bottom navigation -->
<nav class="bottom-nav" aria-label="Hlavní navigace">
	{#each visibleItems as item (item.href)}
		<a class="bottom-link" class:active={isActive(item.href)} href={item.href}>
			<Icon name={item.icon} />
			<span>{item.label}</span>
		</a>
	{/each}
	<button class="bottom-link" type="button" onclick={handleLogout}>
		<Icon name="logout" />
		<span>Odhlásit</span>
	</button>
</nav>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		width: var(--sidebar-width);
		height: 100vh;
		position: sticky;
		top: 0;
		padding: var(--space-4);
		gap: var(--space-4);
		background-color: var(--color-surface);
		border-right: 1px solid var(--color-border);
		transition: width 0.18s ease;
	}

	.sidebar.collapsed {
		width: var(--sidebar-width-collapsed);
		align-items: center;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2);
		min-height: 2.5rem;
	}

	.logo {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-md);
		background-color: var(--color-primary-soft);
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.brand-name {
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--color-text);
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		width: 100%;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: 0.6rem 0.75rem;
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		font-weight: 500;
		font-size: var(--text-sm);
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	.collapsed .nav-link {
		justify-content: center;
	}

	.nav-link:hover {
		background-color: var(--color-surface-hover);
		color: var(--color-text);
		text-decoration: none;
	}

	.nav-link.active {
		background-color: var(--color-primary-soft);
		color: var(--color-primary-soft-text);
		font-weight: 600;
	}

	.nav-icon {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
	}

	.footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-3);
	}

	.user {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2);
	}

	.user.collapsed {
		justify-content: center;
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-full);
		background-color: var(--color-primary);
		color: #fff;
		font-size: var(--text-xs);
		font-weight: 700;
		flex-shrink: 0;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.user-name {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-role {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.action {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: 0.55rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-weight: 500;
		width: 100%;
	}

	.collapsed .action {
		justify-content: center;
	}

	.action:hover {
		background-color: var(--color-surface-hover);
		color: var(--color-text);
	}

	/* Mobile bottom nav */
	.bottom-nav {
		display: none;
	}

	@media (max-width: 768px) {
		.sidebar {
			display: none;
		}

		.bottom-nav {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 40;
			display: flex;
			justify-content: space-around;
			background-color: var(--color-surface);
			border-top: 1px solid var(--color-border);
			padding: 0.35rem 0.25rem calc(0.35rem + env(safe-area-inset-bottom, 0));
		}

		.bottom-link {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.15rem;
			flex: 1;
			padding: 0.4rem 0.25rem;
			border: none;
			background: transparent;
			color: var(--color-text-muted);
			font-size: 0.7rem;
			font-weight: 500;
			text-decoration: none;
		}

		.bottom-link.active {
			color: var(--color-primary);
		}
	}
</style>
