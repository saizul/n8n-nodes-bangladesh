const path = require('node:path');
const { src, dest } = require('gulp');

/** Copy node icons and codex metadata next to the compiled JavaScript. */
function buildIcons() {
	return src(path.resolve('nodes', '**', '*.{png,svg,json}')).pipe(
		dest(path.resolve('dist', 'nodes')),
	);
}

exports['build:icons'] = buildIcons;
