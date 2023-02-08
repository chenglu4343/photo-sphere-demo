import { AbstractPlugin, Viewer } from '@photo-sphere-viewer/core'
import { useFastPolyline } from './hooks/useFastPolyline'

export class FastGetPolyline extends AbstractPlugin {
	static id = 'fast-get-polyline'

	start = () => {}
	stop = () => {}

	constructor(viewer: Viewer) {
		super(viewer)
	}

	init() {
		const { start, stop } = useFastPolyline(this.viewer)!
		this.start = start
		this.stop = stop
	}

	destroy() {
		this.stop()
	}
}
