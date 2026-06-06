import { browser } from '$app/environment';

const STORAGE_KEY = 'meteotrack:sidebar-collapsed';

function readInitial(): boolean {
	if (!browser) return false;
	return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * Shared UI state for chrome that several components need to read and update.
 * Replaces the previous `window` custom-event pattern with reactive runes.
 */
class UiState {
	sidebarCollapsed = $state(readInitial());

	toggleSidebar() {
		this.setSidebarCollapsed(!this.sidebarCollapsed);
	}

	setSidebarCollapsed(collapsed: boolean) {
		this.sidebarCollapsed = collapsed;
		if (browser) {
			localStorage.setItem(STORAGE_KEY, String(collapsed));
		}
	}
}

export const uiState = new UiState();
