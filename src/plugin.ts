import { AbstractPlugin, ClickData, Viewer } from '@photo-sphere-viewer/core'
import { Marker, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'

export interface Config {
	disable: boolean
}

type Position = { yaw: number; pitch: number }

const bluePointImage = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-blue.png'
const redPointImage = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-red.png'

export class FastGetPolyline extends AbstractPlugin {
	static id = 'fast-get-polyline'
	/** 绘制marker的id前缀 */
	static readonly prefix = 'fast-get-polyline'

	markersPlugin: MarkersPlugin | undefined
	/** 配置项 */
	config: Config | null
	/** 当前绘制点的路径 */
	paths: string[] = []

	private handleSelectMaker: Function | undefined
	private handleClickViewer: Function | undefined

	constructor(viewer: Viewer, config: any) {
		super(viewer)
		this.config = config
	}

	init(): void {
		this.markersPlugin = this.viewer.getPlugin(MarkersPlugin) as MarkersPlugin

		if (this.markersPlugin && this.config?.disable !== true) {
			this.initMakerSelect()
			this.initViewerClick()
		}
	}

	destroy() {
		this.clearPaths()
		this.handleSelectMaker && this.markersPlugin?.removeEventListener('select-marker', this.handleSelectMaker as any)
		this.handleClickViewer && this.viewer.removeEventListener('click', this.handleClickViewer as any)
	}

	/** 清除绘制的点 */
	clearPaths() {
		this.paths.forEach((id) => this.markersPlugin?.removeMarker(id))
		this.paths = []
	}

	/** 是否为当前类绘制的点 */
	static isPointMarker(marker: Marker) {
		return marker.id.startsWith(FastGetPolyline.prefix + '-point')
	}
	/** 是否为当前类绘制的多边形 */
	static isPolylineMarker(marker: Marker) {
		return marker.id.startsWith(FastGetPolyline.prefix + '-polyline')
	}

	private static getPointMaker(data?: ClickData, index?: number) {
		return {
			id: FastGetPolyline.prefix + '-point-' + Math.random(),
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
	private getPolylineMaker() {
		return {
			id: `${FastGetPolyline.prefix}-polyline-${Math.random()}`,
			polyline: this.paths.concat(this.paths[0]).map((id) => {
				const position = this.markersPlugin!.getMarker(id).config.position as Position
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

	/** 初始化maker select事件 */
	private initMakerSelect() {
		this.handleSelectMaker = (data: { marker: Marker; doubleClick: boolean; rightClick: boolean }) => {
			const { marker, doubleClick, rightClick } = data
			const clipboard = navigator.clipboard

			doSomeOne([
				[
					/** 双击删除 */
					doubleClick,
					() => {
						if (FastGetPolyline.isPointMarker(marker)) {
							this.clearPaths()
						} else if (FastGetPolyline.isPolylineMarker(marker)) {
							this.markersPlugin!.removeMarker(marker.id)
						}
					},
				],
				[
					/** 右击点删除单个点 */
					rightClick && FastGetPolyline.isPointMarker(marker) && this.paths[0] !== marker.id,
					() => {
						this.markersPlugin?.removeMarker(marker.id)
						this.paths = this.paths.filter((id) => id !== marker.id)
					},
				],
				[
					/** 左单击polyline复制 */
					FastGetPolyline.isPolylineMarker(marker) && !rightClick,
					() => {
						clipboard.writeText(JSON.stringify(marker.config.polyline))
					},
				],
				[
					/** 点击起始点画polyline */
					FastGetPolyline.isPointMarker(marker) && this.paths.length >= 3 && marker.id === this.paths[0] && !rightClick,
					() => {
						this.markersPlugin!.addMarker(this.getPolylineMaker())
						this.clearPaths()
					},
				],
			])
		}
		this.markersPlugin!.addEventListener('select-marker', this.handleSelectMaker as any)
	}
	/** 初始化viewer click事件 */
	private initViewerClick() {
		this.handleClickViewer = ({ data }: { data: ClickData }) => {
			if (!data.rightclick) {
				const pointMaker = FastGetPolyline.getPointMaker(data, this.paths.length)
				this.markersPlugin!.addMarker(pointMaker)

				const maker = this.markersPlugin!.getMarker(pointMaker.id)
				this.paths.push(maker.id)
			}
		}

		this.viewer.addEventListener('click', this.handleClickViewer as any)
	}
}

function doSomeOne(strategy: [condition: boolean, exec: () => void][]) {
	strategy.some(([condition, exec]) => {
		condition && exec()
		return condition
	})
}
