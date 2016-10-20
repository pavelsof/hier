QUnit.config.noglobals = true;

QUnit.module('hier', {
	afterEach: function() {
		hier.clear();
	}
});

QUnit.test('add a node', function(assert) {
	hier.add('/node', null, function() {});
	assert.equal(hier.show(), '(root (node))');
});

QUnit.test('add nested nodes', function(assert) {
	hier.add('/node', null, function() {});
	hier.add('/node/nested', null, function() {});
	hier.add('/node/another', null, function() {});
	assert.equal(hier.show(), '(root (node (nested) (another)))');
});

QUnit.test('add invokes the update func', function(assert) {
	hier.add('/node', 'elem', function(elem) {
		assert.equal(elem, 'elem');
	});
});

QUnit.test('add invokes the update func with params', function(assert) {
	hier.add('/node', 'elem', function(elem, param) {
		assert.equal(elem, 'elem');
		assert.equal(param, 'param');
	}, 'param');
});

QUnit.test('remove a node', function(assert) {
	hier.add('/node', null, function() {});
	hier.remove('/node');
	assert.equal(hier.show(), '(root)');
});

QUnit.test('remove a nested node', function(assert) {
	hier.add('/node', null, function() {});
	hier.add('/node/nested', null, function() {});
	hier.remove('/node/nested');
	assert.equal(hier.show(), '(root (node))');
});

QUnit.test('remove a parent node', function(assert) {
	hier.add('/node', null, function() {});
	hier.add('/node/nested', null, function() {});
	hier.remove('/node');
	assert.equal(hier.show(), '(root)');
});

QUnit.test('update invokes the update func', function(assert) {
	assert.expect(2);
	
	var update = function(elem) {
		assert.equal(elem, 'elem');
	};
	
	hier.add('/node', 'elem', update);
	hier.update('/node');
});

QUnit.test('update invokes the update func with params', function(assert) {
	assert.expect(4);
	
	var update = function(elem, param) {
		assert.equal(elem, 'elem');
		assert.equal(param, 'param');
	};
	
	hier.add('/node', 'elem', update, 'param');
	hier.update('/node', 'param');
});

QUnit.test('show root on its own', function(assert) {
	assert.equal(hier.show(), '(root)');
});
