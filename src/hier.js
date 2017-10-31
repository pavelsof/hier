var hier = (function() {

	"use strict";


	// 
	// constructors
	// 

	// constructor for a path object
	var createPath = function(string) {
		var path;
		var array, i;

		// check that the string is well-formatted
		if(string.length < 2) {
			throw new Error('You must specify a non-empty path');
		}
		if(string[0] !== '/') {
			throw new Error('Paths must start with a slash');
		}

		// make the array and check there are no empty items
		array = string.slice(1).split('/');

		for(i = 0; i < array.length; i++) {
			if(array[i].length == 0) {
				throw new Error('You must specify a well-formed path');
			}
		}

		// the path object
		path = {};

		// returns a copy of the array representation
		path.toArray = function() {
			return array.slice();
		};

		// returns the string representation
		path.toString = function() {
			return string;
		};

		// returns the last item of the path
		path.getLast = function() {
			return array[array.length-1];
		};

		// returns the path array up to the last item
		path.getUpToLast = function() {
			return array.slice(0, array.length-1);
		};

		return path;
	};


	// constructor for the root path object
	// the alternative would be to have a createRootNode
	var createRootPath = function() {
		return {
			toString: function() { return '/'; },
			getLast: function() { return 'root'; }
		};
	};


	// constructor for a node object
	// 
	// each node object represents a component of the webapp employing hier
	// such a component is defined by its root DOM element and an update
	// function that will be invoked when the component is activated
	// 
	// expects the new node's name, its dom element, and its update function
	var createNode = function(path, elem, func) {
		var node = {};
		var children = {};

		var view;
		var lastParamType, lastParamString;

		// returns the node's name
		node.getName = function() {
			return path.getLast();
		};

		// returns the node's dom element
		node.getElem = function() {
			return elem;
		};

		// return the return value of the last update call
		node.getView = function() {
			return view;
		};

		// invokes the node's update function and returns its output
		// it is invoked with elem as first arg and with params as second
		// 
		// the return value of the function is stored in the view var
		// 
		// calls the pre-init and post-init hook callbacks, if such
		node.update = function(params) {
			if(hooks.has('pre-init')) {
				hooks.get('pre-init')(path.toString(), elem, params);
			}

			view = func(elem, params);

			if(hooks.has('post-init')) {
				hooks.get('post-init')(path.toString(), elem, view);
			}

			lastParamType = typeof params;
			if(['boolean', 'number', 'string'].indexOf(lastParamType) > -1) {
				lastParamString = params.toString();
			}

			return view;
		};

		// returns false if the given arg is the same as the one used for the
		// last update func invoking and true otherwise
		//
		// this only works if both args are of the same type and that is one
		// of: undefined, boolean, number, string
		node.needsUpdate = function(params) {
			if(typeof params != lastParamType) {
				return true;
			}

			if(lastParamType == 'undefined') {
				return false;
			}

			if(['boolean', 'number', 'string'].indexOf(lastParamType) > -1) {
				return params.toString() != lastParamString;
			}

			return true;
		};

		// recursively finds the node corresponding to the given path array
		// returns null if there is no such node
		node.find = function(pathArray) {
			var childName, first;

			if(pathArray.length == 0) {
				return node;
			}

			first = pathArray.shift();

			for(childName in children) {
				if(children.hasOwnProperty(childName) && childName == first) {
					return children[childName].find(pathArray);
				}
			}

			return null;
		};

		// adds a child node
		// expects the name of the new node, a string which will be fed into
		// the querySelector method of the parent elem to provide the node's
		// elem, and its update function
		node.addChild = function(chPath, chElemQ, chFunc) {
			var i, chElem, chName = chPath.getLast();

			// raise an error if there is a node with the same name
			if(children.hasOwnProperty(chName)) {
				throw new Error('There already is a child named '+chName);
			}

			// raise an error if the dom element does not exist
			chElem = elem.querySelector(chElemQ);
			if(chElem == null) {
				throw new Error('Could not find element: '+chElemQ);
			}

			// if there is a child occupying the same elem, remove it
			for(i in children) {
				if(children.hasOwnProperty(i)) {
					if(children[i].getElem() == chElem) {
						node.removeChild(i);
					}
				}
			}

			children[chName] = createNode(chPath, chElem, chFunc);
		};

		// removes the child with the specified name
		// raises an error if there is no such child
		node.removeChild = function(childName) {
			if(!children.hasOwnProperty(childName)) {
				throw new Error('There is no child named '+childName);
			}

			children[childName].die();
			delete children[childName];
		};

		// recursively removes all children
		// leaves children an empty {}
		node.removeChildren = function() {
			var childName;

			for(childName in children) {
				if(children.hasOwnProperty(childName)) {
					children[childName].die();
				}
			}

			children = {};
		};

		// recursively removes all children
		// unsets the node's properties
		// 
		// calls the pre-empty, pre-remove and post-remove callbacks, if such
		node.die = function() {
			if(hooks.has('pre-empty')) {
				hooks.get('pre-empty')(path.toString(), elem, view);
			}

			node.removeChildren();

			if(hooks.has('pre-remove')) {
				hooks.get('pre-remove')(path.toString(), elem, view);
			}

			elem = null;
			func = null;
			view = null;

			if(hooks.has('post-remove')) {
				hooks.get('post-remove')(path.toString());
			}

			path = null;
		};

		// returns string of the form (name child child ...)
		// useful for unit testing and debugging
		node.toString = function() {
			var childName, li;

			li = [path.getLast()];

			for(childName in children) {
				if(children.hasOwnProperty(childName)) {
					li.push(children[childName].toString());
				}
			}

			return '('+ li.join(' ') +')';
		};

		return node;
	};


	// constructor for a simple map object
	// to be replaced by new Map() in the far future
	var createMap = function() {
		var data = {};
		var map = {};

		map.set = function(key, value) {
			data[key.toString()] = value;
		};

		map.get = function(key) {
			if(data.hasOwnProperty(key.toString())) {
				return data[key.toString()];
			}
		};

		map.has = function(key) {
			return data.hasOwnProperty(key.toString());
		};

		map.delete = function(key) {
			if(data.hasOwnProperty(key.toString())) {
				delete data[key.toString()];
				return true;
			}
			return false;
		};

		map.clear = function() {
			var key;
			for(key in data) {
				if(data.hasOwnProperty(key)) {
					delete data[key];
				}
			}
		};

		return map;
	};


	// 
	// the state
	// 

	// the root node of the hier tree
	var root;

	// map of the registered paths
	var registry;

	// map of the hook callbacks
	// the values must always be function
	var hooks;

	// inits the module's blank state
	// first invoked right before the module's return
	var init = function() {
		registry = createMap();
		hooks = createMap();

		root = createNode(createRootPath(), document.querySelector('body'));
	};


	// 
	// the hier api
	// 

	// the api object contains the module export functions
	// nothing more than a container indeed
	var api = {};

	// creates a new node and adds it to the hier tree
	// if the node is already there and it has been updated with the same
	// params last time, does nothing
	// if the node is already there but has been updated with different params
	// last time, it is removed and added again
	// if there is a sibling with the same elem, replaces it
	api.add = function(path, elem, func, params) {
		var node, parentNode, regValue;

		path = createPath(path);

		// find elem and func in the registry if not provided
		if(!(elem && func)) {
			regValue = registry.get(path);
			if(!regValue) {
				throw new Error('Could not find in registry: '+path.toString());
			}
			params = elem;  // the second arg will be the params then
			elem = regValue.elem;
			func = regValue.func;
		}

		// find the parent node
		parentNode = root.find(path.getUpToLast());
		if(parentNode == null) {
			throw new Error('Could not find path: '+path.toString());
		}

		// if the node is there, update it if needed and return
		node = root.find(path.toArray());
		if(node) {
			if(node.needsUpdate(params)) {
				parentNode.removeChild(path.getLast());
			} else {
				return node.getView();
			}
		}

		// add and update
		parentNode.addChild(path, elem, func);
		return parentNode.find([path.getLast()]).update(params);
	};

	// removes the node at the given path
	api.remove = function(path) {
		var parentNode;

		path = createPath(path);

		parentNode = root.find(path.getUpToLast());
		if(parentNode == null) {
			throw new Error('Could not find path: '+path.toString());
		}

		parentNode.removeChild(path.getLast());
	};

	// removes a node and adds it back again
	// if the node is already there, elem and func are copied over
	// otherwise the node is expected to be registered
	api.update = function(path, params) {
		var node;

		path = createPath(path);

		node = root.find(path.toArray());
		if(node == null) {
			throw new Error('Could not find path: '+path.toString());
		}

		node.removeChildren();

		return node.update(params);
	};

	// checks whether there is a node at the given path
	// returns a boolean or throws an error if the path is malformed
	api.has = function(path) {
		path = createPath(path);
		return !(root.find(path.toArray()) == null);
	};

	// adds a path to the pot
	api.reg = function(path, elem, func) {
		path = createPath(path);
		registry.set(path, {'elem': elem, 'func': func});
	};

	// removes a path from the pot
	api.unreg = function(path) {
		path = createPath(path);
		registry.delete(path);
	};

	// adds a func to be executed at certain stage of the views' lifecycles
	// the stages are called hooks for it is short and clear
	// 
	// there can be only one callback per hook at a time
	api.on = function(hook, func) {
		var i, possHooks = [
			'pre-init', 'post-init',
			'pre-empty', 'pre-remove', 'post-remove'
		];

		for(i = 0; i < possHooks.length; i++) {
			if(hook == possHooks[i]) {
				hooks.set(hook, func);
				return;
			}
		}

		throw new Error('Could not identify hook: '+hook);
	};

	// removes the callback that have been attached to the given hook
	api.off = function(hook) {
		return hooks.delete(hook);
	};

	// returns the string representation of the root node
	api.show = function() {
		return root.toString();
	};

	// clears the current tree and registry
	// useful for unit testing
	api.clear = function() {
		registry.clear();
		hooks.clear();

		root.die();

		init();
	};


	// ready to go
	init();
	return api;

}());
