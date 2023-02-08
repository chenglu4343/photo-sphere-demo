import { ClickData, Viewer } from '@photo-sphere-viewer/core'
import { Marker, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { doSomeOne } from '../utils'

/** 绘制marker的id前缀 */
const prefix = 'fast-get-polyline'
const bluePointImage = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-blue.png'
const redPointImage = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-red.png'

type Position = { yaw: number; pitch: number }

export function useFastPolyline(viewer: Viewer) {
	const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin

	if (!markersPlugin) {
		return null
	}

	let paths: string[] = []
	let viewerClick: null | Function = null
	let markerSelect: null | Function = null

	/** 清除绘制的点 */
	const clearPaths = () => {
		paths.forEach((id) => markersPlugin.removeMarker(id))
		paths = []
	}

	const start = () => {
		if (viewerClick && markerSelect) return
		// 1. viewer click事件
		viewerClick = ({ data }: { data: ClickData }) => {
			if (!data.rightclick) {
				const pointMaker = getPointMaker(data, paths.length)
				markersPlugin!.addMarker(pointMaker)
				paths.push(pointMaker.id)
			}
		}
		viewer.addEventListener('click', viewerClick as any)

		// 2. marker select 事件
		markerSelect = (data: { marker: Marker; doubleClick: boolean; rightClick: boolean }) => {
			const { marker, doubleClick, rightClick } = data
			const clipboard = navigator.clipboard

			doSomeOne([
				[
					/** 双击删除 */
					doubleClick,
					() => {
						if (isPointMarker(marker)) {
							clearPaths()
						} else if (isPolylineMarker(marker)) {
							markersPlugin!.removeMarker(marker.id)
						}
					},
				],
				[
					/** 右击点删除单个点 */
					rightClick && isPointMarker(marker) && paths[0] !== marker.id,
					() => {
						markersPlugin.removeMarker(marker.id)
						paths = paths.filter((id) => id !== marker.id)
					},
				],
				[
					/** 左单击polyline复制 */
					isPolylineMarker(marker) && !rightClick,
					() => {
						clipboard.writeText(JSON.stringify(marker.config.polyline))
					},
				],
				[
					/** 点击起始点画polyline */
					isPointMarker(marker) && paths.length >= 3 && marker.id === paths[0] && !rightClick,
					() => {
						markersPlugin!.addMarker(getPolylineMaker(paths, markersPlugin))
						clearPaths()
					},
				],
			])
		}
		markersPlugin.addEventListener('select-marker', markerSelect as any)
	}

	const stop = () => {
		if (viewerClick) {
			viewer.removeEventListener('click', viewerClick as any)
			viewerClick = null
		}

		if (markerSelect) {
			markersPlugin.removeEventListener('select-marker', markerSelect as any)
		}
	}

	start()

	return {
		start,
		stop,
	}
}

/** 获取一个point的maker */
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
		tooltip:
			index === 0
				? 'start point<br>dbClick to delete'
				: `point ${index}<br>rightClick to delete one<br>dbClick to delete all`,
	}
}

/** 获取一个polyline */
function getPolylineMaker(paths: string[], markersPlugin: MarkersPlugin) {
	return {
		id: `${prefix}-polyline-${Math.random()}`,
		polyline: paths.concat(paths[0]).map((id) => {
			const position = markersPlugin!.getMarker(id).config.position as Position
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
	}
}

/** 是否是绘制的point */
function isPointMarker(marker: Marker) {
	return marker.id.startsWith(prefix + '-point')
}

/** 是否是绘制的polyline */
function isPolylineMarker(marker: Marker) {
	return marker.id.startsWith(prefix + '-polyline')
}
