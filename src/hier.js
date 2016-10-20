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
		
		// returns the array representation
		path.toArray = function() {
			return array;
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
	// each node object represents a component of the webapp employing hier
	// such a component is defined by its root DOM element and an update
	// function that will be invoked when the component is activated
	var createNode = function(name, elem, func) {
		var node = {};
		var children = {};
		
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
		
		// adds another node object as a child
		// raises an error if there already is a child with the same name
		node.addChild = function(child) {
			if(children.hasOwnProperty(child.getName())) {
				throw new Error('There already is a child named '+child.getName());
			}
			
			children[child.getName()] = child;
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
		
		// invokes the node's update function and returns its output
		// it is invoked with elem as first arg and with params as second
		node.update = function(params) {
			return func(elem, params);
		};
		
		// returns the node's name
		node.getName = function() {
			return name;
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
		
		return node;
	};
	
	
	// 
	// variables
	// 
	
	// the root node object
	var root = createNode('root');
	
	// the pot obejct contains the registered paths
	var pot = {};
	
	
	// 
	// the hier api
	// 
	
	// the api object contains the module export functions
	// nothing more than a container indeed
	var api = {};
	
	// creates a new node and adds it to the hier tree
	api.add = function(path, elem, func, params) {
		var newNode, parentNode;
		
		path = createPath(path);
		
		parentNode = root.find(path.getUpToLast());
		if(parentNode == null) {
			throw new Error('Could not find path: '+path.toString());
		}
		
		newNode = createNode(path.getLast(), elem, func);
		parentNode.addChild(newNode);
		
		newNode.update(params);
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
		pot[path] = {elem: elem, func: func};
	};
	
	// removes a path from the pot
	api.unreg = function(path) {
		delete pot[path];
	};
	
	// returns the string representation of the root node
	api.show = function() {
		return root.toString();
	};
	
	// clears the current tree
	// useful for unit testing
	api.clear = function() {
		root.die();
		root = createNode('root');
		
		pot = {};
	};
	
	return api;
	
}());
