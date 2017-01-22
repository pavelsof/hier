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

`hier.on(hook, func)` hooks `func(path, view)` to one of `pre-init`,
`post-init`, `pre-remove` or `post-remove`; the `view` is the output of the
constructor.

`hier.off(hook)` removes the previously hooked function.

`hier.show()` returns string representation of the tree.


## licence

MIT
