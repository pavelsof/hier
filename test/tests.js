QUnit.module('hier');

QUnit.test('adding paths', function(assert) {
	var doneWithOuter = assert.async();
	var doneWithLogin = assert.async();
	
	assert.expect(4);
	
	hier.add('/outer', 1, function(elem, params) {
		assert.equal(elem, 1);
		assert.equal(hier.show(), '(root (outer))');
		doneWithOuter();
	});
	
	hier.add('/outer/login', 2, function(elem, params) {
		assert.equal(elem, 2);
		assert.equal(hier.show(), '(root (outer (login)))');
		doneWithLogin();
	});
});
