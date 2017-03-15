# hier

If you perceive your webapp as a directory tree, hier might be for you. It tries
to handle the global state, letting you write Crockford-style constructors for
your hierarchy nodes.

Plays well with the likes of
[crossroads](https://github.com/millermedeiros/crossroads.js) and
[mustache](https://github.com/janl/mustache.js).


## api

`hier.add(path, elem, func, params)` invokes `func(elem, params)` and adds the
path to the tree. If `elem` is a string, the right dom element will be
query-selected for you.

`hier.update(path, params)` invokes `func(elem, params)` with the new params,
removing the path's descendants before that.

`hier.remove(path)` removes the path from the tree.

`hier.has(path)` returns a boolean.

`hier.reg(path, elem, func)` does not do anything except that it enables you to
do `hier.add(path, params)` from then on.

`hier.unreg(path)` and you cannot use the shorthand `hier.add` any more.

`hier.on(hook, func)` hooks `func` to one of (`view` is the output of the
constructor):
* `pre-init`, expects `func(path, params)`, called before the node constructor
  is invoked;
* `post-init`, expects `func(path, view)`, called after the node constructor is
  invoked;
* `pre-empty`, expects `func(path, view)`, called when the node is being removed
  but before its children are;
* `pre-remove`, expects `func(path, view)`, called when the node is being
  removed after its children are;
* `post-remove`, expects `func(path)`, called after the node is removed.

`hier.off(hook)` removes the previously hooked function.

`hier.show()` returns string representation of the tree.


## licence

MIT
