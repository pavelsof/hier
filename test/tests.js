QUnit.config.noglobals = true;

QUnit.module('hier', {
	afterEach: function() {
		hier.clear();
	}
});

// path errors
QUnit.test('path error if it does not start with slash', function(assert) {
	assert.raises(function() {
		hier.add('node', 'elem', function() {});
	}, /start with a slash/);
});

QUnit.test('path error at empty string nodes', function(assert) {
	assert.raises(function() {
		hier.add('//', 'elem', function() {});
	}, /well-formed path/);
});

QUnit.test('path error at empty string', function(assert) {
	assert.raises(function() {
		hier.add('', 'elem', function() {});
	}, /empty path/);
});

// add
QUnit.test('add a node', function(assert) {
	hier.add('/node', 'elem', function() {});
	assert.equal(hier.show(), '(root (node))');
});

QUnit.test('add nested nodes', function(assert) {
	hier.add('/node', 'elem', function() {});
	hier.add('/node/nested', 'elem', function() {});
	hier.add('/node/another', 'elem', function() {});
	assert.equal(hier.show(), '(root (node (nested) (another)))');
});

QUnit.test('add an added node does nothing', function(assert) {
	hier.add('/node', 'elem', function() {});
	hier.add('/node', 'elem', function() {});
	assert.equal(hier.show(), '(root (node))');
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

QUnit.test('add error at short add without reg', function(assert) {
	assert.raises(function() {
		hier.add('/node');
	}, /find in registry/);
});

// remove
QUnit.test('remove a node', function(assert) {
	hier.add('/node', 'elem', function() {});
	hier.remove('/node');
	assert.equal(hier.show(), '(root)');
});

QUnit.test('remove a nested node', function(assert) {
	hier.add('/node', 'elem', function() {});
	hier.add('/node/nested', 'elem', function() {});
	hier.remove('/node/nested');
	assert.equal(hier.show(), '(root (node))');
});

QUnit.test('remove a parent node', function(assert) {
	hier.add('/node', 'elem', function() {});
	hier.add('/node/nested', 'elem', function() {});
	hier.remove('/node');
	assert.equal(hier.show(), '(root)');
});

// update
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

QUnit.test('update error at non-existing node', function(assert) {
	hier.add('/node', 'elem', function() {});
	assert.raises(function() {
		hier.update('/another');
	}, /could not find path/i);
});

// reg
QUnit.test('reg a node and add', function(assert) {
	hier.reg('/node', 'elem', function() {});
	assert.equal(hier.show(), '(root)');
	
	hier.add('/node');
	assert.equal(hier.show(), '(root (node))');
});

QUnit.test('reg a nested node and add', function(assert) {
	hier.reg('/node/nested', 'elem', function() {});
	assert.equal(hier.show(), '(root)');
	
	hier.add('/node', 'elem', function() {});
	assert.equal(hier.show(), '(root (node))');
	
	hier.add('/node/nested');
	assert.equal(hier.show(), '(root (node (nested)))');
});

// replace
QUnit.test('replace one node with another', function(assert) {
	hier.add('/one', 'elem', function() {});
	assert.equal(hier.show(), '(root (one))');
	
	hier.reg('/another', 'elem', function() {});
	assert.equal(hier.show(), '(root (one))');
	
	hier.replace('/one', '/another');
	assert.equal(hier.show(), '(root (another))');
});

// show
QUnit.test('show root on its own', function(assert) {
	assert.equal(hier.show(), '(root)');
});
