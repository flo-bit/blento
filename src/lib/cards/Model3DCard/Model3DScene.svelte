<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { GLTF, OrbitControls } from '@threlte/extras';
	import type { ThrelteGltf } from '@threlte/extras';
	import { onMount } from 'svelte';
	import {
		Box3,
		Group,
		Vector3,
		BufferGeometry,
		Mesh,
		MeshStandardMaterial,
		type Object3D
	} from 'three';
	import { STLLoader } from 'three/addons/loaders/STLLoader.js';
	import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

	let {
		path,
		hover = false,
		modelType = 'gltf'
	}: {
		path: string;
		hover?: boolean;
		modelType?: 'gltf' | 'stl' | 'fbx';
	} = $props();

	let rotation = $state(0);
	let group: Group | undefined = $state();
	let stlMesh: Mesh | undefined = $state();
	let stlLoaded = $state(false);
	let fbxGroup: Group | undefined = $state();
	let fbxLoaded = $state(false);

	const { start, stop } = useTask((delta: number) => {
		rotation += delta * 0.5;
	});

	$effect(() => {
		if (hover) {
			start();
		} else {
			stop();
		}
	});

	const { renderer } = useThrelte();

	onMount(() => {
		renderer.toneMappingExposure = 0.7;
	});

	// Load STL file
	$effect(() => {
		if (modelType === 'stl' && path) {
			stlLoaded = false;
			const loader = new STLLoader();
			loader.load(
				path,
				(geometry: BufferGeometry) => {
					// Center and scale the geometry
					geometry.computeBoundingBox();
					const box = geometry.boundingBox;
					if (box) {
						const size = new Vector3();
						box.getSize(size);
						const center = new Vector3();
						box.getCenter(center);

						const maxSize = Math.max(size.x, size.y, size.z);
						const scale = 1.2 / maxSize;

						geometry.translate(-center.x, -center.y, -center.z);
						geometry.scale(scale, scale, scale);
					}

					// Create mesh with a nice material
					const material = new MeshStandardMaterial({
						color: 0x808080,
						metalness: 0.3,
						roughness: 0.6
					});

					stlMesh = new Mesh(geometry, material);
					stlLoaded = true;
				},
				undefined,
				(error) => {
					console.error('Error loading STL:', error);
				}
			);
		}
	});

	// Load FBX file
	$effect(() => {
		if (modelType === 'fbx' && path) {
			fbxLoaded = false;
			const loader = new FBXLoader();
			loader.load(
				path,
				(object: Group) => {
					// Center and scale the model
					const box = new Box3().setFromObject(object);
					const size = box.getSize(new Vector3());
					const center = box.getCenter(new Vector3());

					const maxSize = Math.max(size.x, size.y, size.z);
					const scale = 1.2 / maxSize;

					object.scale.set(scale, scale, scale);
					object.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

					fbxGroup = object;
					fbxLoaded = true;
				},
				undefined,
				(error) => {
					console.error('Error loading FBX:', error);
				}
			);
		}
	});

	function handleGltfLoad(gltf: ThrelteGltf) {
		if (!group) return;

		const box = new Box3().setFromObject(gltf.scene as Object3D);
		const size = box.getSize(new Vector3());
		const center = box.getCenter(new Vector3());

		let maxSize = Math.max(size.x, size.y, size.z);
		let scale = 1.2 / maxSize;

		group.scale.set(scale, scale, scale);
		group.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
	}
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 2.5]} fov={50} near={0.1} far={100}>
	<OrbitControls enableZoom={false} enablePan={false} />
</T.PerspectiveCamera>

<T.DirectionalLight args={[0xffffff, 2]} position={[-1, 1, 1]} />
<T.AmbientLight args={[0xffffff, 0.7]} />

<T.Group rotation={[0.3, rotation + 0.5, 0]}>
	{#if modelType === 'stl'}
		{#if stlLoaded && stlMesh}
			<T is={stlMesh} />
		{/if}
	{:else if modelType === 'fbx'}
		{#if fbxLoaded && fbxGroup}
			<T is={fbxGroup} />
		{/if}
	{:else}
		<T.Group bind:ref={group}>
			<GLTF url={path} onload={handleGltfLoad} />
		</T.Group>
	{/if}
</T.Group>
