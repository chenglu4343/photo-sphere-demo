export function doSomeOne(strategy: [condition: boolean, exec: () => void][]) {
	strategy.some(([condition, exec]) => {
		condition && exec()
		return condition
	})
}
