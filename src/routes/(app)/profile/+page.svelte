<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';

	let { data, form } = $props();

	let savingDetails = $state(false);
	let uploadingAvatar = $state(false);
	let previewUrl = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | undefined>();

	const displayedAvatar = $derived(previewUrl ?? data.profile?.avatar_url ?? null);

	function onFileChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) {
			previewUrl = null;
			return;
		}
		previewUrl = URL.createObjectURL(file);
	}
</script>

<svelte:head>
	<title>Profile · Poker Night</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold">Profile</h1>

{#if !data.profile}
	<p class="text-muted">Loading…</p>
{:else}
	<section class="mb-8 rounded-xl border border-border bg-surface p-5">
		<form
			method="POST"
			action="?/uploadAvatar"
			enctype="multipart/form-data"
			use:enhance={() => {
				uploadingAvatar = true;
				return async ({ update }) => {
					await update();
					uploadingAvatar = false;
					previewUrl = null;
					if (fileInput) fileInput.value = '';
				};
			}}
		>
			<div class="flex items-center gap-4">
				<Avatar url={displayedAvatar} name={data.profile.display_name} size={72} />
				<div class="flex-1">
					<label
						class="inline-block cursor-pointer rounded-lg border border-border bg-surface-elev px-3 py-2 text-sm font-medium hover:bg-[#272c27]"
					>
						<input
							bind:this={fileInput}
							type="file"
							name="avatar"
							accept="image/jpeg,image/png,image/webp"
							class="hidden"
							onchange={onFileChange}
						/>
						Choose image
					</label>
					<p class="mt-2 text-xs text-muted">JPG, PNG or WebP · up to 2 MB</p>
				</div>
			</div>

			{#if previewUrl}
				<div class="mt-4 flex justify-end">
					<Button type="submit" loading={uploadingAvatar} size="md">Upload avatar</Button>
				</div>
			{/if}
		</form>
	</section>

	<section class="mb-8 rounded-xl border border-border bg-surface p-5">
		<form
			method="POST"
			action="?/updateDetails"
			use:enhance={() => {
				savingDetails = true;
				return async ({ update }) => {
					await update();
					savingDetails = false;
				};
			}}
			class="space-y-4"
		>
			<div>
				<label for="display_name" class="mb-1 block text-sm font-medium">Display name</label>
				<input
					id="display_name"
					name="display_name"
					required
					maxlength="50"
					value={data.profile.display_name}
					class="w-full rounded-lg border border-border bg-bg px-3 py-3 text-base focus:border-accent focus:outline-none"
				/>
			</div>

			<div>
				<label for="bio" class="mb-1 block text-sm font-medium">Bio</label>
				<textarea
					id="bio"
					name="bio"
					rows="3"
					maxlength="200"
					placeholder="A short bio (max 200 chars)"
					class="w-full resize-none rounded-lg border border-border bg-bg px-3 py-3 text-base focus:border-accent focus:outline-none"
					>{data.profile.bio ?? ''}</textarea
				>
			</div>

			<FormError message={form && 'error' in form ? form.error : null} />

			<div class="flex justify-end">
				<Button type="submit" loading={savingDetails}>Save</Button>
			</div>
			{#if form && 'success' in form && form.success}
				<p class="text-sm text-accent" role="status">Saved.</p>
			{/if}
		</form>
	</section>

	<section class="rounded-xl border border-dashed border-border bg-surface/50 p-5">
		<h2 class="mb-1 font-semibold">Stats</h2>
		<p class="text-sm text-muted">Coming soon — hands played, biggest pots, win rate.</p>
	</section>
{/if}
