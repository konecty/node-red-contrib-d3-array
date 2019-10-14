const d3 = require('d3-array');

const mapToObject = map =>
	Array.from(map).reduce(
		(obj, [key, value]) => Object.assign(obj, { [key]: value instanceof Map || value instanceof Set ? mapToObject(value) : value }),
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
			const parameters = accessors.map(({ t : type, fn: value }) => {
				if(type == null || type === 'jsonata') {
					return (...args) => {
						var expr = RED.util.prepareJSONataExpression(value, node);
						result = RED.util.evaluateJSONataExpression(expr, { args });
						return result;
					}
				}
				return RED.util.evaluateNodeProperty(value, type, node, msg);
			});

			if (d3[n.function] == null) {
				node.error(`Function [${n.function}] does not exists.`);
				nodeSend(msg);
				nodeDone();
				return;
			}

			const payload = d3[n.function].apply(null, [data, ...parameters]);
			nodeSend({
				...msg,
				payload: payload instanceof Map || payload instanceof Set ? mapToObject(payload) : payload
			})
			nodeDone();
		});
	}

	RED.nodes.registerType('d3-array', D3ArrayNode);
};
