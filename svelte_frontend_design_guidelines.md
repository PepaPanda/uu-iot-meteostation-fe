# Svelte Frontend Design Guidelines

These guidelines describe how a Svelte/SvelteKit frontend application should be structured and written when the backend is provided by a separate API server.

Assume **Svelte 5**, **TypeScript**, and **SvelteKit used as the frontend application framework** unless the project explicitly says otherwise.

The app should not use SvelteKit server-side features such as `+page.server.ts`, `+layout.server.ts`, `+server.ts`, form actions, server hooks, server-only modules, or `$lib/server`.

---

## 1. Core principles

Prefer:

- Svelte 5 syntax and runes
- TypeScript
- Small, focused components
- Route-based structure with SvelteKit
- Client-side API access through a dedicated API layer
- Local state before global state
- Native HTML and CSS before custom abstractions
- Semantic, accessible UI
- Clear feature boundaries
- Simple code over framework-heavy architecture

Avoid:

- React-style patterns copied into Svelte unnecessarily
- Global stores for ordinary local state
- Large generic components with too many modes
- Client logic scattered across page components
- Direct `fetch` calls everywhere
- Deep prop drilling
- Unnecessary wrapper abstractions
- Server-side SvelteKit files in the frontend app

---

## 2. Recommended project structure

Use this structure as the default for a medium or large frontend app:

```txt
src/
  routes/
    +layout.svelte
    +layout.ts
    +error.svelte

    +page.svelte

    (public)/
      +layout.svelte
      login/
        +page.svelte
      register/
        +page.svelte
      about/
        +page.svelte

    (app)/
      +layout.svelte
      dashboard/
        +page.svelte
        +page.ts
        _components/
          DashboardCard.svelte
          RecentActivity.svelte

      settings/
        +page.svelte
        +page.ts
        _components/
          SettingsForm.svelte

      users/
        +page.svelte
        +page.ts
        [id]/
          +page.svelte
          +page.ts
          _components/
            UserHeader.svelte
            UserActivity.svelte

  lib/
    api/
      client.ts
      errors.ts
      auth-api.ts
      user-api.ts
      dashboard-api.ts

    components/
      ui/
        Button.svelte
        Input.svelte
        Select.svelte
        Dialog.svelte
        Card.svelte
      layout/
        AppShell.svelte
        Sidebar.svelte
        Header.svelte

    features/
      auth/
        components/
          LoginForm.svelte
          RegisterForm.svelte
        auth-state.svelte.ts
        auth-types.ts
        auth-utils.ts

      users/
        components/
          UserList.svelte
          UserRow.svelte
          UserForm.svelte
        user-types.ts
        user-utils.ts

      dashboard/
        components/
          StatsGrid.svelte
          ActivityFeed.svelte
        dashboard-types.ts

    state/
      app-state.svelte.ts

    utils/
      cn.ts
      format.ts
      assert.ts
      debounce.ts

    types/
      common.ts
      api.ts

  app.css
  app.d.ts
  app.html

static/
tests/
```

Rules:

- Put pages and layouts in `src/routes`.
- Put reusable code in `src/lib`.
- Put API communication in `$lib/api`.
- Put reusable UI primitives in `$lib/components/ui`.
- Put layout components in `$lib/components/layout`.
- Put domain-specific code in `$lib/features/<feature>`.
- Put route-only components next to their route in `_components/`.
- Do not create `$lib/server`.
- Do not create `+page.server.ts`, `+layout.server.ts`, `+server.ts`, or `hooks.server.ts`.
- Use route groups like `(public)` and `(app)` to separate layouts without changing URLs.

---

## 3. File naming

Use:

- `PascalCase.svelte` for components
- `kebab-case.ts` for regular TypeScript modules
- `*.svelte.ts` for reusable reactive rune-based logic
- `types.ts` or `<feature>-types.ts` for types
- `schemas.ts` for validation schemas
- `+page.svelte` for route pages
- `+layout.svelte` for route layouts
- `+page.ts` for universal page loading when needed
- `_components/` for route-local components

Avoid:

- `+page.server.ts`
- `+layout.server.ts`
- `+server.ts`
- `hooks.server.ts`
- `$lib/server`

---

## 4. Svelte 5 component style

Prefer Svelte 5 syntax with `$props`, runes, snippets, and callback props.

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		description?: string;
		selected?: boolean;
		children?: Snippet;
		onSelect?: () => void;
	};

	let { title, description, selected = false, children, onSelect }: Props = $props();
</script>

<section data-selected={selected}>
	<header>
		<h2>{title}</h2>

		{#if description}
			<p>{description}</p>
		{/if}
	</header>

	{#if children}
		{@render children()}
	{/if}

	{#if onSelect}
		<button type="button" onclick={onSelect}>Select</button>
	{/if}
</section>
```

Rules:

- Use `$props()` instead of `export let`.
- Type props explicitly.
- Destructure props near the top of the component.
- Use callback props instead of event dispatchers.
- Use snippets and `{@render ...}` for children and renderable content.
- Keep component APIs small.
- Prefer semantic HTML.
- Prefer native events such as `onclick={handler}`.
- Use `bind:` sparingly.
- Use `$bindable` only when two-way binding is genuinely part of the component API.
- Avoid components with many unrelated variants or behavior modes.

---

## 5. State management

Use the smallest sufficient state scope.

Priority:

1. Local component state with `$state`
2. Computed state with `$derived`
3. Reusable reactive logic in `.svelte.ts`
4. Context for parent-owned tree state
5. Global app state only for truly app-wide concerns

Use `$state` for mutable reactive state:

```ts
let count = $state(0);

let form = $state({
	email: '',
	password: ''
});
```

Use `$derived` for computed values:

```ts
let fullName = $derived(`${firstName} ${lastName}`);
let activeUsers = $derived(users.filter((user) => user.active));
```

Use `$effect` only for side effects:

```ts
$effect(() => {
	const controller = new AbortController();

	window.addEventListener('resize', handleResize, {
		signal: controller.signal
	});

	return () => controller.abort();
});
```

Rules:

- Do not put side effects inside `$derived`.
- Do not use `$effect` for values that can be computed with `$derived`.
- Use `$effect` for subscriptions, browser APIs, logging, DOM integrations, and imperative libraries.
- Return cleanup functions from `$effect` when needed.
- Keep global state rare and deliberate.
- Prefer `.svelte.ts` files for reusable reactive logic.

Example global UI state:

```ts
// src/lib/state/app-state.svelte.ts
export const appState = $state({
	sidebarOpen: false,
	theme: 'system' as 'light' | 'dark' | 'system'
});

export function toggleSidebar() {
	appState.sidebarOpen = !appState.sidebarOpen;
}
```

---

## 6. API layer

Because the project uses its own API server, frontend code should communicate through a dedicated API layer.

Do not scatter raw `fetch` calls across components.

Use a shared API client:

```ts
// src/lib/api/client.ts
import { ApiError } from './errors';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type RequestOptions = RequestInit & {
	auth?: boolean;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		credentials: 'include'
	});

	if (!response.ok) {
		let body: unknown = null;

		try {
			body = await response.json();
		} catch {
			body = null;
		}

		throw new ApiError(response.status, response.statusText, body);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
```

```ts
// src/lib/api/errors.ts
export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly statusText: string,
		public readonly body: unknown
	) {
		super(`API request failed: ${status} ${statusText}`);
	}
}
```

Create feature-specific API modules:

```ts
// src/lib/api/user-api.ts
import { apiFetch } from './client';
import type { User, UpdateUserInput } from '$lib/features/users/user-types';

export function getUsers() {
	return apiFetch<User[]>('/users');
}

export function getUser(id: string) {
	return apiFetch<User>(`/users/${id}`);
}

export function updateUser(id: string, input: UpdateUserInput) {
	return apiFetch<User>(`/users/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(input)
	});
}
```

Rules:

- Use `VITE_` environment variables for frontend-exposed config.
- Keep API base URL in one place.
- Keep request error handling in one place.
- Keep authentication handling in one place.
- Use typed request and response models.
- Components should call feature APIs or feature-level actions, not construct URLs manually.
- Never expose private secrets in frontend environment variables.
- Assume anything in the frontend is visible to the user.

---

## 7. Page data loading

Use `+page.ts` when a route needs data before rendering.

```ts
// src/routes/(app)/users/+page.ts
import type { PageLoad } from './$types';
import { getUsers } from '$lib/api/user-api';

export const load: PageLoad = async () => {
	return {
		users: await getUsers()
	};
};
```

Then consume the data in the page:

```svelte
<script lang="ts">
	import type { PageProps } from './$types';
	import UserList from '$lib/features/users/components/UserList.svelte';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Users</title>
</svelte:head>

<UserList users={data.users} />
```

Rules:

- Use `+page.ts` for route-level data needed at navigation time.
- Use component-level fetching for local, optional, or interaction-driven data.
- Keep `load` functions thin.
- Put actual API calls in `$lib/api`.
- Use generated SvelteKit types from `./$types`.
- Handle loading, error, and empty states intentionally.
- Do not use `+page.server.ts`.

---

## 8. Client-side mutations

For mutations, call the API server through the API layer.

Example form component:

```svelte
<script lang="ts">
	import { updateUser } from '$lib/api/user-api';
	import type { User } from '../user-types';

	type Props = {
		user: User;
		onSaved?: (user: User) => void;
	};

	let { user, onSaved }: Props = $props();

	let name = $state(user.name);
	let error = $state<string | null>(null);
	let saving = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		error = null;
		saving = true;

		try {
			const updatedUser = await updateUser(user.id, { name });
			onSaved?.(updatedUser);
		} catch {
			error = 'Could not save user.';
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={handleSubmit}>
	<label>
		Name
		<input bind:value={name} disabled={saving} />
	</label>

	{#if error}
		<p role="alert">{error}</p>
	{/if}

	<button disabled={saving}>
		{saving ? 'Saving...' : 'Save'}
	</button>
</form>
```

Rules:

- Keep form state local unless multiple components need it.
- Validate input client-side for better UX.
- Still rely on the API server for authoritative validation.
- Disable submit controls while saving when appropriate.
- Show clear error states.
- Do not use SvelteKit form actions when the backend is a separate API server.

---

## 9. Authentication frontend structure

The API server owns authentication. The frontend should only manage UI state and session awareness.

Suggested files:

```txt
src/lib/features/auth/
  components/
    LoginForm.svelte
    UserMenu.svelte
  auth-state.svelte.ts
  auth-types.ts
  auth-utils.ts

src/lib/api/
  auth-api.ts
```

Example auth API:

```ts
// src/lib/api/auth-api.ts
import { apiFetch } from './client';
import type { LoginInput, SessionUser } from '$lib/features/auth/auth-types';

export function login(input: LoginInput) {
	return apiFetch<SessionUser>('/auth/login', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export function logout() {
	return apiFetch<void>('/auth/logout', {
		method: 'POST'
	});
}

export function getCurrentUser() {
	return apiFetch<SessionUser | null>('/auth/me');
}
```

Example auth state:

```ts
// src/lib/features/auth/auth-state.svelte.ts
import type { SessionUser } from './auth-types';

export const authState = $state({
	user: null as SessionUser | null,
	initialized: false
});

export function setUser(user: SessionUser | null) {
	authState.user = user;
	authState.initialized = true;
}
```

Rules:

- Prefer HTTP-only cookies if the API server supports them.
- If tokens are required in the frontend, isolate token handling in the API layer.
- Do not store sensitive secrets in local storage.
- Treat client auth state as a UX helper, not a security boundary.
- Protected data must still be protected by the API server.
- Use route guards only for user experience, not security.

---

## 10. Routing and layouts

Use SvelteKit filesystem routing for frontend routes.

Rules:

- Use `+layout.svelte` for shared shells.
- Use route groups for layout separation.
- Use normal `<a href="/path">` links for navigation.
- Use `goto` only for imperative navigation after user actions.
- Use `+error.svelte` for route error UI.
- Use dynamic routes like `[id]` only when the URL segment is truly dynamic.
- Do not build a custom router.

Example layout:

```svelte
<script lang="ts">
	import type { LayoutProps } from './$types';
	import AppShell from '$lib/components/layout/AppShell.svelte';

	let { children }: LayoutProps = $props();
</script>

<AppShell>
	{@render children()}
</AppShell>
```

---

## 11. Styling and design system

Preferred styling approach:

- Component-scoped CSS for component-specific styles
- CSS variables for design tokens
- Global CSS only for reset, typography, tokens, and base layout
- Utility classes only if the project already uses Tailwind or similar
- Reusable UI primitives for repeated interface patterns

Suggested layers:

```txt
src/app.css                 global reset, tokens, typography
$lib/components/ui          generic UI primitives
$lib/components/layout      app layout components
$lib/features/*/components  feature-specific components
route/_components           route-only components
```

Rules:

- Do not overbuild a design system before patterns repeat.
- Prefer tokens for color, spacing, radius, shadows, and typography.
- Use semantic variants like `primary`, `secondary`, `danger`, and `ghost`.
- Keep focus states visible.
- Respect reduced-motion preferences.
- Avoid random one-off colors and spacing values.
- Keep reusable UI components visually consistent but behaviorally simple.

Example token style:

```css
:root {
	--color-bg: #ffffff;
	--color-text: #111827;
	--color-muted: #6b7280;
	--color-border: #e5e7eb;

	--radius-sm: 0.375rem;
	--radius-md: 0.5rem;
	--radius-lg: 0.75rem;

	--space-1: 0.25rem;
	--space-2: 0.5rem;
	--space-3: 0.75rem;
	--space-4: 1rem;
}
```

---

## 12. Accessibility

Rules:

- Use semantic HTML first.
- Every page should have a useful `<title>`.
- Inputs need labels.
- Buttons perform actions.
- Links navigate.
- Interactive elements must be keyboard accessible.
- Do not ignore Svelte accessibility warnings without a specific reason.
- Use ARIA only when native HTML cannot express the behavior.
- Provide alt text for meaningful images.
- Use empty alt text only for decorative images.
- Maintain focus behavior in dialogs, drawers, and menus.

Example:

```svelte
<svelte:head>
	<title>Settings</title>
</svelte:head>
```

---

## 13. Lists and rendering

Rules:

- Use keyed `{#each}` blocks for lists with identity.
- Prefer stable IDs as keys.
- Do not use array indexes as keys unless the list is static and never reordered.
- Add empty states.

```svelte
{#each users as user (user.id)}
	<UserRow {user} />
{:else}
	<p>No users found.</p>
{/each}
```

---

## 14. Effects and browser-only code

Rules:

- Use `$effect` for reactive side effects.
- Use `onMount` for code that must only run after the component mounts.
- Do not access `window`, `document`, or `localStorage` in code that may run before mounting.
- Prefer actions for reusable DOM behavior.
- Clean up event listeners, timers, and subscriptions.

Bad:

```svelte
<script lang="ts">
	let width = window.innerWidth;
</script>
```

Better:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';

	let width = $state(0);

	onMount(() => {
		width = window.innerWidth;
	});
</script>
```

---

## 15. Component communication

Use:

- Props for parent-to-child data
- Callback props for child-to-parent communication
- Snippets for renderable child content
- Context for parent-owned shared tree state
- `.svelte.ts` modules for shared reactive logic

Avoid:

- Event dispatchers in new Svelte 5 code
- Deep prop drilling across many levels
- Global state for local UI concerns
- Two-way binding unless it clearly improves the API

---

## 16. Error handling

Rules:

- Convert API errors into user-friendly UI states.
- Keep raw API error handling inside the API layer where possible.
- Show useful empty, loading, and error states.
- Do not expose internal technical messages directly to users.
- Log errors consistently during development.
- Treat failed requests as expected states, not edge cases.

Example error boundary page:

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Error</title>
</svelte:head>

<h1>Something went wrong</h1>
<p>{page.status}</p>
<p>{page.error?.message ?? 'Unknown error'}</p>
```

---

## 17. Testing

Use:

- Unit tests for utilities, schemas, and API helpers
- Component tests for complex UI behavior
- End-to-end tests for critical user flows
- Accessibility checks for forms, dialogs, navigation, and layout

Rules:

- Test feature logic outside components when possible.
- Mock the API layer rather than scattering fetch mocks everywhere.
- Test loading, empty, error, and success states.
- Test auth-sensitive UI flows.
- Prefer behavior tests over implementation-detail tests.

---

## 18. Performance

Rules:

- Keep client JavaScript minimal.
- Avoid heavy global state.
- Avoid large dependencies for small UI behavior.
- Lazy-load large browser-only libraries.
- Keep root layouts lightweight.
- Avoid unnecessary reactive effects.
- Use keyed lists correctly.
- Avoid refetching the same data repeatedly without reason.
- Cache API responses intentionally when useful.
- Prefer CSS transitions over JavaScript animation when possible.

---

## 19. Code quality rules

Always:

- Use TypeScript.
- Use generated SvelteKit types.
- Keep components focused.
- Keep API access centralized.
- Validate user input client-side for UX.
- Rely on API server validation for correctness and security.
- Name files and functions by domain meaning.
- Keep markup readable.
- Prefer explicit code over clever abstractions.

Never:

- Put backend secrets in frontend code.
- Use SvelteKit server files in this frontend app.
- Put raw `fetch` calls throughout components.
- Use `$effect` as a replacement for normal computed state.
- Use global state for everything.
- Ignore accessibility warnings casually.
- Use `{@html}` with untrusted input.
- Create giant generic components that hide simple HTML.

---

## 20. Decision defaults

When unsure, choose:

- SvelteKit routing over a custom router
- Svelte 5 runes over legacy reactivity
- Local `$state` over global state
- `$derived` over `$effect` for computed values
- Callback props over event dispatchers
- Snippets over legacy slots
- Route-local components over global components
- Dedicated API modules over raw `fetch` in components
- Semantic HTML over custom ARIA-heavy widgets
- Component CSS and tokens over random one-off styling
- Simple composition over clever abstractions

---

## 21. Output expectations for generated code

When generating code for this app:

- Create complete files when possible.
- Use Svelte 5 syntax.
- Use TypeScript.
- Respect SvelteKit route file names.
- Do not generate server-side SvelteKit files.
- Do not use `$lib/server`.
- Put API calls in `$lib/api`.
- Keep components accessible.
- Include loading, error, and empty states where relevant.
- Do not invent unnecessary libraries.
- Do not introduce global state unless there is a clear reason.
- Keep feature code colocated and easy to navigate.
