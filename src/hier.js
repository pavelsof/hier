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
	
	
	// constructor for a node object
	// 
	// each node object represents a component of the webapp employing hier
	// such a component is defined by its root DOM element and an update
	// function that will be invoked when the component is activated
	// 
	// expects the new node's name, its dom element, and its update function
	var createNode = function(name, elem, func) {
		var node = {};
		var children = {};
		
		// returns the node's name
		node.getName = function() {
			return name;
		};
		
		// returns the node's dom element
		node.getElem = function() {
			return elem;
		};
		
		// invokes the node's update function and returns its output
		// it is invoked with elem as first arg and with params as second
		node.update = function(params) {
			return func(elem, params);
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
		node.addChild = function(chName, chElemQ, chFunc) {
			var chElem, i;
			
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
			
			children[chName] = createNode(chName, chElem, chFunc);
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
		// unsets the node's properties
		node.die = function() {
			var childName;
			
			for(childName in children) {
				if(children.hasOwnProperty(childName)) {
					children[childName].die();
				}
			}
			
			children = null;
			func = null;
			elem = null;
		};
		
		// returns string of the form (name child child ...)
		// useful for unit testing and debugging
		node.toString = function() {
			var childName, li;
			
			li = [name];
			
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
	// this constructor be replaced by new Map() in the far future
	var createMap = function() {
		var map = {};
		
		map.set = function(key, value) {
			map[key.toString()] = value;
			return map;
		};
		
		map.get = function(key) {
			if(map.hasOwnProperty(key.toString())) {
				return map[key.toString()];
			}
		};
		
		map.delete = function(key) {
			if(map.hasOwnProperty(key.toString())) {
				delete map[key.toString()];
				return true;
			}
			return false;
		};
		
		map.clear = function() {
			var key;
			for(key in map) {
				if(map.hasOwnProperty(key)) {
					delete map[key];
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
	
	// inits the module's blank state
	// first invoked right before the module's return
	var init = function() {
		root = createNode('root', document.querySelector('body'));
		registry = createMap();
	};
	
	
	// 
	// the hier api
	// 
	
	// the api object contains the module export functions
	// nothing more than a container indeed
	var api = {};
	
	// creates a new node and adds it to the hier tree
	// if the node is already there, does nothing
	// if there is a sibling with the same elem, replaces it
	api.add = function(path, elem, func, params) {
		var parentNode, regValue;
		
		path = createPath(path);
		
		// do nothing if the node is already there
		if(root.find(path.toArray())) {
			return;
		}
		
		// find the parent node
		parentNode = root.find(path.getUpToLast());
		if(parentNode == null) {
			throw new Error('Could not find path: '+path.toString());
		}
		
		// find elem and func in the registry if not provided
		if(!(elem && func)) {
			regValue = registry.get(path);
			if(!regValue) {
				throw new Error('Could not find in registry: '+path.toString());
			}
			elem = regValue.elem;
			func = regValue.func;
		}
		
		// add and update
		parentNode.addChild(path.getLast(), elem, func);
		parentNode.find([path.getLast()]).update(params);
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
	
	// invokes the update function of the node at the given path
	api.update = function(path, params) {
		var node;
		
		path = createPath(path);
		
		node = root.find(path.toArray());
		if(node == null) {
			throw new Error('Could not find path: '+path.toString());
		}
		
		node.update(params);
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
	
	// returns the string representation of the root node
	api.show = function() {
		return root.toString();
	};
	
	// clears the current tree and registry
	// useful for unit testing
	api.clear = function() {
		root.die();
		registry.clear();
		
		init();
	};
	
	
	// ready to go
	init();
	return api;
	
}());
