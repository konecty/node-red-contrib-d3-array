const d3 = require('d3-array');

const mapToObject = map =>
	Array.from(map).reduce(
		(obj, [key, value]) => Object.assign(obj, { [key]: value instanceof Map ? mapToObject(value) : value }),
		{}
	);
module.exports = function(RED) {
	function D3ArrayNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;

		this.on('input', function(msg, send, done) {
			const nodeSend =
				send ||
				function() {
					node.send.apply(node, arguments);
				};
			const nodeDone = () => {
				if (done) {
					done();
				}
			};
			const data = RED.util.evaluateNodeProperty(n.property, n.propertyType, this, msg);
			const accessors = JSON.parse(n.accessors);
			const accessorsFunctions = accessors.map(body => args => {
				var expr = RED.util.prepareJSONataExpression(body.fn, node);
				result = RED.util.evaluateJSONataExpression(expr, args);
				return result;
			});
			switch (n.function) {
				case 'group':
					if (data) {
						const payload = mapToObject(d3.group.apply(null, [data, ...accessorsFunctions]));
						nodeSend({
							...msg,
							payload
						});
					} else {
						nodeSend({
							...msg,
							payload: {}
						});
					}
					nodeDone();
					break;

				default:
					node.error('Not implemented');
					nodeDone();
					break;
			}
		});
	}

	RED.nodes.registerType('d3-array', D3ArrayNode);
};
