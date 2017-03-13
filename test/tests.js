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
	hier.add('/node', '#qunit-fixture', function() {});
	assert.equal(hier.show(), '(root (node))');
});

QUnit.test('add nested nodes', function(assert) {
	hier.add('/node', '#qunit-fixture', function(elem) {
		elem.innerHTML = '<div id="nested"></div><div id="another"></div>';
	});
	hier.add('/node/nested', '#nested', function() {});
	hier.add('/node/another', '#another', function() {});
	assert.equal(hier.show(), '(root (node (nested) (another)))');
});

QUnit.test('add an added node does nothing', function(assert) {
	hier.add('/node', '#qunit-fixture', function() {});
	hier.add('/node', '#qunit-fixture', function() {});
	assert.equal(hier.show(), '(root (node))');
});

QUnit.test('add invokes the update func', function(assert) {
	hier.add('/node', '#qunit-fixture', function(elem) {
		assert.equal(elem, document.querySelector('#qunit-fixture'));
	});
});

QUnit.test('add invokes the update func with params', function(assert) {
	hier.add('/node', '#qunit-fixture', function(elem, param) {
		assert.equal(elem, document.querySelector('#qunit-fixture'));
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
	hier.add('/node', '#qunit-fixture', function() {});
	hier.remove('/node');
	assert.equal(hier.show(), '(root)');
});

QUnit.test('remove a nested node', function(assert) {
	hier.add('/node', '#qunit-fixture', function(elem) {
		elem.innerHTML = '<div id="nested"></div>';
	});
	hier.add('/node/nested', '#nested', function() {});
	hier.remove('/node/nested');
	assert.equal(hier.show(), '(root (node))');
});

QUnit.test('remove a parent node', function(assert) {
	hier.add('/node', '#qunit-fixture', function(elem) {
		elem.innerHTML = '<div id="nested"></div>';
	});
	hier.add('/node/nested', '#nested', function() {});
	hier.remove('/node');
	assert.equal(hier.show(), '(root)');
});

// update
QUnit.test('update invokes the update func', function(assert) {
	assert.expect(2);
	
	var update = function(elem) {
		assert.equal(elem, document.querySelector('#qunit-fixture'));
	};
	
	hier.add('/node', '#qunit-fixture', update);
	hier.update('/node');
});

QUnit.test('update invokes the update func with params', function(assert) {
	assert.expect(4);
	
	var update = function(elem, param) {
		assert.equal(elem, document.querySelector('#qunit-fixture'));
		assert.equal(param, 'param');
	};
	
	hier.add('/node', '#qunit-fixture', update, 'param');
	hier.update('/node', 'param');
});

QUnit.test('update error at non-existing node', function(assert) {
	hier.add('/node', '#qunit-fixture', function() {});
	assert.raises(function() {
		hier.update('/another');
	}, /could not find path/i);
});

QUnit.test('update removes the children nodes', function(assert) {
	hier.add('/node', '#qunit-fixture', function(elem) {
		elem.innerHTML = '<div id="nested"></div>';
	});
	hier.add('/node/nested', '#nested', function() {});
	
	hier.update('/node');
	
	assert.equal(hier.show(), '(root (node))');
	assert.equal(hier.has('/node/nested'), false);
});

// has
QUnit.test('has checks correctly', function(assert) {
	assert.equal(hier.has('/node'), false);
	hier.add('/node', '#qunit-fixture', function() {});
	assert.equal(hier.has('/node'), true);
	hier.remove('/node');
	assert.equal(hier.has('/node'), false);
});

QUnit.test('has is not confused by reg', function(assert) {
	hier.reg('/node', '#qunit-fixture', function() {});
	assert.equal(hier.has('/node'), false);
	hier.add('/node');
	assert.equal(hier.has('/node'), true);
	hier.remove('/node');
	assert.equal(hier.has('/node'), false);
});

// reg
QUnit.test('reg a node and add', function(assert) {
	hier.reg('/node', '#qunit-fixture', function() {});
	assert.equal(hier.show(), '(root)');
	
	hier.add('/node');
	assert.equal(hier.show(), '(root (node))');
});

QUnit.test('reg a nested node and add', function(assert) {
	hier.reg('/node/nested', '#nested', function() {});
	assert.equal(hier.show(), '(root)');
	
	hier.add('/node', '#qunit-fixture', function(elem) {
		elem.innerHTML = '<div id="nested"></div>';
	});
	assert.equal(hier.show(), '(root (node))');
	
	hier.add('/node/nested');
	assert.equal(hier.show(), '(root (node (nested)))');
});

QUnit.test('reg a node and add with params', function(assert) {
	hier.reg('/node', '#qunit-fixture', function(elem, param) {
		assert.equal(elem, document.querySelector('#qunit-fixture'));
		assert.equal(param, 'param');
	});
	hier.add('/node', 'param');
});

// on
QUnit.test('hook error at empty string', function(assert) {
	assert.raises(function() {
		hier.on('', function() {});
	}, /could not identify hook/i);
});

QUnit.test('hook error at non-existent hook', function(assert) {
	assert.raises(function() {
		hier.on('hook', function() {});
	}, /could not identify hook/i);
	
	assert.raises(function() {
		hier.on(undefined, function() {});
	}, /could not identify hook/i);
	
	assert.raises(function() {
		hier.on(null, function() {});
	}, /could not identify hook/i);
});

QUnit.test('pre-init works with one node', function(assert) {
	assert.expect(2);
	
	hier.on('pre-init', function(path, param) {
		assert.equal(path, '/node');
		assert.equal(param, 42);
	});
	
	hier.add('/node', '#qunit-fixture', function() {}, 42);
	
	hier.off('pre-init');
	hier.add('/node', '#qunit-fixture', function() {}, 42);
});

QUnit.test('post-init works with one node', function(assert) {
	assert.expect(2);
	
	hier.on('post-init', function(path, view) {
		assert.equal(path, '/node');
		assert.equal(view, 42);
	});
	
	hier.add('/node', '#qunit-fixture', function() { return 42; });
	
	hier.off('post-init');
	hier.add('/node', '#qunit-fixture', function() { return 42; });
});

QUnit.test('pre-remove works with one node', function(assert) {
	assert.expect(2);
	
	hier.add('/node', '#qunit-fixture', function() { return 42; });
	hier.on('pre-remove', function(path, view) {
		assert.equal(path, '/node');
		assert.equal(view, 42);
	});
	hier.remove('/node');
	
	hier.add('/node', '#qunit-fixture', function() { return 42; });
	hier.off('pre-remove');
	hier.remove('/node');
});

QUnit.test('pre-remove hooks in before children are removed', function(assert) {
	assert.expect(4);
	
	hier.add('/node', '#qunit-fixture', function(elem) {
		elem.innerHTML = '<div id="nested"></div>';
	});
	hier.add('/node/nested', '#nested', function() {});
	
	hier.on('pre-remove', function(path, view) {
		assert.equal(hier.has('/node'), true);
		assert.equal(hier.has('/node/nested'), true);
	});
	hier.remove('/node');
});

QUnit.test('post-remove works with one node', function(assert) {
	assert.expect(1);
	
	hier.add('/node', '#qunit-fixture', function() {});
	hier.on('post-remove', function(path) {
		assert.equal(path, '/node');
	});
	hier.remove('/node');
	
	hier.off('post-remove');
	hier.add('/node', '#qunit-fixture', function() {});
	hier.remove('/node');
});

// show
QUnit.test('show root on its own', function(assert) {
	assert.equal(hier.show(), '(root)');
});
