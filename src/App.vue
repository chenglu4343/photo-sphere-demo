<template>
	<div ref="containerRef" class="container"></div>
</template>

<script setup lang="ts">
import { Viewer, DEFAULTS, ClickData } from '@photo-sphere-viewer/core'
import { Marker, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { onMounted, ref } from 'vue'
import '@photo-sphere-viewer/markers-plugin/index.css'

type Position = { yaw: number; pitch: number }

const prefix = 'fast-get-polyline'
const containerRef = ref<HTMLElement | null>(null)
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/'
const bluePointImage = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-blue.png'
const redPointImage = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-red.png'
const clipboard = navigator.clipboard

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

		plugins: [MarkersPlugin],

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

	const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin

	let paths: string[] = []

	const clearPaths = () =>
		paths.forEach((id) => {
			markersPlugin.removeMarker(id)
			paths = []
		})

	markersPlugin.addEventListener('select-marker', ({ marker, doubleClick }) => {
		if (doubleClick) {
			if (isPointMarker(marker)) {
				clearPaths()
			} else if (isPolylineMarker(marker)) {
				markersPlugin.removeMarker(marker.id)
			}
		} else if (isPolylineMarker(marker)) {
			clipboard.writeText(JSON.stringify(marker.config.polyline))
		} else if (isPointMarker(marker) && paths.length >= 3 && marker.id === paths[0]) {
			markersPlugin.addMarker({
				id: `${prefix}-polyline-${Math.random()}`,
				polyline: paths.concat(paths[0]).map((id) => {
					const position = markersPlugin.getMarker(id).config.position as Position
					return [position!.yaw, position!.pitch] as [number, number]
				}),
				svgStyle: {
					fill: 'rgba(200, 0, 0, 0.2)',
					stroke: 'rgba(200, 0, 50, 0.8)',
					strokeWidth: '2px',
				},
				tooltip: {
					content: 'click to copy polyline,dbClick to remove',
					position: 'bottom right',
				},
			})

			clearPaths()
		}
	})

	/** 点击 */
	viewer.addEventListener('click', ({ data }) => {
		if (!data.rightclick) {
			const pointMaker = getPointMaker(data, paths.length)
			markersPlugin.addMarker(pointMaker)

			const maker = markersPlugin.getMarker(pointMaker.id)
			paths.push(maker.id)
		}
	})
})

function isPointMarker(marker: Marker) {
	return marker.id.startsWith(prefix + '-point')
}
function isPolylineMarker(marker: Marker) {
	return marker.id.startsWith(prefix + '-polyline')
}
/** 获取一个点的数据 */
function getPointMaker(data?: ClickData, index?: number) {
	return {
		id: prefix + '-point-' + Math.random(),
		position: { yaw: data?.yaw || 0, pitch: data?.pitch || 0 },
		image: index === 0 ? redPointImage : bluePointImage,
		size: { width: 32, height: 32 },
		anchor: 'bottom center',
		zoomLvl: 100,
		data: {
			generated: true,
		},
		tooltip: index === 0 ? 'start point<br>dbClick to delete' : `point ${index}<br>dbClick to delete`,
	}
}
</script>

<style>
body {
	margin: 0;
}
</style>
