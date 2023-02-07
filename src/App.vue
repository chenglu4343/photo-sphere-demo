<template>
	<div ref="containerRef" class="container"></div>
</template>

<script setup lang="ts">
import { Viewer, DEFAULTS } from '@photo-sphere-viewer/core'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { onMounted, ref } from 'vue'
import '@photo-sphere-viewer/markers-plugin/index.css'
import { FastGetPolyline } from './plugin'

const containerRef = ref<HTMLElement | null>(null)
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/'

onMounted(() => {
	const viewer = new Viewer({
		container: containerRef.value!,
		/** 全景图图片地址，也可导入6张图片构成的立方体 */
		panorama: baseUrl + 'sphere.jpg',
		/** 加载过程中的图片 */
		loadingImg: baseUrl + 'loader.gif',
		/** 设置容器的大小 */
		size: {
			width: '100vw',
			height: '100vh',
		},

		description: '666',

		/** 缩放倍数 */
		minFov: 30,
		maxFov: 90,
		defaultZoomLvl: 50,

		plugins: [MarkersPlugin, FastGetPolyline],

		/** 水平旋转角度 */
		defaultYaw: -Math.PI / 2,
		/** 垂直旋转角度 */
		defaultPitch: 0,

		/** 设置水平，垂直，切面的旋转角 */
		sphereCorrection: {
			pan: Math.PI / 2,
		},

		keyboardActions: {
			...DEFAULTS.keyboardActions,
		},

		// caption: '导航栏底部文字说明 ',
		/** 移动端双指放大缩小 */
		touchmoveTwoFingers: true,
		/** 滚轮放大缩小需要ctrl */
		mousewheelCtrlKey: false,
	})
})
</script>

<style>
body {
	margin: 0;
}
</style>
