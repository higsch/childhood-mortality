
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.setAttribute('aria-hidden', 'true');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function bisector(compare) {
      if (compare.length === 1) compare = ascendingComparator(compare);
      return {
        left: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) < 0) lo = mid + 1;
            else hi = mid;
          }
          return lo;
        },
        right: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) > 0) hi = mid;
            else lo = mid + 1;
          }
          return lo;
        }
      };
    }

    function ascendingComparator(f) {
      return function(d, x) {
        return ascending(f(d), x);
      };
    }

    var ascendingBisect = bisector(ascending);
    var bisectRight = ascendingBisect.right;

    function extent(values, valueof) {
      var n = values.length,
          i = -1,
          value,
          min,
          max;

      if (valueof == null) {
        while (++i < n) { // Find the first comparable value.
          if ((value = values[i]) != null && value >= value) {
            min = max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = values[i]) != null) {
                if (min > value) min = value;
                if (max < value) max = value;
              }
            }
          }
        }
      }

      else {
        while (++i < n) { // Find the first comparable value.
          if ((value = valueof(values[i], i, values)) != null && value >= value) {
            min = max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = valueof(values[i], i, values)) != null) {
                if (min > value) min = value;
                if (max < value) max = value;
              }
            }
          }
        }
      }

      return [min, max];
    }

    function sequence(start, stop, step) {
      start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

      var i = -1,
          n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
          range = new Array(n);

      while (++i < n) {
        range[i] = start + i * step;
      }

      return range;
    }

    var e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    function ticks(start, stop, count) {
      var reverse,
          i = -1,
          n,
          ticks,
          step;

      stop = +stop, start = +start, count = +count;
      if (start === stop && count > 0) return [start];
      if (reverse = stop < start) n = start, start = stop, stop = n;
      if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

      if (step > 0) {
        start = Math.ceil(start / step);
        stop = Math.floor(stop / step);
        ticks = new Array(n = Math.ceil(stop - start + 1));
        while (++i < n) ticks[i] = (start + i) * step;
      } else {
        start = Math.floor(start * step);
        stop = Math.ceil(stop * step);
        ticks = new Array(n = Math.ceil(start - stop + 1));
        while (++i < n) ticks[i] = (start - i) / step;
      }

      if (reverse) ticks.reverse();

      return ticks;
    }

    function tickIncrement(start, stop, count) {
      var step = (stop - start) / Math.max(0, count),
          power = Math.floor(Math.log(step) / Math.LN10),
          error = step / Math.pow(10, power);
      return power >= 0
          ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
          : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    function tickStep(start, stop, count) {
      var step0 = Math.abs(stop - start) / Math.max(0, count),
          step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
          error = step0 / step1;
      if (error >= e10) step1 *= 10;
      else if (error >= e5) step1 *= 5;
      else if (error >= e2) step1 *= 2;
      return stop < start ? -step1 : step1;
    }

    function max(values, valueof) {
      var n = values.length,
          i = -1,
          value,
          max;

      if (valueof == null) {
        while (++i < n) { // Find the first comparable value.
          if ((value = values[i]) != null && value >= value) {
            max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = values[i]) != null && value > max) {
                max = value;
              }
            }
          }
        }
      }

      else {
        while (++i < n) { // Find the first comparable value.
          if ((value = valueof(values[i], i, values)) != null && value >= value) {
            max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = valueof(values[i], i, values)) != null && value > max) {
                max = value;
              }
            }
          }
        }
      }

      return max;
    }

    var noop$1 = {value: function() {}};

    function dispatch() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function parseTypenames(typenames, types) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
        return {type: t, name: name};
      });
    }

    Dispatch.prototype = dispatch.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
        while (++i < n) {
          if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
          else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
        }

        return this;
      },
      copy: function() {
        var copy = {}, _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      }
    };

    function get(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          type[i] = noop$1, type = type.slice(0, i).concat(type.slice(i + 1));
          break;
        }
      }
      if (callback != null) type.push({name: name, value: callback});
      return type;
    }

    var xhtml = "http://www.w3.org/1999/xhtml";

    var namespaces = {
      svg: "http://www.w3.org/2000/svg",
      xhtml: xhtml,
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };

    function namespace(name) {
      var prefix = name += "", i = prefix.indexOf(":");
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
    }

    function creatorInherit(name) {
      return function() {
        var document = this.ownerDocument,
            uri = this.namespaceURI;
        return uri === xhtml && document.documentElement.namespaceURI === xhtml
            ? document.createElement(name)
            : document.createElementNS(uri, name);
      };
    }

    function creatorFixed(fullname) {
      return function() {
        return this.ownerDocument.createElementNS(fullname.space, fullname.local);
      };
    }

    function creator(name) {
      var fullname = namespace(name);
      return (fullname.local
          ? creatorFixed
          : creatorInherit)(fullname);
    }

    function none() {}

    function selector(selector) {
      return selector == null ? none : function() {
        return this.querySelector(selector);
      };
    }

    function selection_select(select) {
      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
          }
        }
      }

      return new Selection(subgroups, this._parents);
    }

    function empty$1() {
      return [];
    }

    function selectorAll(selector) {
      return selector == null ? empty$1 : function() {
        return this.querySelectorAll(selector);
      };
    }

    function selection_selectAll(select) {
      if (typeof select !== "function") select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            subgroups.push(select.call(node, node.__data__, i, group));
            parents.push(node);
          }
        }
      }

      return new Selection(subgroups, parents);
    }

    function matcher(selector) {
      return function() {
        return this.matches(selector);
      };
    }

    function selection_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Selection(subgroups, this._parents);
    }

    function sparse(update) {
      return new Array(update.length);
    }

    function selection_enter() {
      return new Selection(this._enter || this._groups.map(sparse), this._parents);
    }

    function EnterNode(parent, datum) {
      this.ownerDocument = parent.ownerDocument;
      this.namespaceURI = parent.namespaceURI;
      this._next = null;
      this._parent = parent;
      this.__data__ = datum;
    }

    EnterNode.prototype = {
      constructor: EnterNode,
      appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
      insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
      querySelector: function(selector) { return this._parent.querySelector(selector); },
      querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
    };

    function constant(x) {
      return function() {
        return x;
      };
    }

    var keyPrefix = "$"; // Protect against keys like “__proto__”.

    function bindIndex(parent, group, enter, update, exit, data) {
      var i = 0,
          node,
          groupLength = group.length,
          dataLength = data.length;

      // Put any non-null nodes that fit into update.
      // Put any null nodes into enter.
      // Put any remaining data into enter.
      for (; i < dataLength; ++i) {
        if (node = group[i]) {
          node.__data__ = data[i];
          update[i] = node;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Put any non-null nodes that don’t fit into exit.
      for (; i < groupLength; ++i) {
        if (node = group[i]) {
          exit[i] = node;
        }
      }
    }

    function bindKey(parent, group, enter, update, exit, data, key) {
      var i,
          node,
          nodeByKeyValue = {},
          groupLength = group.length,
          dataLength = data.length,
          keyValues = new Array(groupLength),
          keyValue;

      // Compute the key for each node.
      // If multiple nodes have the same key, the duplicates are added to exit.
      for (i = 0; i < groupLength; ++i) {
        if (node = group[i]) {
          keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
          if (keyValue in nodeByKeyValue) {
            exit[i] = node;
          } else {
            nodeByKeyValue[keyValue] = node;
          }
        }
      }

      // Compute the key for each datum.
      // If there a node associated with this key, join and add it to update.
      // If there is not (or the key is a duplicate), add it to enter.
      for (i = 0; i < dataLength; ++i) {
        keyValue = keyPrefix + key.call(parent, data[i], i, data);
        if (node = nodeByKeyValue[keyValue]) {
          update[i] = node;
          node.__data__ = data[i];
          nodeByKeyValue[keyValue] = null;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Add any remaining nodes that were not bound to data to exit.
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
          exit[i] = node;
        }
      }
    }

    function selection_data(value, key) {
      if (!value) {
        data = new Array(this.size()), j = -1;
        this.each(function(d) { data[++j] = d; });
        return data;
      }

      var bind = key ? bindKey : bindIndex,
          parents = this._parents,
          groups = this._groups;

      if (typeof value !== "function") value = constant(value);

      for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
        var parent = parents[j],
            group = groups[j],
            groupLength = group.length,
            data = value.call(parent, parent && parent.__data__, j, parents),
            dataLength = data.length,
            enterGroup = enter[j] = new Array(dataLength),
            updateGroup = update[j] = new Array(dataLength),
            exitGroup = exit[j] = new Array(groupLength);

        bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

        // Now connect the enter nodes to their following update node, such that
        // appendChild can insert the materialized enter node before this node,
        // rather than at the end of the parent node.
        for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
          if (previous = enterGroup[i0]) {
            if (i0 >= i1) i1 = i0 + 1;
            while (!(next = updateGroup[i1]) && ++i1 < dataLength);
            previous._next = next || null;
          }
        }
      }

      update = new Selection(update, parents);
      update._enter = enter;
      update._exit = exit;
      return update;
    }

    function selection_exit() {
      return new Selection(this._exit || this._groups.map(sparse), this._parents);
    }

    function selection_join(onenter, onupdate, onexit) {
      var enter = this.enter(), update = this, exit = this.exit();
      enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
      if (onupdate != null) update = onupdate(update);
      if (onexit == null) exit.remove(); else onexit(exit);
      return enter && update ? enter.merge(update).order() : update;
    }

    function selection_merge(selection) {

      for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Selection(merges, this._parents);
    }

    function selection_order() {

      for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
        for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
          if (node = group[i]) {
            if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
            next = node;
          }
        }
      }

      return this;
    }

    function selection_sort(compare) {
      if (!compare) compare = ascending$1;

      function compareNode(a, b) {
        return a && b ? compare(a.__data__, b.__data__) : !a - !b;
      }

      for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            sortgroup[i] = node;
          }
        }
        sortgroup.sort(compareNode);
      }

      return new Selection(sortgroups, this._parents).order();
    }

    function ascending$1(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function selection_call() {
      var callback = arguments[0];
      arguments[0] = this;
      callback.apply(null, arguments);
      return this;
    }

    function selection_nodes() {
      var nodes = new Array(this.size()), i = -1;
      this.each(function() { nodes[++i] = this; });
      return nodes;
    }

    function selection_node() {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
          var node = group[i];
          if (node) return node;
        }
      }

      return null;
    }

    function selection_size() {
      var size = 0;
      this.each(function() { ++size; });
      return size;
    }

    function selection_empty() {
      return !this.node();
    }

    function selection_each(callback) {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) callback.call(node, node.__data__, i, group);
        }
      }

      return this;
    }

    function attrRemove(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant(name, value) {
      return function() {
        this.setAttribute(name, value);
      };
    }

    function attrConstantNS(fullname, value) {
      return function() {
        this.setAttributeNS(fullname.space, fullname.local, value);
      };
    }

    function attrFunction(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);
        else this.setAttribute(name, v);
      };
    }

    function attrFunctionNS(fullname, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
        else this.setAttributeNS(fullname.space, fullname.local, v);
      };
    }

    function selection_attr(name, value) {
      var fullname = namespace(name);

      if (arguments.length < 2) {
        var node = this.node();
        return fullname.local
            ? node.getAttributeNS(fullname.space, fullname.local)
            : node.getAttribute(fullname);
      }

      return this.each((value == null
          ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
          ? (fullname.local ? attrFunctionNS : attrFunction)
          : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
    }

    function defaultView(node) {
      return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
          || (node.document && node) // node is a Window
          || node.defaultView; // node is a Document
    }

    function styleRemove(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant(name, value, priority) {
      return function() {
        this.style.setProperty(name, value, priority);
      };
    }

    function styleFunction(name, value, priority) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.style.removeProperty(name);
        else this.style.setProperty(name, v, priority);
      };
    }

    function selection_style(name, value, priority) {
      return arguments.length > 1
          ? this.each((value == null
                ? styleRemove : typeof value === "function"
                ? styleFunction
                : styleConstant)(name, value, priority == null ? "" : priority))
          : styleValue(this.node(), name);
    }

    function styleValue(node, name) {
      return node.style.getPropertyValue(name)
          || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
    }

    function propertyRemove(name) {
      return function() {
        delete this[name];
      };
    }

    function propertyConstant(name, value) {
      return function() {
        this[name] = value;
      };
    }

    function propertyFunction(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) delete this[name];
        else this[name] = v;
      };
    }

    function selection_property(name, value) {
      return arguments.length > 1
          ? this.each((value == null
              ? propertyRemove : typeof value === "function"
              ? propertyFunction
              : propertyConstant)(name, value))
          : this.node()[name];
    }

    function classArray(string) {
      return string.trim().split(/^|\s+/);
    }

    function classList(node) {
      return node.classList || new ClassList(node);
    }

    function ClassList(node) {
      this._node = node;
      this._names = classArray(node.getAttribute("class") || "");
    }

    ClassList.prototype = {
      add: function(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
          this._names.push(name);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      remove: function(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
          this._names.splice(i, 1);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      contains: function(name) {
        return this._names.indexOf(name) >= 0;
      }
    };

    function classedAdd(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.add(names[i]);
    }

    function classedRemove(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.remove(names[i]);
    }

    function classedTrue(names) {
      return function() {
        classedAdd(this, names);
      };
    }

    function classedFalse(names) {
      return function() {
        classedRemove(this, names);
      };
    }

    function classedFunction(names, value) {
      return function() {
        (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
      };
    }

    function selection_classed(name, value) {
      var names = classArray(name + "");

      if (arguments.length < 2) {
        var list = classList(this.node()), i = -1, n = names.length;
        while (++i < n) if (!list.contains(names[i])) return false;
        return true;
      }

      return this.each((typeof value === "function"
          ? classedFunction : value
          ? classedTrue
          : classedFalse)(names, value));
    }

    function textRemove() {
      this.textContent = "";
    }

    function textConstant(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.textContent = v == null ? "" : v;
      };
    }

    function selection_text(value) {
      return arguments.length
          ? this.each(value == null
              ? textRemove : (typeof value === "function"
              ? textFunction
              : textConstant)(value))
          : this.node().textContent;
    }

    function htmlRemove() {
      this.innerHTML = "";
    }

    function htmlConstant(value) {
      return function() {
        this.innerHTML = value;
      };
    }

    function htmlFunction(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.innerHTML = v == null ? "" : v;
      };
    }

    function selection_html(value) {
      return arguments.length
          ? this.each(value == null
              ? htmlRemove : (typeof value === "function"
              ? htmlFunction
              : htmlConstant)(value))
          : this.node().innerHTML;
    }

    function raise() {
      if (this.nextSibling) this.parentNode.appendChild(this);
    }

    function selection_raise() {
      return this.each(raise);
    }

    function lower() {
      if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }

    function selection_lower() {
      return this.each(lower);
    }

    function selection_append(name) {
      var create = typeof name === "function" ? name : creator(name);
      return this.select(function() {
        return this.appendChild(create.apply(this, arguments));
      });
    }

    function constantNull() {
      return null;
    }

    function selection_insert(name, before) {
      var create = typeof name === "function" ? name : creator(name),
          select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
      return this.select(function() {
        return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
      });
    }

    function remove() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    }

    function selection_remove() {
      return this.each(remove);
    }

    function selection_cloneShallow() {
      var clone = this.cloneNode(false), parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    function selection_cloneDeep() {
      var clone = this.cloneNode(true), parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    function selection_clone(deep) {
      return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
    }

    function selection_datum(value) {
      return arguments.length
          ? this.property("__data__", value)
          : this.node().__data__;
    }

    var filterEvents = {};

    if (typeof document !== "undefined") {
      var element$1 = document.documentElement;
      if (!("onmouseenter" in element$1)) {
        filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
      }
    }

    function filterContextListener(listener, index, group) {
      listener = contextListener(listener, index, group);
      return function(event) {
        var related = event.relatedTarget;
        if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
          listener.call(this, event);
        }
      };
    }

    function contextListener(listener, index, group) {
      return function(event1) {
        try {
          listener.call(this, this.__data__, index, group);
        } finally {
        }
      };
    }

    function parseTypenames$1(typenames) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        return {type: t, name: name};
      });
    }

    function onRemove(typename) {
      return function() {
        var on = this.__on;
        if (!on) return;
        for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
          if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.capture);
          } else {
            on[++i] = o;
          }
        }
        if (++i) on.length = i;
        else delete this.__on;
      };
    }

    function onAdd(typename, value, capture) {
      var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
      return function(d, i, group) {
        var on = this.__on, o, listener = wrap(value, i, group);
        if (on) for (var j = 0, m = on.length; j < m; ++j) {
          if ((o = on[j]).type === typename.type && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.capture);
            this.addEventListener(o.type, o.listener = listener, o.capture = capture);
            o.value = value;
            return;
          }
        }
        this.addEventListener(typename.type, listener, capture);
        o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
        if (!on) this.__on = [o];
        else on.push(o);
      };
    }

    function selection_on(typename, value, capture) {
      var typenames = parseTypenames$1(typename + ""), i, n = typenames.length, t;

      if (arguments.length < 2) {
        var on = this.node().__on;
        if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
          for (i = 0, o = on[j]; i < n; ++i) {
            if ((t = typenames[i]).type === o.type && t.name === o.name) {
              return o.value;
            }
          }
        }
        return;
      }

      on = value ? onAdd : onRemove;
      if (capture == null) capture = false;
      for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
      return this;
    }

    function dispatchEvent(node, type, params) {
      var window = defaultView(node),
          event = window.CustomEvent;

      if (typeof event === "function") {
        event = new event(type, params);
      } else {
        event = window.document.createEvent("Event");
        if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
        else event.initEvent(type, false, false);
      }

      node.dispatchEvent(event);
    }

    function dispatchConstant(type, params) {
      return function() {
        return dispatchEvent(this, type, params);
      };
    }

    function dispatchFunction(type, params) {
      return function() {
        return dispatchEvent(this, type, params.apply(this, arguments));
      };
    }

    function selection_dispatch(type, params) {
      return this.each((typeof params === "function"
          ? dispatchFunction
          : dispatchConstant)(type, params));
    }

    var root = [null];

    function Selection(groups, parents) {
      this._groups = groups;
      this._parents = parents;
    }

    function selection() {
      return new Selection([[document.documentElement]], root);
    }

    Selection.prototype = selection.prototype = {
      constructor: Selection,
      select: selection_select,
      selectAll: selection_selectAll,
      filter: selection_filter,
      data: selection_data,
      enter: selection_enter,
      exit: selection_exit,
      join: selection_join,
      merge: selection_merge,
      order: selection_order,
      sort: selection_sort,
      call: selection_call,
      nodes: selection_nodes,
      node: selection_node,
      size: selection_size,
      empty: selection_empty,
      each: selection_each,
      attr: selection_attr,
      style: selection_style,
      property: selection_property,
      classed: selection_classed,
      text: selection_text,
      html: selection_html,
      raise: selection_raise,
      lower: selection_lower,
      append: selection_append,
      insert: selection_insert,
      remove: selection_remove,
      clone: selection_clone,
      datum: selection_datum,
      on: selection_on,
      dispatch: selection_dispatch
    };

    function select(selector) {
      return typeof selector === "string"
          ? new Selection([[document.querySelector(selector)]], [document.documentElement])
          : new Selection([[selector]], root);
    }

    function define(constructor, factory, prototype) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    }

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = "\\s*([+-]?\\d+)\\s*",
        reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
        reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
        reHex = /^#([0-9a-f]{3,8})$/,
        reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
        reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
        reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
        reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
        reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
        reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32
    };

    define(Color, color, {
      copy: function(channels) {
        return Object.assign(new this.constructor, this, channels);
      },
      displayable: function() {
        return this.rgb().displayable();
      },
      hex: color_formatHex, // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });

    function color_formatHex() {
      return this.rgb().formatHex();
    }

    function color_formatHsl() {
      return hslConvert(this).formatHsl();
    }

    function color_formatRgb() {
      return this.rgb().formatRgb();
    }

    function color(format) {
      var m, l;
      format = (format + "").trim().toLowerCase();
      return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
          : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
          : l === 8 ? new Rgb(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
          : l === 4 ? new Rgb((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
          : null) // invalid hex
          : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
          : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
          : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
          : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
          : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
          : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
          : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
          : null;
    }

    function rgbn(n) {
      return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb;
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function rgb(r, g, b, opacity) {
      return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Rgb, rgb, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      rgb: function() {
        return this;
      },
      displayable: function() {
        return (-0.5 <= this.r && this.r < 255.5)
            && (-0.5 <= this.g && this.g < 255.5)
            && (-0.5 <= this.b && this.b < 255.5)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: rgb_formatHex, // Deprecated! Use color.formatHex.
      formatHex: rgb_formatHex,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));

    function rgb_formatHex() {
      return "#" + hex(this.r) + hex(this.g) + hex(this.b);
    }

    function rgb_formatRgb() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "rgb(" : "rgba(")
          + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.b) || 0))
          + (a === 1 ? ")" : ", " + a + ")");
    }

    function hex(value) {
      value = Math.max(0, Math.min(255, Math.round(value) || 0));
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl;
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          h = NaN,
          s = max - min,
          l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Hsl, hsl, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      rgb: function() {
        var h = this.h % 360 + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      displayable: function() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s))
            && (0 <= this.l && this.l <= 1)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl: function() {
        var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
        return (a === 1 ? "hsl(" : "hsla(")
            + (this.h || 0) + ", "
            + (this.s || 0) * 100 + "%, "
            + (this.l || 0) * 100 + "%"
            + (a === 1 ? ")" : ", " + a + ")");
      }
    }));

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    function constant$1(x) {
      return function() {
        return x;
      };
    }

    function linear(a, d) {
      return function(t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
        return Math.pow(a + t * b, y);
      };
    }

    function gamma(y) {
      return (y = +y) === 1 ? nogamma : function(a, b) {
        return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
      };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear(a, d) : constant$1(isNaN(a) ? b : a);
    }

    var interpolateRgb = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb$1(start, end) {
        var r = color((start = rgb(start)).r, (end = rgb(end)).r),
            g = color(start.g, end.g),
            b = color(start.b, end.b),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + "";
        };
      }

      rgb$1.gamma = rgbGamma;

      return rgb$1;
    })(1);

    function numberArray(a, b) {
      if (!b) b = [];
      var n = a ? Math.min(b.length, a.length) : 0,
          c = b.slice(),
          i;
      return function(t) {
        for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
        return c;
      };
    }

    function isNumberArray(x) {
      return ArrayBuffer.isView(x) && !(x instanceof DataView);
    }

    function genericArray(a, b) {
      var nb = b ? b.length : 0,
          na = a ? Math.min(nb, a.length) : 0,
          x = new Array(na),
          c = new Array(nb),
          i;

      for (i = 0; i < na; ++i) x[i] = interpolateValue(a[i], b[i]);
      for (; i < nb; ++i) c[i] = b[i];

      return function(t) {
        for (i = 0; i < na; ++i) c[i] = x[i](t);
        return c;
      };
    }

    function date(a, b) {
      var d = new Date;
      return a = +a, b = +b, function(t) {
        return d.setTime(a * (1 - t) + b * t), d;
      };
    }

    function interpolateNumber(a, b) {
      return a = +a, b = +b, function(t) {
        return a * (1 - t) + b * t;
      };
    }

    function object(a, b) {
      var i = {},
          c = {},
          k;

      if (a === null || typeof a !== "object") a = {};
      if (b === null || typeof b !== "object") b = {};

      for (k in b) {
        if (k in a) {
          i[k] = interpolateValue(a[k], b[k]);
        } else {
          c[k] = b[k];
        }
      }

      return function(t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
        reB = new RegExp(reA.source, "g");

    function zero(b) {
      return function() {
        return b;
      };
    }

    function one(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    function interpolateString(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? one(q[0].x)
          : zero(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    function interpolateValue(a, b) {
      var t = typeof b, c;
      return b == null || t === "boolean" ? constant$1(b)
          : (t === "number" ? interpolateNumber
          : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
          : b instanceof color ? interpolateRgb
          : b instanceof Date ? date
          : isNumberArray(b) ? numberArray
          : Array.isArray(b) ? genericArray
          : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
          : interpolateNumber)(a, b);
    }

    function interpolateRound(a, b) {
      return a = +a, b = +b, function(t) {
        return Math.round(a * (1 - t) + b * t);
      };
    }

    var degrees = 180 / Math.PI;

    var identity = {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      skewX: 0,
      scaleX: 1,
      scaleY: 1
    };

    function decompose(a, b, c, d, e, f) {
      var scaleX, scaleY, skewX;
      if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
      if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
      if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
      if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
      return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * degrees,
        skewX: Math.atan(skewX) * degrees,
        scaleX: scaleX,
        scaleY: scaleY
      };
    }

    var cssNode,
        cssRoot,
        cssView,
        svgNode;

    function parseCss(value) {
      if (value === "none") return identity;
      if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
      cssNode.style.transform = value;
      value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
      cssRoot.removeChild(cssNode);
      value = value.slice(7, -1).split(",");
      return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
    }

    function parseSvg(value) {
      if (value == null) return identity;
      if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
      svgNode.setAttribute("transform", value);
      if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
      value = value.matrix;
      return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
    }

    function interpolateTransform(parse, pxComma, pxParen, degParen) {

      function pop(s) {
        return s.length ? s.pop() + " " : "";
      }

      function translate(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push("translate(", null, pxComma, null, pxParen);
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb || yb) {
          s.push("translate(" + xb + pxComma + yb + pxParen);
        }
      }

      function rotate(a, b, s, q) {
        if (a !== b) {
          if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
          q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "rotate(" + b + degParen);
        }
      }

      function skewX(a, b, s, q) {
        if (a !== b) {
          q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "skewX(" + b + degParen);
        }
      }

      function scale(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push(pop(s) + "scale(", null, ",", null, ")");
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb !== 1 || yb !== 1) {
          s.push(pop(s) + "scale(" + xb + "," + yb + ")");
        }
      }

      return function(a, b) {
        var s = [], // string constants and placeholders
            q = []; // number interpolators
        a = parse(a), b = parse(b);
        translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
        rotate(a.rotate, b.rotate, s, q);
        skewX(a.skewX, b.skewX, s, q);
        scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
        a = b = null; // gc
        return function(t) {
          var i = -1, n = q.length, o;
          while (++i < n) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        };
      };
    }

    var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
    var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

    var frame = 0, // is an animation frame pending?
        timeout = 0, // is a timeout pending?
        interval = 0, // are any timers active?
        pokeDelay = 1000, // how frequently we check for clock skew
        taskHead,
        taskTail,
        clockLast = 0,
        clockNow = 0,
        clockSkew = 0,
        clock = typeof performance === "object" && performance.now ? performance : Date,
        setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

    function now() {
      return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
    }

    function clearNow() {
      clockNow = 0;
    }

    function Timer() {
      this._call =
      this._time =
      this._next = null;
    }

    Timer.prototype = timer.prototype = {
      constructor: Timer,
      restart: function(callback, delay, time) {
        if (typeof callback !== "function") throw new TypeError("callback is not a function");
        time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
        if (!this._next && taskTail !== this) {
          if (taskTail) taskTail._next = this;
          else taskHead = this;
          taskTail = this;
        }
        this._call = callback;
        this._time = time;
        sleep();
      },
      stop: function() {
        if (this._call) {
          this._call = null;
          this._time = Infinity;
          sleep();
        }
      }
    };

    function timer(callback, delay, time) {
      var t = new Timer;
      t.restart(callback, delay, time);
      return t;
    }

    function timerFlush() {
      now(); // Get the current time, if not already set.
      ++frame; // Pretend we’ve set an alarm, if we haven’t already.
      var t = taskHead, e;
      while (t) {
        if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
        t = t._next;
      }
      --frame;
    }

    function wake() {
      clockNow = (clockLast = clock.now()) + clockSkew;
      frame = timeout = 0;
      try {
        timerFlush();
      } finally {
        frame = 0;
        nap();
        clockNow = 0;
      }
    }

    function poke() {
      var now = clock.now(), delay = now - clockLast;
      if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
    }

    function nap() {
      var t0, t1 = taskHead, t2, time = Infinity;
      while (t1) {
        if (t1._call) {
          if (time > t1._time) time = t1._time;
          t0 = t1, t1 = t1._next;
        } else {
          t2 = t1._next, t1._next = null;
          t1 = t0 ? t0._next = t2 : taskHead = t2;
        }
      }
      taskTail = t0;
      sleep(time);
    }

    function sleep(time) {
      if (frame) return; // Soonest alarm already set, or will be.
      if (timeout) timeout = clearTimeout(timeout);
      var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
      if (delay > 24) {
        if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
        if (interval) interval = clearInterval(interval);
      } else {
        if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
        frame = 1, setFrame(wake);
      }
    }

    function timeout$1(callback, delay, time) {
      var t = new Timer;
      delay = delay == null ? 0 : +delay;
      t.restart(function(elapsed) {
        t.stop();
        callback(elapsed + delay);
      }, delay, time);
      return t;
    }

    var emptyOn = dispatch("start", "end", "cancel", "interrupt");
    var emptyTween = [];

    var CREATED = 0;
    var SCHEDULED = 1;
    var STARTING = 2;
    var STARTED = 3;
    var RUNNING = 4;
    var ENDING = 5;
    var ENDED = 6;

    function schedule(node, name, id, index, group, timing) {
      var schedules = node.__transition;
      if (!schedules) node.__transition = {};
      else if (id in schedules) return;
      create(node, id, {
        name: name,
        index: index, // For context during callback.
        group: group, // For context during callback.
        on: emptyOn,
        tween: emptyTween,
        time: timing.time,
        delay: timing.delay,
        duration: timing.duration,
        ease: timing.ease,
        timer: null,
        state: CREATED
      });
    }

    function init$1(node, id) {
      var schedule = get$1(node, id);
      if (schedule.state > CREATED) throw new Error("too late; already scheduled");
      return schedule;
    }

    function set$1(node, id) {
      var schedule = get$1(node, id);
      if (schedule.state > STARTED) throw new Error("too late; already running");
      return schedule;
    }

    function get$1(node, id) {
      var schedule = node.__transition;
      if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
      return schedule;
    }

    function create(node, id, self) {
      var schedules = node.__transition,
          tween;

      // Initialize the self timer when the transition is created.
      // Note the actual delay is not known until the first callback!
      schedules[id] = self;
      self.timer = timer(schedule, 0, self.time);

      function schedule(elapsed) {
        self.state = SCHEDULED;
        self.timer.restart(start, self.delay, self.time);

        // If the elapsed delay is less than our first sleep, start immediately.
        if (self.delay <= elapsed) start(elapsed - self.delay);
      }

      function start(elapsed) {
        var i, j, n, o;

        // If the state is not SCHEDULED, then we previously errored on start.
        if (self.state !== SCHEDULED) return stop();

        for (i in schedules) {
          o = schedules[i];
          if (o.name !== self.name) continue;

          // While this element already has a starting transition during this frame,
          // defer starting an interrupting transition until that transition has a
          // chance to tick (and possibly end); see d3/d3-transition#54!
          if (o.state === STARTED) return timeout$1(start);

          // Interrupt the active transition, if any.
          if (o.state === RUNNING) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("interrupt", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }

          // Cancel any pre-empted transitions.
          else if (+i < id) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("cancel", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }
        }

        // Defer the first tick to end of the current frame; see d3/d3#1576.
        // Note the transition may be canceled after start and before the first tick!
        // Note this must be scheduled before the start event; see d3/d3-transition#16!
        // Assuming this is successful, subsequent callbacks go straight to tick.
        timeout$1(function() {
          if (self.state === STARTED) {
            self.state = RUNNING;
            self.timer.restart(tick, self.delay, self.time);
            tick(elapsed);
          }
        });

        // Dispatch the start event.
        // Note this must be done before the tween are initialized.
        self.state = STARTING;
        self.on.call("start", node, node.__data__, self.index, self.group);
        if (self.state !== STARTING) return; // interrupted
        self.state = STARTED;

        // Initialize the tween, deleting null tween.
        tween = new Array(n = self.tween.length);
        for (i = 0, j = -1; i < n; ++i) {
          if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
            tween[++j] = o;
          }
        }
        tween.length = j + 1;
      }

      function tick(elapsed) {
        var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
            i = -1,
            n = tween.length;

        while (++i < n) {
          tween[i].call(node, t);
        }

        // Dispatch the end event.
        if (self.state === ENDING) {
          self.on.call("end", node, node.__data__, self.index, self.group);
          stop();
        }
      }

      function stop() {
        self.state = ENDED;
        self.timer.stop();
        delete schedules[id];
        for (var i in schedules) return; // eslint-disable-line no-unused-vars
        delete node.__transition;
      }
    }

    function interrupt(node, name) {
      var schedules = node.__transition,
          schedule,
          active,
          empty = true,
          i;

      if (!schedules) return;

      name = name == null ? null : name + "";

      for (i in schedules) {
        if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
        active = schedule.state > STARTING && schedule.state < ENDING;
        schedule.state = ENDED;
        schedule.timer.stop();
        schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
        delete schedules[i];
      }

      if (empty) delete node.__transition;
    }

    function selection_interrupt(name) {
      return this.each(function() {
        interrupt(this, name);
      });
    }

    function tweenRemove(id, name) {
      var tween0, tween1;
      return function() {
        var schedule = set$1(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = tween0 = tween;
          for (var i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1 = tween1.slice();
              tween1.splice(i, 1);
              break;
            }
          }
        }

        schedule.tween = tween1;
      };
    }

    function tweenFunction(id, name, value) {
      var tween0, tween1;
      if (typeof value !== "function") throw new Error;
      return function() {
        var schedule = set$1(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = (tween0 = tween).slice();
          for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1[i] = t;
              break;
            }
          }
          if (i === n) tween1.push(t);
        }

        schedule.tween = tween1;
      };
    }

    function transition_tween(name, value) {
      var id = this._id;

      name += "";

      if (arguments.length < 2) {
        var tween = get$1(this.node(), id).tween;
        for (var i = 0, n = tween.length, t; i < n; ++i) {
          if ((t = tween[i]).name === name) {
            return t.value;
          }
        }
        return null;
      }

      return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
    }

    function tweenValue(transition, name, value) {
      var id = transition._id;

      transition.each(function() {
        var schedule = set$1(this, id);
        (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
      });

      return function(node) {
        return get$1(node, id).value[name];
      };
    }

    function interpolate(a, b) {
      var c;
      return (typeof b === "number" ? interpolateNumber
          : b instanceof color ? interpolateRgb
          : (c = color(b)) ? (b = c, interpolateRgb)
          : interpolateString)(a, b);
    }

    function attrRemove$1(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS$1(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant$1(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttribute(name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrConstantNS$1(fullname, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttributeNS(fullname.space, fullname.local);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrFunction$1(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttribute(name);
        string0 = this.getAttribute(name);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function attrFunctionNS$1(fullname, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
        string0 = this.getAttributeNS(fullname.space, fullname.local);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function transition_attr(name, value) {
      var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
      return this.attrTween(name, typeof value === "function"
          ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
          : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
          : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
    }

    function attrInterpolate(name, i) {
      return function(t) {
        this.setAttribute(name, i.call(this, t));
      };
    }

    function attrInterpolateNS(fullname, i) {
      return function(t) {
        this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
      };
    }

    function attrTweenNS(fullname, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function attrTween(name, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function transition_attrTween(name, value) {
      var key = "attr." + name;
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      var fullname = namespace(name);
      return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
    }

    function delayFunction(id, value) {
      return function() {
        init$1(this, id).delay = +value.apply(this, arguments);
      };
    }

    function delayConstant(id, value) {
      return value = +value, function() {
        init$1(this, id).delay = value;
      };
    }

    function transition_delay(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? delayFunction
              : delayConstant)(id, value))
          : get$1(this.node(), id).delay;
    }

    function durationFunction(id, value) {
      return function() {
        set$1(this, id).duration = +value.apply(this, arguments);
      };
    }

    function durationConstant(id, value) {
      return value = +value, function() {
        set$1(this, id).duration = value;
      };
    }

    function transition_duration(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? durationFunction
              : durationConstant)(id, value))
          : get$1(this.node(), id).duration;
    }

    function easeConstant(id, value) {
      if (typeof value !== "function") throw new Error;
      return function() {
        set$1(this, id).ease = value;
      };
    }

    function transition_ease(value) {
      var id = this._id;

      return arguments.length
          ? this.each(easeConstant(id, value))
          : get$1(this.node(), id).ease;
    }

    function transition_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Transition(subgroups, this._parents, this._name, this._id);
    }

    function transition_merge(transition) {
      if (transition._id !== this._id) throw new Error;

      for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Transition(merges, this._parents, this._name, this._id);
    }

    function start(name) {
      return (name + "").trim().split(/^|\s+/).every(function(t) {
        var i = t.indexOf(".");
        if (i >= 0) t = t.slice(0, i);
        return !t || t === "start";
      });
    }

    function onFunction(id, name, listener) {
      var on0, on1, sit = start(name) ? init$1 : set$1;
      return function() {
        var schedule = sit(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

        schedule.on = on1;
      };
    }

    function transition_on(name, listener) {
      var id = this._id;

      return arguments.length < 2
          ? get$1(this.node(), id).on.on(name)
          : this.each(onFunction(id, name, listener));
    }

    function removeFunction(id) {
      return function() {
        var parent = this.parentNode;
        for (var i in this.__transition) if (+i !== id) return;
        if (parent) parent.removeChild(this);
      };
    }

    function transition_remove() {
      return this.on("end.remove", removeFunction(this._id));
    }

    function transition_select(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
            schedule(subgroup[i], name, id, i, subgroup, get$1(node, id));
          }
        }
      }

      return new Transition(subgroups, this._parents, name, id);
    }

    function transition_selectAll(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            for (var children = select.call(node, node.__data__, i, group), child, inherit = get$1(node, id), k = 0, l = children.length; k < l; ++k) {
              if (child = children[k]) {
                schedule(child, name, id, k, children, inherit);
              }
            }
            subgroups.push(children);
            parents.push(node);
          }
        }
      }

      return new Transition(subgroups, parents, name, id);
    }

    var Selection$1 = selection.prototype.constructor;

    function transition_selection() {
      return new Selection$1(this._groups, this._parents);
    }

    function styleNull(name, interpolate) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            string1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, string10 = string1);
      };
    }

    function styleRemove$1(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant$1(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = styleValue(this, name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function styleFunction$1(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            value1 = value(this),
            string1 = value1 + "";
        if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function styleMaybeRemove(id, name) {
      var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
      return function() {
        var schedule = set$1(this, id),
            on = schedule.on,
            listener = schedule.value[key] == null ? remove || (remove = styleRemove$1(name)) : undefined;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

        schedule.on = on1;
      };
    }

    function transition_style(name, value, priority) {
      var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
      return value == null ? this
          .styleTween(name, styleNull(name, i))
          .on("end.style." + name, styleRemove$1(name))
        : typeof value === "function" ? this
          .styleTween(name, styleFunction$1(name, i, tweenValue(this, "style." + name, value)))
          .each(styleMaybeRemove(this._id, name))
        : this
          .styleTween(name, styleConstant$1(name, i, value), priority)
          .on("end.style." + name, null);
    }

    function styleInterpolate(name, i, priority) {
      return function(t) {
        this.style.setProperty(name, i.call(this, t), priority);
      };
    }

    function styleTween(name, value, priority) {
      var t, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
        return t;
      }
      tween._value = value;
      return tween;
    }

    function transition_styleTween(name, value, priority) {
      var key = "style." + (name += "");
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
    }

    function textConstant$1(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction$1(value) {
      return function() {
        var value1 = value(this);
        this.textContent = value1 == null ? "" : value1;
      };
    }

    function transition_text(value) {
      return this.tween("text", typeof value === "function"
          ? textFunction$1(tweenValue(this, "text", value))
          : textConstant$1(value == null ? "" : value + ""));
    }

    function textInterpolate(i) {
      return function(t) {
        this.textContent = i.call(this, t);
      };
    }

    function textTween(value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function transition_textTween(value) {
      var key = "text";
      if (arguments.length < 1) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      return this.tween(key, textTween(value));
    }

    function transition_transition() {
      var name = this._name,
          id0 = this._id,
          id1 = newId();

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            var inherit = get$1(node, id0);
            schedule(node, name, id1, i, group, {
              time: inherit.time + inherit.delay + inherit.duration,
              delay: 0,
              duration: inherit.duration,
              ease: inherit.ease
            });
          }
        }
      }

      return new Transition(groups, this._parents, name, id1);
    }

    function transition_end() {
      var on0, on1, that = this, id = that._id, size = that.size();
      return new Promise(function(resolve, reject) {
        var cancel = {value: reject},
            end = {value: function() { if (--size === 0) resolve(); }};

        that.each(function() {
          var schedule = set$1(this, id),
              on = schedule.on;

          // If this node shared a dispatch with the previous node,
          // just assign the updated shared dispatch and we’re done!
          // Otherwise, copy-on-write.
          if (on !== on0) {
            on1 = (on0 = on).copy();
            on1._.cancel.push(cancel);
            on1._.interrupt.push(cancel);
            on1._.end.push(end);
          }

          schedule.on = on1;
        });
      });
    }

    var id = 0;

    function Transition(groups, parents, name, id) {
      this._groups = groups;
      this._parents = parents;
      this._name = name;
      this._id = id;
    }

    function transition(name) {
      return selection().transition(name);
    }

    function newId() {
      return ++id;
    }

    var selection_prototype = selection.prototype;

    Transition.prototype = transition.prototype = {
      constructor: Transition,
      select: transition_select,
      selectAll: transition_selectAll,
      filter: transition_filter,
      merge: transition_merge,
      selection: transition_selection,
      transition: transition_transition,
      call: selection_prototype.call,
      nodes: selection_prototype.nodes,
      node: selection_prototype.node,
      size: selection_prototype.size,
      empty: selection_prototype.empty,
      each: selection_prototype.each,
      on: transition_on,
      attr: transition_attr,
      attrTween: transition_attrTween,
      style: transition_style,
      styleTween: transition_styleTween,
      text: transition_text,
      textTween: transition_textTween,
      remove: transition_remove,
      tween: transition_tween,
      delay: transition_delay,
      duration: transition_duration,
      ease: transition_ease,
      end: transition_end
    };

    function cubicInOut(t) {
      return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
    }

    var defaultTiming = {
      time: null, // Set on use.
      delay: 0,
      duration: 250,
      ease: cubicInOut
    };

    function inherit(node, id) {
      var timing;
      while (!(timing = node.__transition) || !(timing = timing[id])) {
        if (!(node = node.parentNode)) {
          return defaultTiming.time = now(), defaultTiming;
        }
      }
      return timing;
    }

    function selection_transition(name) {
      var id,
          timing;

      if (name instanceof Transition) {
        id = name._id, name = name._name;
      } else {
        id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
      }

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            schedule(node, name, id, i, group, timing || inherit(node, id));
          }
        }
      }

      return new Transition(groups, this._parents, name, id);
    }

    selection.prototype.interrupt = selection_interrupt;
    selection.prototype.transition = selection_transition;

    var pi = Math.PI,
        tau = 2 * pi,
        epsilon = 1e-6,
        tauEpsilon = tau - epsilon;

    function Path() {
      this._x0 = this._y0 = // start of current subpath
      this._x1 = this._y1 = null; // end of current subpath
      this._ = "";
    }

    function path() {
      return new Path;
    }

    Path.prototype = path.prototype = {
      constructor: Path,
      moveTo: function(x, y) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
      },
      closePath: function() {
        if (this._x1 !== null) {
          this._x1 = this._x0, this._y1 = this._y0;
          this._ += "Z";
        }
      },
      lineTo: function(x, y) {
        this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      quadraticCurveTo: function(x1, y1, x, y) {
        this._ += "Q" + (+x1) + "," + (+y1) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      bezierCurveTo: function(x1, y1, x2, y2, x, y) {
        this._ += "C" + (+x1) + "," + (+y1) + "," + (+x2) + "," + (+y2) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      arcTo: function(x1, y1, x2, y2, r) {
        x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
        var x0 = this._x1,
            y0 = this._y1,
            x21 = x2 - x1,
            y21 = y2 - y1,
            x01 = x0 - x1,
            y01 = y0 - y1,
            l01_2 = x01 * x01 + y01 * y01;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x1,y1).
        if (this._x1 === null) {
          this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
        else if (!(l01_2 > epsilon));

        // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
        // Equivalently, is (x1,y1) coincident with (x2,y2)?
        // Or, is the radius zero? Line to (x1,y1).
        else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
          this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Otherwise, draw an arc!
        else {
          var x20 = x2 - x0,
              y20 = y2 - y0,
              l21_2 = x21 * x21 + y21 * y21,
              l20_2 = x20 * x20 + y20 * y20,
              l21 = Math.sqrt(l21_2),
              l01 = Math.sqrt(l01_2),
              l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
              t01 = l / l01,
              t21 = l / l21;

          // If the start tangent is not coincident with (x0,y0), line to.
          if (Math.abs(t01 - 1) > epsilon) {
            this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
          }

          this._ += "A" + r + "," + r + ",0,0," + (+(y01 * x20 > x01 * y20)) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
        }
      },
      arc: function(x, y, r, a0, a1, ccw) {
        x = +x, y = +y, r = +r, ccw = !!ccw;
        var dx = r * Math.cos(a0),
            dy = r * Math.sin(a0),
            x0 = x + dx,
            y0 = y + dy,
            cw = 1 ^ ccw,
            da = ccw ? a0 - a1 : a1 - a0;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x0,y0).
        if (this._x1 === null) {
          this._ += "M" + x0 + "," + y0;
        }

        // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
        else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
          this._ += "L" + x0 + "," + y0;
        }

        // Is this arc empty? We’re done.
        if (!r) return;

        // Does the angle go the wrong way? Flip the direction.
        if (da < 0) da = da % tau + tau;

        // Is this a complete circle? Draw two arcs to complete the circle.
        if (da > tauEpsilon) {
          this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
        }

        // Is this arc non-empty? Draw an arc!
        else if (da > epsilon) {
          this._ += "A" + r + "," + r + ",0," + (+(da >= pi)) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
        }
      },
      rect: function(x, y, w, h) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + (+w) + "v" + (+h) + "h" + (-w) + "Z";
      },
      toString: function() {
        return this._;
      }
    };

    var prefix = "$";

    function Map$1() {}

    Map$1.prototype = map.prototype = {
      constructor: Map$1,
      has: function(key) {
        return (prefix + key) in this;
      },
      get: function(key) {
        return this[prefix + key];
      },
      set: function(key, value) {
        this[prefix + key] = value;
        return this;
      },
      remove: function(key) {
        var property = prefix + key;
        return property in this && delete this[property];
      },
      clear: function() {
        for (var property in this) if (property[0] === prefix) delete this[property];
      },
      keys: function() {
        var keys = [];
        for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
        return keys;
      },
      values: function() {
        var values = [];
        for (var property in this) if (property[0] === prefix) values.push(this[property]);
        return values;
      },
      entries: function() {
        var entries = [];
        for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
        return entries;
      },
      size: function() {
        var size = 0;
        for (var property in this) if (property[0] === prefix) ++size;
        return size;
      },
      empty: function() {
        for (var property in this) if (property[0] === prefix) return false;
        return true;
      },
      each: function(f) {
        for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
      }
    };

    function map(object, f) {
      var map = new Map$1;

      // Copy constructor.
      if (object instanceof Map$1) object.each(function(value, key) { map.set(key, value); });

      // Index array by numeric index or specified key function.
      else if (Array.isArray(object)) {
        var i = -1,
            n = object.length,
            o;

        if (f == null) while (++i < n) map.set(i, object[i]);
        else while (++i < n) map.set(f(o = object[i], i, object), o);
      }

      // Convert object to map.
      else if (object) for (var key in object) map.set(key, object[key]);

      return map;
    }

    function Set$1() {}

    var proto = map.prototype;

    Set$1.prototype = set$2.prototype = {
      constructor: Set$1,
      has: proto.has,
      add: function(value) {
        value += "";
        this[prefix + value] = value;
        return this;
      },
      remove: proto.remove,
      clear: proto.clear,
      values: proto.keys,
      size: proto.size,
      empty: proto.empty,
      each: proto.each
    };

    function set$2(object, f) {
      var set = new Set$1;

      // Copy constructor.
      if (object instanceof Set$1) object.each(function(value) { set.add(value); });

      // Otherwise, assume it’s an array.
      else if (object) {
        var i = -1, n = object.length;
        if (f == null) while (++i < n) set.add(object[i]);
        else while (++i < n) set.add(f(object[i], i, object));
      }

      return set;
    }

    var EOL = {},
        EOF = {},
        QUOTE = 34,
        NEWLINE = 10,
        RETURN = 13;

    function objectConverter(columns) {
      return new Function("d", "return {" + columns.map(function(name, i) {
        return JSON.stringify(name) + ": d[" + i + "] || \"\"";
      }).join(",") + "}");
    }

    function customConverter(columns, f) {
      var object = objectConverter(columns);
      return function(row, i) {
        return f(object(row), i, columns);
      };
    }

    // Compute unique columns in order of discovery.
    function inferColumns(rows) {
      var columnSet = Object.create(null),
          columns = [];

      rows.forEach(function(row) {
        for (var column in row) {
          if (!(column in columnSet)) {
            columns.push(columnSet[column] = column);
          }
        }
      });

      return columns;
    }

    function pad(value, width) {
      var s = value + "", length = s.length;
      return length < width ? new Array(width - length + 1).join(0) + s : s;
    }

    function formatYear(year) {
      return year < 0 ? "-" + pad(-year, 6)
        : year > 9999 ? "+" + pad(year, 6)
        : pad(year, 4);
    }

    function formatDate(date) {
      var hours = date.getUTCHours(),
          minutes = date.getUTCMinutes(),
          seconds = date.getUTCSeconds(),
          milliseconds = date.getUTCMilliseconds();
      return isNaN(date) ? "Invalid Date"
          : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
          + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
          : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
          : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
          : "");
    }

    function dsvFormat(delimiter) {
      var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
          DELIMITER = delimiter.charCodeAt(0);

      function parse(text, f) {
        var convert, columns, rows = parseRows(text, function(row, i) {
          if (convert) return convert(row, i - 1);
          columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
        });
        rows.columns = columns || [];
        return rows;
      }

      function parseRows(text, f) {
        var rows = [], // output rows
            N = text.length,
            I = 0, // current character index
            n = 0, // current line number
            t, // current token
            eof = N <= 0, // current token followed by EOF?
            eol = false; // current token followed by EOL?

        // Strip the trailing newline.
        if (text.charCodeAt(N - 1) === NEWLINE) --N;
        if (text.charCodeAt(N - 1) === RETURN) --N;

        function token() {
          if (eof) return EOF;
          if (eol) return eol = false, EOL;

          // Unescape quotes.
          var i, j = I, c;
          if (text.charCodeAt(j) === QUOTE) {
            while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
            if ((i = I) >= N) eof = true;
            else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            return text.slice(j + 1, i - 1).replace(/""/g, "\"");
          }

          // Find next delimiter or newline.
          while (I < N) {
            if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            else if (c !== DELIMITER) continue;
            return text.slice(j, i);
          }

          // Return last token before EOF.
          return eof = true, text.slice(j, N);
        }

        while ((t = token()) !== EOF) {
          var row = [];
          while (t !== EOL && t !== EOF) row.push(t), t = token();
          if (f && (row = f(row, n++)) == null) continue;
          rows.push(row);
        }

        return rows;
      }

      function preformatBody(rows, columns) {
        return rows.map(function(row) {
          return columns.map(function(column) {
            return formatValue(row[column]);
          }).join(delimiter);
        });
      }

      function format(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
      }

      function formatBody(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return preformatBody(rows, columns).join("\n");
      }

      function formatRows(rows) {
        return rows.map(formatRow).join("\n");
      }

      function formatRow(row) {
        return row.map(formatValue).join(delimiter);
      }

      function formatValue(value) {
        return value == null ? ""
            : value instanceof Date ? formatDate(value)
            : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
            : value;
      }

      return {
        parse: parse,
        parseRows: parseRows,
        format: format,
        formatBody: formatBody,
        formatRows: formatRows,
        formatRow: formatRow,
        formatValue: formatValue
      };
    }

    var csv = dsvFormat(",");

    var csvParse = csv.parse;

    function responseText(response) {
      if (!response.ok) throw new Error(response.status + " " + response.statusText);
      return response.text();
    }

    function text$1(input, init) {
      return fetch(input, init).then(responseText);
    }

    function dsvParse(parse) {
      return function(input, init, row) {
        if (arguments.length === 2 && typeof init === "function") row = init, init = undefined;
        return text$1(input, init).then(function(response) {
          return parse(response, row);
        });
      };
    }

    var csv$1 = dsvParse(csvParse);

    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimal(1.23) returns ["123", 0].
    function formatDecimal(x, p) {
      if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
      var i, coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
        +x.slice(i + 1)
      ];
    }

    function exponent(x) {
      return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
    }

    function formatGroup(grouping, thousands) {
      return function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = grouping[0],
            length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = grouping[j = (j + 1) % grouping.length];
        }

        return t.reverse().join(thousands);
      };
    }

    function formatNumerals(numerals) {
      return function(value) {
        return value.replace(/[0-9]/g, function(i) {
          return numerals[+i];
        });
      };
    }

    // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
    var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

    function formatSpecifier(specifier) {
      if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
      var match;
      return new FormatSpecifier({
        fill: match[1],
        align: match[2],
        sign: match[3],
        symbol: match[4],
        zero: match[5],
        width: match[6],
        comma: match[7],
        precision: match[8] && match[8].slice(1),
        trim: match[9],
        type: match[10]
      });
    }

    formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

    function FormatSpecifier(specifier) {
      this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
      this.align = specifier.align === undefined ? ">" : specifier.align + "";
      this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
      this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
      this.zero = !!specifier.zero;
      this.width = specifier.width === undefined ? undefined : +specifier.width;
      this.comma = !!specifier.comma;
      this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
      this.trim = !!specifier.trim;
      this.type = specifier.type === undefined ? "" : specifier.type + "";
    }

    FormatSpecifier.prototype.toString = function() {
      return this.fill
          + this.align
          + this.sign
          + this.symbol
          + (this.zero ? "0" : "")
          + (this.width === undefined ? "" : Math.max(1, this.width | 0))
          + (this.comma ? "," : "")
          + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
          + (this.trim ? "~" : "")
          + this.type;
    };

    // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
    function formatTrim(s) {
      out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (s[i]) {
          case ".": i0 = i1 = i; break;
          case "0": if (i0 === 0) i0 = i; i1 = i; break;
          default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
        }
      }
      return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
    }

    var prefixExponent;

    function formatPrefixAuto(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1],
          i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
          n = coefficient.length;
      return i === n ? coefficient
          : i > n ? coefficient + new Array(i - n + 1).join("0")
          : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
          : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
    }

    function formatRounded(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1];
      return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
          : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
          : coefficient + new Array(exponent - coefficient.length + 2).join("0");
    }

    var formatTypes = {
      "%": function(x, p) { return (x * 100).toFixed(p); },
      "b": function(x) { return Math.round(x).toString(2); },
      "c": function(x) { return x + ""; },
      "d": function(x) { return Math.round(x).toString(10); },
      "e": function(x, p) { return x.toExponential(p); },
      "f": function(x, p) { return x.toFixed(p); },
      "g": function(x, p) { return x.toPrecision(p); },
      "o": function(x) { return Math.round(x).toString(8); },
      "p": function(x, p) { return formatRounded(x * 100, p); },
      "r": formatRounded,
      "s": formatPrefixAuto,
      "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
      "x": function(x) { return Math.round(x).toString(16); }
    };

    function identity$1(x) {
      return x;
    }

    var map$1 = Array.prototype.map,
        prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

    function formatLocale(locale) {
      var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map$1.call(locale.grouping, Number), locale.thousands + ""),
          currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
          currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
          decimal = locale.decimal === undefined ? "." : locale.decimal + "",
          numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map$1.call(locale.numerals, String)),
          percent = locale.percent === undefined ? "%" : locale.percent + "",
          minus = locale.minus === undefined ? "-" : locale.minus + "",
          nan = locale.nan === undefined ? "NaN" : locale.nan + "";

      function newFormat(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
            align = specifier.align,
            sign = specifier.sign,
            symbol = specifier.symbol,
            zero = specifier.zero,
            width = specifier.width,
            comma = specifier.comma,
            precision = specifier.precision,
            trim = specifier.trim,
            type = specifier.type;

        // The "n" type is an alias for ",g".
        if (type === "n") comma = true, type = "g";

        // The "" type, and any invalid type, is an alias for ".12~g".
        else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

        // If zero fill is specified, padding goes after sign and before digits.
        if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
            suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
            maybeSuffix = /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision = precision === undefined ? 6
            : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        function format(value) {
          var valuePrefix = prefix,
              valueSuffix = suffix,
              i, n, c;

          if (type === "c") {
            valueSuffix = formatType(value) + valueSuffix;
            value = "";
          } else {
            value = +value;

            // Perform the initial formatting.
            var valueNegative = value < 0;
            value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

            // Trim insignificant zeros.
            if (trim) value = formatTrim(value);

            // If a negative value rounds to zero during formatting, treat as positive.
            if (valueNegative && +value === 0) valueNegative = false;

            // Compute the prefix and suffix.
            valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;

            valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              i = -1, n = value.length;
              while (++i < n) {
                if (c = value.charCodeAt(i), 48 > c || c > 57) {
                  valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
              padding = length < width ? new Array(width - length + 1).join(fill) : "";

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case "<": value = valuePrefix + value + valueSuffix + padding; break;
            case "=": value = valuePrefix + padding + value + valueSuffix; break;
            case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
            default: value = padding + valuePrefix + value + valueSuffix; break;
          }

          return numerals(value);
        }

        format.toString = function() {
          return specifier + "";
        };

        return format;
      }

      function formatPrefix(specifier, value) {
        var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
            e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
            k = Math.pow(10, -e),
            prefix = prefixes[8 + e / 3];
        return function(value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: newFormat,
        formatPrefix: formatPrefix
      };
    }

    var locale;
    var format;
    var formatPrefix;

    defaultLocale({
      decimal: ".",
      thousands: ",",
      grouping: [3],
      currency: ["$", ""],
      minus: "-"
    });

    function defaultLocale(definition) {
      locale = formatLocale(definition);
      format = locale.format;
      formatPrefix = locale.formatPrefix;
      return locale;
    }

    function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    }

    function precisionPrefix(step, value) {
      return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
    }

    function precisionRound(step, max) {
      step = Math.abs(step), max = Math.abs(max) - step;
      return Math.max(0, exponent(max) - exponent(step)) + 1;
    }

    function initRange(domain, range) {
      switch (arguments.length) {
        case 0: break;
        case 1: this.range(domain); break;
        default: this.range(range).domain(domain); break;
      }
      return this;
    }

    var array = Array.prototype;

    var map$2 = array.map;
    var slice = array.slice;

    var implicit = {name: "implicit"};

    function ordinal() {
      var index = map(),
          domain = [],
          range = [],
          unknown = implicit;

      function scale(d) {
        var key = d + "", i = index.get(key);
        if (!i) {
          if (unknown !== implicit) return unknown;
          index.set(key, i = domain.push(d));
        }
        return range[(i - 1) % range.length];
      }

      scale.domain = function(_) {
        if (!arguments.length) return domain.slice();
        domain = [], index = map();
        var i = -1, n = _.length, d, key;
        while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
        return scale;
      };

      scale.range = function(_) {
        return arguments.length ? (range = slice.call(_), scale) : range.slice();
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      scale.copy = function() {
        return ordinal(domain, range).unknown(unknown);
      };

      initRange.apply(scale, arguments);

      return scale;
    }

    function constant$2(x) {
      return function() {
        return x;
      };
    }

    function number(x) {
      return +x;
    }

    var unit = [0, 1];

    function identity$2(x) {
      return x;
    }

    function normalize(a, b) {
      return (b -= (a = +a))
          ? function(x) { return (x - a) / b; }
          : constant$2(isNaN(b) ? NaN : 0.5);
    }

    function clamper(domain) {
      var a = domain[0], b = domain[domain.length - 1], t;
      if (a > b) t = a, a = b, b = t;
      return function(x) { return Math.max(a, Math.min(b, x)); };
    }

    // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
    // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
    function bimap(domain, range, interpolate) {
      var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
      if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
      else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
      return function(x) { return r0(d0(x)); };
    }

    function polymap(domain, range, interpolate) {
      var j = Math.min(domain.length, range.length) - 1,
          d = new Array(j),
          r = new Array(j),
          i = -1;

      // Reverse descending domains.
      if (domain[j] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++i < j) {
        d[i] = normalize(domain[i], domain[i + 1]);
        r[i] = interpolate(range[i], range[i + 1]);
      }

      return function(x) {
        var i = bisectRight(domain, x, 1, j) - 1;
        return r[i](d[i](x));
      };
    }

    function copy(source, target) {
      return target
          .domain(source.domain())
          .range(source.range())
          .interpolate(source.interpolate())
          .clamp(source.clamp())
          .unknown(source.unknown());
    }

    function transformer() {
      var domain = unit,
          range = unit,
          interpolate = interpolateValue,
          transform,
          untransform,
          unknown,
          clamp = identity$2,
          piecewise,
          output,
          input;

      function rescale() {
        piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
        output = input = null;
        return scale;
      }

      function scale(x) {
        return isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
      }

      scale.invert = function(y) {
        return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
      };

      scale.domain = function(_) {
        return arguments.length ? (domain = map$2.call(_, number), clamp === identity$2 || (clamp = clamper(domain)), rescale()) : domain.slice();
      };

      scale.range = function(_) {
        return arguments.length ? (range = slice.call(_), rescale()) : range.slice();
      };

      scale.rangeRound = function(_) {
        return range = slice.call(_), interpolate = interpolateRound, rescale();
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = _ ? clamper(domain) : identity$2, scale) : clamp !== identity$2;
      };

      scale.interpolate = function(_) {
        return arguments.length ? (interpolate = _, rescale()) : interpolate;
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t, u) {
        transform = t, untransform = u;
        return rescale();
      };
    }

    function continuous(transform, untransform) {
      return transformer()(transform, untransform);
    }

    function tickFormat(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
          precision;
      specifier = formatSpecifier(specifier == null ? ",f" : specifier);
      switch (specifier.type) {
        case "s": {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
          return formatPrefix(specifier, value);
        }
        case "":
        case "e":
        case "g":
        case "p":
        case "r": {
          if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
          break;
        }
        case "f":
        case "%": {
          if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
          break;
        }
      }
      return format(specifier);
    }

    function linearish(scale) {
      var domain = scale.domain;

      scale.ticks = function(count) {
        var d = domain();
        return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
      };

      scale.tickFormat = function(count, specifier) {
        var d = domain();
        return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
      };

      scale.nice = function(count) {
        if (count == null) count = 10;

        var d = domain(),
            i0 = 0,
            i1 = d.length - 1,
            start = d[i0],
            stop = d[i1],
            step;

        if (stop < start) {
          step = start, start = stop, stop = step;
          step = i0, i0 = i1, i1 = step;
        }

        step = tickIncrement(start, stop, count);

        if (step > 0) {
          start = Math.floor(start / step) * step;
          stop = Math.ceil(stop / step) * step;
          step = tickIncrement(start, stop, count);
        } else if (step < 0) {
          start = Math.ceil(start * step) / step;
          stop = Math.floor(stop * step) / step;
          step = tickIncrement(start, stop, count);
        }

        if (step > 0) {
          d[i0] = Math.floor(start / step) * step;
          d[i1] = Math.ceil(stop / step) * step;
          domain(d);
        } else if (step < 0) {
          d[i0] = Math.ceil(start * step) / step;
          d[i1] = Math.floor(stop * step) / step;
          domain(d);
        }

        return scale;
      };

      return scale;
    }

    function linear$1() {
      var scale = continuous(identity$2, identity$2);

      scale.copy = function() {
        return copy(scale, linear$1());
      };

      initRange.apply(scale, arguments);

      return linearish(scale);
    }

    function constant$3(x) {
      return function constant() {
        return x;
      };
    }

    var abs = Math.abs;
    var atan2 = Math.atan2;
    var cos = Math.cos;
    var max$1 = Math.max;
    var min = Math.min;
    var sin = Math.sin;
    var sqrt = Math.sqrt;

    var epsilon$1 = 1e-12;
    var pi$1 = Math.PI;
    var halfPi = pi$1 / 2;
    var tau$1 = 2 * pi$1;

    function acos(x) {
      return x > 1 ? 0 : x < -1 ? pi$1 : Math.acos(x);
    }

    function asin(x) {
      return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
    }

    function arcInnerRadius(d) {
      return d.innerRadius;
    }

    function arcOuterRadius(d) {
      return d.outerRadius;
    }

    function arcStartAngle(d) {
      return d.startAngle;
    }

    function arcEndAngle(d) {
      return d.endAngle;
    }

    function arcPadAngle(d) {
      return d && d.padAngle; // Note: optional!
    }

    function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
      var x10 = x1 - x0, y10 = y1 - y0,
          x32 = x3 - x2, y32 = y3 - y2,
          t = y32 * x10 - x32 * y10;
      if (t * t < epsilon$1) return;
      t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t;
      return [x0 + t * x10, y0 + t * y10];
    }

    // Compute perpendicular offset line of length rc.
    // http://mathworld.wolfram.com/Circle-LineIntersection.html
    function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
      var x01 = x0 - x1,
          y01 = y0 - y1,
          lo = (cw ? rc : -rc) / sqrt(x01 * x01 + y01 * y01),
          ox = lo * y01,
          oy = -lo * x01,
          x11 = x0 + ox,
          y11 = y0 + oy,
          x10 = x1 + ox,
          y10 = y1 + oy,
          x00 = (x11 + x10) / 2,
          y00 = (y11 + y10) / 2,
          dx = x10 - x11,
          dy = y10 - y11,
          d2 = dx * dx + dy * dy,
          r = r1 - rc,
          D = x11 * y10 - x10 * y11,
          d = (dy < 0 ? -1 : 1) * sqrt(max$1(0, r * r * d2 - D * D)),
          cx0 = (D * dy - dx * d) / d2,
          cy0 = (-D * dx - dy * d) / d2,
          cx1 = (D * dy + dx * d) / d2,
          cy1 = (-D * dx + dy * d) / d2,
          dx0 = cx0 - x00,
          dy0 = cy0 - y00,
          dx1 = cx1 - x00,
          dy1 = cy1 - y00;

      // Pick the closer of the two intersection points.
      // TODO Is there a faster way to determine which intersection to use?
      if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

      return {
        cx: cx0,
        cy: cy0,
        x01: -ox,
        y01: -oy,
        x11: cx0 * (r1 / r - 1),
        y11: cy0 * (r1 / r - 1)
      };
    }

    function arc() {
      var innerRadius = arcInnerRadius,
          outerRadius = arcOuterRadius,
          cornerRadius = constant$3(0),
          padRadius = null,
          startAngle = arcStartAngle,
          endAngle = arcEndAngle,
          padAngle = arcPadAngle,
          context = null;

      function arc() {
        var buffer,
            r,
            r0 = +innerRadius.apply(this, arguments),
            r1 = +outerRadius.apply(this, arguments),
            a0 = startAngle.apply(this, arguments) - halfPi,
            a1 = endAngle.apply(this, arguments) - halfPi,
            da = abs(a1 - a0),
            cw = a1 > a0;

        if (!context) context = buffer = path();

        // Ensure that the outer radius is always larger than the inner radius.
        if (r1 < r0) r = r1, r1 = r0, r0 = r;

        // Is it a point?
        if (!(r1 > epsilon$1)) context.moveTo(0, 0);

        // Or is it a circle or annulus?
        else if (da > tau$1 - epsilon$1) {
          context.moveTo(r1 * cos(a0), r1 * sin(a0));
          context.arc(0, 0, r1, a0, a1, !cw);
          if (r0 > epsilon$1) {
            context.moveTo(r0 * cos(a1), r0 * sin(a1));
            context.arc(0, 0, r0, a1, a0, cw);
          }
        }

        // Or is it a circular or annular sector?
        else {
          var a01 = a0,
              a11 = a1,
              a00 = a0,
              a10 = a1,
              da0 = da,
              da1 = da,
              ap = padAngle.apply(this, arguments) / 2,
              rp = (ap > epsilon$1) && (padRadius ? +padRadius.apply(this, arguments) : sqrt(r0 * r0 + r1 * r1)),
              rc = min(abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
              rc0 = rc,
              rc1 = rc,
              t0,
              t1;

          // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
          if (rp > epsilon$1) {
            var p0 = asin(rp / r0 * sin(ap)),
                p1 = asin(rp / r1 * sin(ap));
            if ((da0 -= p0 * 2) > epsilon$1) p0 *= (cw ? 1 : -1), a00 += p0, a10 -= p0;
            else da0 = 0, a00 = a10 = (a0 + a1) / 2;
            if ((da1 -= p1 * 2) > epsilon$1) p1 *= (cw ? 1 : -1), a01 += p1, a11 -= p1;
            else da1 = 0, a01 = a11 = (a0 + a1) / 2;
          }

          var x01 = r1 * cos(a01),
              y01 = r1 * sin(a01),
              x10 = r0 * cos(a10),
              y10 = r0 * sin(a10);

          // Apply rounded corners?
          if (rc > epsilon$1) {
            var x11 = r1 * cos(a11),
                y11 = r1 * sin(a11),
                x00 = r0 * cos(a00),
                y00 = r0 * sin(a00),
                oc;

            // Restrict the corner radius according to the sector angle.
            if (da < pi$1 && (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10))) {
              var ax = x01 - oc[0],
                  ay = y01 - oc[1],
                  bx = x11 - oc[0],
                  by = y11 - oc[1],
                  kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt(ax * ax + ay * ay) * sqrt(bx * bx + by * by))) / 2),
                  lc = sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
              rc0 = min(rc, (r0 - lc) / (kc - 1));
              rc1 = min(rc, (r1 - lc) / (kc + 1));
            }
          }

          // Is the sector collapsed to a line?
          if (!(da1 > epsilon$1)) context.moveTo(x01, y01);

          // Does the sector’s outer ring have rounded corners?
          else if (rc1 > epsilon$1) {
            t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
            t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

            context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

            // Have the corners merged?
            if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

            // Otherwise, draw the two corners and the ring.
            else {
              context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
              context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
              context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
            }
          }

          // Or is the outer ring just a circular arc?
          else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

          // Is there no inner ring, and it’s a circular sector?
          // Or perhaps it’s an annular sector collapsed due to padding?
          if (!(r0 > epsilon$1) || !(da0 > epsilon$1)) context.lineTo(x10, y10);

          // Does the sector’s inner ring (or point) have rounded corners?
          else if (rc0 > epsilon$1) {
            t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
            t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

            context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

            // Have the corners merged?
            if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

            // Otherwise, draw the two corners and the ring.
            else {
              context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
              context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
              context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
            }
          }

          // Or is the inner ring just a circular arc?
          else context.arc(0, 0, r0, a10, a00, cw);
        }

        context.closePath();

        if (buffer) return context = null, buffer + "" || null;
      }

      arc.centroid = function() {
        var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
            a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$1 / 2;
        return [cos(a) * r, sin(a) * r];
      };

      arc.innerRadius = function(_) {
        return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$3(+_), arc) : innerRadius;
      };

      arc.outerRadius = function(_) {
        return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$3(+_), arc) : outerRadius;
      };

      arc.cornerRadius = function(_) {
        return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$3(+_), arc) : cornerRadius;
      };

      arc.padRadius = function(_) {
        return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$3(+_), arc) : padRadius;
      };

      arc.startAngle = function(_) {
        return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$3(+_), arc) : startAngle;
      };

      arc.endAngle = function(_) {
        return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$3(+_), arc) : endAngle;
      };

      arc.padAngle = function(_) {
        return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$3(+_), arc) : padAngle;
      };

      arc.context = function(_) {
        return arguments.length ? ((context = _ == null ? null : _), arc) : context;
      };

      return arc;
    }

    function Linear(context) {
      this._context = context;
    }

    Linear.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; // proceed
          default: this._context.lineTo(x, y); break;
        }
      }
    };

    function curveLinear(context) {
      return new Linear(context);
    }

    function x(p) {
      return p[0];
    }

    function y(p) {
      return p[1];
    }

    function line() {
      var x$1 = x,
          y$1 = y,
          defined = constant$3(true),
          context = null,
          curve = curveLinear,
          output = null;

      function line(data) {
        var i,
            n = data.length,
            d,
            defined0 = false,
            buffer;

        if (context == null) output = curve(buffer = path());

        for (i = 0; i <= n; ++i) {
          if (!(i < n && defined(d = data[i], i, data)) === defined0) {
            if (defined0 = !defined0) output.lineStart();
            else output.lineEnd();
          }
          if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
        }

        if (buffer) return output = null, buffer + "" || null;
      }

      line.x = function(_) {
        return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant$3(+_), line) : x$1;
      };

      line.y = function(_) {
        return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant$3(+_), line) : y$1;
      };

      line.defined = function(_) {
        return arguments.length ? (defined = typeof _ === "function" ? _ : constant$3(!!_), line) : defined;
      };

      line.curve = function(_) {
        return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
      };

      line.context = function(_) {
        return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
      };

      return line;
    }

    var curveRadialLinear = curveRadial(curveLinear);

    function Radial(curve) {
      this._curve = curve;
    }

    Radial.prototype = {
      areaStart: function() {
        this._curve.areaStart();
      },
      areaEnd: function() {
        this._curve.areaEnd();
      },
      lineStart: function() {
        this._curve.lineStart();
      },
      lineEnd: function() {
        this._curve.lineEnd();
      },
      point: function(a, r) {
        this._curve.point(r * Math.sin(a), r * -Math.cos(a));
      }
    };

    function curveRadial(curve) {

      function radial(context) {
        return new Radial(curve(context));
      }

      radial._curve = curve;

      return radial;
    }

    function lineRadial(l) {
      var c = l.curve;

      l.angle = l.x, delete l.x;
      l.radius = l.y, delete l.y;

      l.curve = function(_) {
        return arguments.length ? c(curveRadial(_)) : c()._curve;
      };

      return l;
    }

    function lineRadial$1() {
      return lineRadial(line().curve(curveRadialLinear));
    }

    function point(that, x, y) {
      that._context.bezierCurveTo(
        that._x1 + that._k * (that._x2 - that._x0),
        that._y1 + that._k * (that._y2 - that._y0),
        that._x2 + that._k * (that._x1 - x),
        that._y2 + that._k * (that._y1 - y),
        that._x2,
        that._y2
      );
    }

    function Cardinal(context, tension) {
      this._context = context;
      this._k = (1 - tension) / 6;
    }

    Cardinal.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._x2 =
        this._y0 = this._y1 = this._y2 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 2: this._context.lineTo(this._x2, this._y2); break;
          case 3: point(this, this._x1, this._y1); break;
        }
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; this._x1 = x, this._y1 = y; break;
          case 2: this._point = 3; // proceed
          default: point(this, x, y); break;
        }
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
      }
    };

    var cardinal = (function custom(tension) {

      function cardinal(context) {
        return new Cardinal(context, tension);
      }

      cardinal.tension = function(tension) {
        return custom(+tension);
      };

      return cardinal;
    })(0);

    /* src/flower/CanvasVisual.svelte generated by Svelte v3.16.7 */
    const file = "src/flower/CanvasVisual.svelte";

    function create_fragment(ctx) {
    	let canvas_1;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "class", "canvas-visual svelte-qja14o");
    			add_location(canvas_1, file, 57, 0, 1509);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[14](canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[14](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const canvasScaleFactor = 2;

    function instance($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { offset } = $$props;
    	let { data } = $$props;
    	let { years } = $$props;
    	let { scYearColor } = $$props;
    	let { scCountryAngle } = $$props;
    	let { scYearRadius } = $$props;
    	let { scMortRate } = $$props;
    	let { selectedIso } = $$props;
    	let canvas, ctx;

    	function init() {
    		$$invalidate(0, canvas.width = canvasScaleFactor * width, canvas);
    		$$invalidate(0, canvas.height = canvasScaleFactor * height, canvas);
    		$$invalidate(0, canvas.style.width = `${width}px`, canvas);
    		$$invalidate(0, canvas.style.height = `${height}px`, canvas);
    		$$invalidate(0, canvas.style.margin = `${offset / 2}px`, canvas);
    		ctx.scale(canvasScaleFactor, canvasScaleFactor);
    		ctx.translate(width / 2, height / 2);
    		$$invalidate(11, ctx.globalCompositeOperation = "luminosity", ctx);
    	}

    	function draw(width, height, selectedIso) {
    		ctx.clearRect(-width / 2, -height / 2, width, height);
    		$$invalidate(11, ctx.globalAlpha = selectedIso ? 0.1 : 0.4, ctx);

    		years.forEach(year => {
    			$$invalidate(11, ctx.fillStyle = scYearColor(year), ctx);

    			data.forEach(d => {
    				const yearData = d.dataArr.find(d => d.year === year);
    				const x = Math.sin(Math.PI - scCountryAngle(d.iso)) * scYearRadius(year);
    				const y = Math.cos(Math.PI - scCountryAngle(d.iso)) * scYearRadius(year);
    				ctx.beginPath();
    				ctx.arc(x, y, scMortRate(yearData.value), 0, 2 * Math.PI);
    				ctx.fill();
    			});
    		});
    	}

    	onMount(() => {
    		$$invalidate(11, ctx = canvas.getContext("2d"));
    	});

    	const writable_props = [
    		"width",
    		"height",
    		"offset",
    		"data",
    		"years",
    		"scYearColor",
    		"scCountryAngle",
    		"scYearRadius",
    		"scMortRate",
    		"selectedIso"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CanvasVisual> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, canvas = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    		if ("offset" in $$props) $$invalidate(3, offset = $$props.offset);
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("years" in $$props) $$invalidate(5, years = $$props.years);
    		if ("scYearColor" in $$props) $$invalidate(6, scYearColor = $$props.scYearColor);
    		if ("scCountryAngle" in $$props) $$invalidate(7, scCountryAngle = $$props.scCountryAngle);
    		if ("scYearRadius" in $$props) $$invalidate(8, scYearRadius = $$props.scYearRadius);
    		if ("scMortRate" in $$props) $$invalidate(9, scMortRate = $$props.scMortRate);
    		if ("selectedIso" in $$props) $$invalidate(10, selectedIso = $$props.selectedIso);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			offset,
    			data,
    			years,
    			scYearColor,
    			scCountryAngle,
    			scYearRadius,
    			scMortRate,
    			selectedIso,
    			canvas,
    			ctx
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    		if ("offset" in $$props) $$invalidate(3, offset = $$props.offset);
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("years" in $$props) $$invalidate(5, years = $$props.years);
    		if ("scYearColor" in $$props) $$invalidate(6, scYearColor = $$props.scYearColor);
    		if ("scCountryAngle" in $$props) $$invalidate(7, scCountryAngle = $$props.scCountryAngle);
    		if ("scYearRadius" in $$props) $$invalidate(8, scYearRadius = $$props.scYearRadius);
    		if ("scMortRate" in $$props) $$invalidate(9, scMortRate = $$props.scMortRate);
    		if ("selectedIso" in $$props) $$invalidate(10, selectedIso = $$props.selectedIso);
    		if ("canvas" in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ("ctx" in $$props) $$invalidate(11, ctx = $$props.ctx);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*ctx, width, height*/ 2054) {
    			 if (ctx) init();
    		}

    		if ($$self.$$.dirty & /*ctx, data, width, height, selectedIso*/ 3094) {
    			 if (ctx && data) draw(width, height, selectedIso);
    		}
    	};

    	return [
    		canvas,
    		width,
    		height,
    		offset,
    		data,
    		years,
    		scYearColor,
    		scCountryAngle,
    		scYearRadius,
    		scMortRate,
    		selectedIso,
    		ctx,
    		init,
    		draw,
    		canvas_1_binding
    	];
    }

    class CanvasVisual extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			width: 1,
    			height: 2,
    			offset: 3,
    			data: 4,
    			years: 5,
    			scYearColor: 6,
    			scCountryAngle: 7,
    			scYearRadius: 8,
    			scMortRate: 9,
    			selectedIso: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CanvasVisual",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[1] === undefined && !("width" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[2] === undefined && !("height" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'height'");
    		}

    		if (/*offset*/ ctx[3] === undefined && !("offset" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'offset'");
    		}

    		if (/*data*/ ctx[4] === undefined && !("data" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'data'");
    		}

    		if (/*years*/ ctx[5] === undefined && !("years" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'years'");
    		}

    		if (/*scYearColor*/ ctx[6] === undefined && !("scYearColor" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'scYearColor'");
    		}

    		if (/*scCountryAngle*/ ctx[7] === undefined && !("scCountryAngle" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'scCountryAngle'");
    		}

    		if (/*scYearRadius*/ ctx[8] === undefined && !("scYearRadius" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'scYearRadius'");
    		}

    		if (/*scMortRate*/ ctx[9] === undefined && !("scMortRate" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'scMortRate'");
    		}

    		if (/*selectedIso*/ ctx[10] === undefined && !("selectedIso" in props)) {
    			console.warn("<CanvasVisual> was created without expected prop 'selectedIso'");
    		}
    	}

    	get width() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get years() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set years(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scYearColor() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scYearColor(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scCountryAngle() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scCountryAngle(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scYearRadius() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scYearRadius(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scMortRate() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scMortRate(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIso() {
    		throw new Error("<CanvasVisual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIso(value) {
    		throw new Error("<CanvasVisual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/Defs.svelte generated by Svelte v3.16.7 */

    const file$1 = "src/flower/Defs.svelte";

    function create_fragment$1(ctx) {
    	let defs;
    	let radialGradient;
    	let stop0;
    	let stop1;
    	let stop1_offset_value;
    	let stop2;
    	let stop2_offset_value;
    	let stop3;
    	let radialGradient_r_value;
    	let filter;
    	let feDropShadow;

    	const block = {
    		c: function create() {
    			defs = svg_element("defs");
    			radialGradient = svg_element("radialGradient");
    			stop0 = svg_element("stop");
    			stop1 = svg_element("stop");
    			stop2 = svg_element("stop");
    			stop3 = svg_element("stop");
    			filter = svg_element("filter");
    			feDropShadow = svg_element("feDropShadow");
    			attr_dev(stop0, "offset", "0");
    			attr_dev(stop0, "stop-color", "#1C0118");
    			add_location(stop0, file$1, 11, 4, 287);
    			attr_dev(stop1, "offset", stop1_offset_value = /*scReduction*/ ctx[0](0) / /*scReduction*/ ctx[0].range()[1]);
    			attr_dev(stop1, "stop-color", "#1C0118");
    			add_location(stop1, file$1, 13, 4, 347);
    			attr_dev(stop2, "offset", stop2_offset_value = /*scReduction*/ ctx[0](0) / /*scReduction*/ ctx[0].range()[1]);
    			attr_dev(stop2, "stop-color", "#F40000");
    			add_location(stop2, file$1, 15, 4, 445);
    			attr_dev(stop3, "offset", "1");
    			attr_dev(stop3, "stop-color", "#F40000");
    			add_location(stop3, file$1, 17, 4, 543);
    			attr_dev(radialGradient, "id", "reduction-gradient");
    			attr_dev(radialGradient, "gradientUnits", "userSpaceOnUse");
    			attr_dev(radialGradient, "cx", "0");
    			attr_dev(radialGradient, "cy", "0");
    			attr_dev(radialGradient, "r", radialGradient_r_value = /*scReduction*/ ctx[0].range()[1]);
    			add_location(radialGradient, file$1, 6, 2, 98);
    			attr_dev(feDropShadow, "dx", "0");
    			attr_dev(feDropShadow, "dy", "0");
    			attr_dev(feDropShadow, "stdDeviation", "7");
    			attr_dev(feDropShadow, "flood-color", "#A6D9F7");
    			add_location(feDropShadow, file$1, 23, 4, 701);
    			attr_dev(filter, "id", "reduction-shadow");
    			add_location(filter, file$1, 22, 2, 666);
    			add_location(defs, file$1, 4, 0, 46);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, defs, anchor);
    			append_dev(defs, radialGradient);
    			append_dev(radialGradient, stop0);
    			append_dev(radialGradient, stop1);
    			append_dev(radialGradient, stop2);
    			append_dev(radialGradient, stop3);
    			append_dev(defs, filter);
    			append_dev(filter, feDropShadow);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*scReduction*/ 1 && stop1_offset_value !== (stop1_offset_value = /*scReduction*/ ctx[0](0) / /*scReduction*/ ctx[0].range()[1])) {
    				attr_dev(stop1, "offset", stop1_offset_value);
    			}

    			if (dirty & /*scReduction*/ 1 && stop2_offset_value !== (stop2_offset_value = /*scReduction*/ ctx[0](0) / /*scReduction*/ ctx[0].range()[1])) {
    				attr_dev(stop2, "offset", stop2_offset_value);
    			}

    			if (dirty & /*scReduction*/ 1 && radialGradient_r_value !== (radialGradient_r_value = /*scReduction*/ ctx[0].range()[1])) {
    				attr_dev(radialGradient, "r", radialGradient_r_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(defs);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { scReduction } = $$props;
    	const writable_props = ["scReduction"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Defs> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("scReduction" in $$props) $$invalidate(0, scReduction = $$props.scReduction);
    	};

    	$$self.$capture_state = () => {
    		return { scReduction };
    	};

    	$$self.$inject_state = $$props => {
    		if ("scReduction" in $$props) $$invalidate(0, scReduction = $$props.scReduction);
    	};

    	return [scReduction];
    }

    class Defs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { scReduction: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Defs",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*scReduction*/ ctx[0] === undefined && !("scReduction" in props)) {
    			console.warn("<Defs> was created without expected prop 'scReduction'");
    		}
    	}

    	get scReduction() {
    		throw new Error("<Defs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scReduction(value) {
    		throw new Error("<Defs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/Continents.svelte generated by Svelte v3.16.7 */
    const file$2 = "src/flower/Continents.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (36:0) {#if data}
    function create_if_block(ctx) {
    	let g;
    	let g_transform_value;
    	let each_value = /*data*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "transform", g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")");
    			add_location(g, file$2, 36, 2, 855);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, labelArc, arc*/ 28) {
    				each_value = /*data*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*width, height*/ 3 && g_transform_value !== (g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(36:0) {#if data}",
    		ctx
    	});

    	return block;
    }

    // (38:4) {#each data as d}
    function create_each_block(ctx) {
    	let path0;
    	let path0_d_value;
    	let path1;
    	let path1_id_value;
    	let path1_d_value;
    	let text_1;
    	let textPath;
    	let t_value = /*d*/ ctx[8].continent + "";
    	let t;
    	let textPath_href_value;

    	const block = {
    		c: function create() {
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			text_1 = svg_element("text");
    			textPath = svg_element("textPath");
    			t = text(t_value);
    			attr_dev(path0, "class", "continent-arc svelte-gwbpyp");
    			attr_dev(path0, "d", path0_d_value = /*arc*/ ctx[3](/*d*/ ctx[8]));
    			add_location(path0, file$2, 38, 6, 935);
    			attr_dev(path1, "class", "continent-label-arc svelte-gwbpyp");
    			attr_dev(path1, "id", path1_id_value = "continent-label-arc-" + /*d*/ ctx[8].continent);
    			attr_dev(path1, "d", path1_d_value = /*labelArc*/ ctx[4](/*d*/ ctx[8]));
    			add_location(path1, file$2, 39, 6, 988);
    			attr_dev(textPath, "class", "continent-label svelte-gwbpyp");
    			attr_dev(textPath, "href", textPath_href_value = "#continent-label-arc-" + /*d*/ ctx[8].continent);
    			attr_dev(textPath, "startOffset", "25%");
    			add_location(textPath, file$2, 41, 8, 1106);
    			add_location(text_1, file$2, 40, 6, 1091);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path0, anchor);
    			insert_dev(target, path1, anchor);
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, textPath);
    			append_dev(textPath, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*arc, data*/ 12 && path0_d_value !== (path0_d_value = /*arc*/ ctx[3](/*d*/ ctx[8]))) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*data*/ 4 && path1_id_value !== (path1_id_value = "continent-label-arc-" + /*d*/ ctx[8].continent)) {
    				attr_dev(path1, "id", path1_id_value);
    			}

    			if (dirty & /*labelArc, data*/ 20 && path1_d_value !== (path1_d_value = /*labelArc*/ ctx[4](/*d*/ ctx[8]))) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*data*/ 4 && t_value !== (t_value = /*d*/ ctx[8].continent + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 4 && textPath_href_value !== (textPath_href_value = "#continent-label-arc-" + /*d*/ ctx[8].continent)) {
    				attr_dev(textPath, "href", textPath_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path0);
    			if (detaching) detach_dev(path1);
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(38:4) {#each data as d}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*data*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const shrinkFactor = 0.62;
    const lineThicknessFactor = 1.05;
    const labelOffsetFactor = 1.1;

    function instance$2($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { data } = $$props;
    	let { years } = $$props;
    	let { scYearRadius } = $$props;
    	let arc$1, labelArc;

    	function defineArcs() {
    		const innerAreaRadius = scYearRadius(years[0]) * shrinkFactor;
    		$$invalidate(3, arc$1 = arc().startAngle(d => d.startAngle).endAngle(d => d.endAngle).innerRadius(innerAreaRadius).outerRadius(innerAreaRadius * lineThicknessFactor).cornerRadius(7));
    		$$invalidate(4, labelArc = arc().startAngle(d => d.startAngle).endAngle(d => d.endAngle).innerRadius(innerAreaRadius * labelOffsetFactor).outerRadius(innerAreaRadius * labelOffsetFactor));
    	}

    	const writable_props = ["width", "height", "data", "years", "scYearRadius"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Continents> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("years" in $$props) $$invalidate(5, years = $$props.years);
    		if ("scYearRadius" in $$props) $$invalidate(6, scYearRadius = $$props.scYearRadius);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			data,
    			years,
    			scYearRadius,
    			arc: arc$1,
    			labelArc
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("years" in $$props) $$invalidate(5, years = $$props.years);
    		if ("scYearRadius" in $$props) $$invalidate(6, scYearRadius = $$props.scYearRadius);
    		if ("arc" in $$props) $$invalidate(3, arc$1 = $$props.arc);
    		if ("labelArc" in $$props) $$invalidate(4, labelArc = $$props.labelArc);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*scYearRadius*/ 64) {
    			 if (scYearRadius) defineArcs();
    		}
    	};

    	return [width, height, data, arc$1, labelArc, years, scYearRadius];
    }

    class Continents extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			width: 0,
    			height: 1,
    			data: 2,
    			years: 5,
    			scYearRadius: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Continents",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[0] === undefined && !("width" in props)) {
    			console.warn("<Continents> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<Continents> was created without expected prop 'height'");
    		}

    		if (/*data*/ ctx[2] === undefined && !("data" in props)) {
    			console.warn("<Continents> was created without expected prop 'data'");
    		}

    		if (/*years*/ ctx[5] === undefined && !("years" in props)) {
    			console.warn("<Continents> was created without expected prop 'years'");
    		}

    		if (/*scYearRadius*/ ctx[6] === undefined && !("scYearRadius" in props)) {
    			console.warn("<Continents> was created without expected prop 'scYearRadius'");
    		}
    	}

    	get width() {
    		throw new Error("<Continents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Continents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Continents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Continents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Continents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Continents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get years() {
    		throw new Error("<Continents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set years(value) {
    		throw new Error("<Continents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scYearRadius() {
    		throw new Error("<Continents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scYearRadius(value) {
    		throw new Error("<Continents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/ReductionPath.svelte generated by Svelte v3.16.7 */
    const file$3 = "src/flower/ReductionPath.svelte";

    function create_fragment$3(ctx) {
    	let g;
    	let circle;
    	let circle_r_value;
    	let path_1;
    	let path_1_d_value;
    	let g_transform_value;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			circle = svg_element("circle");
    			path_1 = svg_element("path");
    			attr_dev(circle, "cx", "0");
    			attr_dev(circle, "cy", "0");
    			attr_dev(circle, "r", circle_r_value = /*scReduction*/ ctx[3](0));
    			attr_dev(circle, "stroke", "none");
    			attr_dev(circle, "fill", "#A6D9F7");
    			attr_dev(circle, "filter", "url(#reduction-shadow)");
    			add_location(circle, file$3, 18, 2, 384);
    			attr_dev(path_1, "d", path_1_d_value = /*path*/ ctx[4](/*data*/ ctx[2]));
    			attr_dev(path_1, "stroke", "none");
    			attr_dev(path_1, "fill", "url(#reduction-gradient)");
    			add_location(path_1, file$3, 24, 2, 548);
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")");
    			add_location(g, file$3, 17, 0, 330);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, circle);
    			append_dev(g, path_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*scReduction*/ 8 && circle_r_value !== (circle_r_value = /*scReduction*/ ctx[3](0))) {
    				attr_dev(circle, "r", circle_r_value);
    			}

    			if (dirty & /*path, data*/ 20 && path_1_d_value !== (path_1_d_value = /*path*/ ctx[4](/*data*/ ctx[2]))) {
    				attr_dev(path_1, "d", path_1_d_value);
    			}

    			if (dirty & /*width, height*/ 3 && g_transform_value !== (g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { data } = $$props;
    	let { scCountryAngle } = $$props;
    	let { scReduction } = $$props;
    	const writable_props = ["width", "height", "data", "scCountryAngle", "scReduction"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ReductionPath> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("scReduction" in $$props) $$invalidate(3, scReduction = $$props.scReduction);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			data,
    			scCountryAngle,
    			scReduction,
    			path
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("scReduction" in $$props) $$invalidate(3, scReduction = $$props.scReduction);
    		if ("path" in $$props) $$invalidate(4, path = $$props.path);
    	};

    	let path;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*scCountryAngle, scReduction*/ 40) {
    			 $$invalidate(4, path = lineRadial$1().angle(d => scCountryAngle(d.iso)).radius(d => scReduction(d.reduction)).curve(cardinal));
    		}
    	};

    	return [width, height, data, scReduction, path, scCountryAngle];
    }

    class ReductionPath extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			width: 0,
    			height: 1,
    			data: 2,
    			scCountryAngle: 5,
    			scReduction: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReductionPath",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[0] === undefined && !("width" in props)) {
    			console.warn("<ReductionPath> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<ReductionPath> was created without expected prop 'height'");
    		}

    		if (/*data*/ ctx[2] === undefined && !("data" in props)) {
    			console.warn("<ReductionPath> was created without expected prop 'data'");
    		}

    		if (/*scCountryAngle*/ ctx[5] === undefined && !("scCountryAngle" in props)) {
    			console.warn("<ReductionPath> was created without expected prop 'scCountryAngle'");
    		}

    		if (/*scReduction*/ ctx[3] === undefined && !("scReduction" in props)) {
    			console.warn("<ReductionPath> was created without expected prop 'scReduction'");
    		}
    	}

    	get width() {
    		throw new Error("<ReductionPath>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<ReductionPath>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<ReductionPath>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<ReductionPath>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<ReductionPath>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ReductionPath>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scCountryAngle() {
    		throw new Error("<ReductionPath>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scCountryAngle(value) {
    		throw new Error("<ReductionPath>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scReduction() {
    		throw new Error("<ReductionPath>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scReduction(value) {
    		throw new Error("<ReductionPath>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/SVGVisualBelow.svelte generated by Svelte v3.16.7 */
    const file$4 = "src/flower/SVGVisualBelow.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let current;

    	const defs = new Defs({
    			props: { scReduction: /*scReduction*/ ctx[7] },
    			$$inline: true
    		});

    	const reductionpath = new ReductionPath({
    			props: {
    				width: /*width*/ ctx[0],
    				height: /*height*/ ctx[1],
    				data: /*data*/ ctx[3],
    				scCountryAngle: /*scCountryAngle*/ ctx[5],
    				scReduction: /*scReduction*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const continents = new Continents({
    			props: {
    				width: /*width*/ ctx[0],
    				height: /*height*/ ctx[1],
    				data: /*continentsData*/ ctx[8],
    				years: /*years*/ ctx[4],
    				scYearRadius: /*scYearRadius*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			create_component(defs.$$.fragment);
    			create_component(reductionpath.$$.fragment);
    			create_component(continents.$$.fragment);
    			attr_dev(svg, "class", "svg-visual svelte-x6infa");
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			set_style(svg, "margin", /*offset*/ ctx[2] / 2 + "px");
    			add_location(svg, file$4, 33, 0, 873);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			mount_component(defs, svg, null);
    			mount_component(reductionpath, svg, null);
    			mount_component(continents, svg, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const defs_changes = {};
    			if (dirty & /*scReduction*/ 128) defs_changes.scReduction = /*scReduction*/ ctx[7];
    			defs.$set(defs_changes);
    			const reductionpath_changes = {};
    			if (dirty & /*width*/ 1) reductionpath_changes.width = /*width*/ ctx[0];
    			if (dirty & /*height*/ 2) reductionpath_changes.height = /*height*/ ctx[1];
    			if (dirty & /*data*/ 8) reductionpath_changes.data = /*data*/ ctx[3];
    			if (dirty & /*scCountryAngle*/ 32) reductionpath_changes.scCountryAngle = /*scCountryAngle*/ ctx[5];
    			if (dirty & /*scReduction*/ 128) reductionpath_changes.scReduction = /*scReduction*/ ctx[7];
    			reductionpath.$set(reductionpath_changes);
    			const continents_changes = {};
    			if (dirty & /*width*/ 1) continents_changes.width = /*width*/ ctx[0];
    			if (dirty & /*height*/ 2) continents_changes.height = /*height*/ ctx[1];
    			if (dirty & /*continentsData*/ 256) continents_changes.data = /*continentsData*/ ctx[8];
    			if (dirty & /*years*/ 16) continents_changes.years = /*years*/ ctx[4];
    			if (dirty & /*scYearRadius*/ 64) continents_changes.scYearRadius = /*scYearRadius*/ ctx[6];
    			continents.$set(continents_changes);

    			if (!current || dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (!current || dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (!current || dirty & /*offset*/ 4) {
    				set_style(svg, "margin", /*offset*/ ctx[2] / 2 + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(defs.$$.fragment, local);
    			transition_in(reductionpath.$$.fragment, local);
    			transition_in(continents.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(defs.$$.fragment, local);
    			transition_out(reductionpath.$$.fragment, local);
    			transition_out(continents.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_component(defs);
    			destroy_component(reductionpath);
    			destroy_component(continents);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { offset } = $$props;
    	let { data } = $$props;
    	let { years } = $$props;
    	let { scCountryAngle } = $$props;
    	let { scYearRadius } = $$props;
    	let { scReduction } = $$props;
    	let { selectedIso } = $$props;
    	let continentsData;

    	function loadContinentsData() {
    		const uniqueContinents = [...new Set(data.map(d => d.continent))];

    		$$invalidate(8, continentsData = uniqueContinents.map(continent => {
    			const raw = data.map(d => d.continent);

    			return {
    				startAngle: scCountryAngle(data[raw.indexOf(continent)].iso),
    				endAngle: scCountryAngle(data[raw.lastIndexOf(continent)].iso),
    				continent
    			};
    		}));
    	}

    	const writable_props = [
    		"width",
    		"height",
    		"offset",
    		"data",
    		"years",
    		"scCountryAngle",
    		"scYearRadius",
    		"scReduction",
    		"selectedIso"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SVGVisualBelow> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("offset" in $$props) $$invalidate(2, offset = $$props.offset);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("years" in $$props) $$invalidate(4, years = $$props.years);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("scYearRadius" in $$props) $$invalidate(6, scYearRadius = $$props.scYearRadius);
    		if ("scReduction" in $$props) $$invalidate(7, scReduction = $$props.scReduction);
    		if ("selectedIso" in $$props) $$invalidate(9, selectedIso = $$props.selectedIso);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			offset,
    			data,
    			years,
    			scCountryAngle,
    			scYearRadius,
    			scReduction,
    			selectedIso,
    			continentsData
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("offset" in $$props) $$invalidate(2, offset = $$props.offset);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("years" in $$props) $$invalidate(4, years = $$props.years);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("scYearRadius" in $$props) $$invalidate(6, scYearRadius = $$props.scYearRadius);
    		if ("scReduction" in $$props) $$invalidate(7, scReduction = $$props.scReduction);
    		if ("selectedIso" in $$props) $$invalidate(9, selectedIso = $$props.selectedIso);
    		if ("continentsData" in $$props) $$invalidate(8, continentsData = $$props.continentsData);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 8) {
    			 if (data) loadContinentsData();
    		}
    	};

    	return [
    		width,
    		height,
    		offset,
    		data,
    		years,
    		scCountryAngle,
    		scYearRadius,
    		scReduction,
    		continentsData,
    		selectedIso
    	];
    }

    class SVGVisualBelow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			width: 0,
    			height: 1,
    			offset: 2,
    			data: 3,
    			years: 4,
    			scCountryAngle: 5,
    			scYearRadius: 6,
    			scReduction: 7,
    			selectedIso: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SVGVisualBelow",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[0] === undefined && !("width" in props)) {
    			console.warn("<SVGVisualBelow> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<SVGVisualBelow> was created without expected prop 'height'");
    		}

    		if (/*offset*/ ctx[2] === undefined && !("offset" in props)) {
    			console.warn("<SVGVisualBelow> was created without expected prop 'offset'");
    		}

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<SVGVisualBelow> was created without expected prop 'data'");
    		}

    		if (/*years*/ ctx[4] === undefined && !("years" in props)) {
    			console.warn("<SVGVisualBelow> was created without expected prop 'years'");
    		}

    		if (/*scCountryAngle*/ ctx[5] === undefined && !("scCountryAngle" in props)) {
    			console.warn("<SVGVisualBelow> was created without expected prop 'scCountryAngle'");
    		}

    		if (/*scYearRadius*/ ctx[6] === undefined && !("scYearRadius" in props)) {
    			console.warn("<SVGVisualBelow> was created without expected prop 'scYearRadius'");
    		}

    		if (/*scReduction*/ ctx[7] === undefined && !("scReduction" in props)) {
    			console.warn("<SVGVisualBelow> was created without expected prop 'scReduction'");
    		}

    		if (/*selectedIso*/ ctx[9] === undefined && !("selectedIso" in props)) {
    			console.warn("<SVGVisualBelow> was created without expected prop 'selectedIso'");
    		}
    	}

    	get width() {
    		throw new Error("<SVGVisualBelow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<SVGVisualBelow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<SVGVisualBelow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<SVGVisualBelow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<SVGVisualBelow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<SVGVisualBelow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<SVGVisualBelow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<SVGVisualBelow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get years() {
    		throw new Error("<SVGVisualBelow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set years(value) {
    		throw new Error("<SVGVisualBelow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scCountryAngle() {
    		throw new Error("<SVGVisualBelow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scCountryAngle(value) {
    		throw new Error("<SVGVisualBelow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scYearRadius() {
    		throw new Error("<SVGVisualBelow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scYearRadius(value) {
    		throw new Error("<SVGVisualBelow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scReduction() {
    		throw new Error("<SVGVisualBelow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scReduction(value) {
    		throw new Error("<SVGVisualBelow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIso() {
    		throw new Error("<SVGVisualBelow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIso(value) {
    		throw new Error("<SVGVisualBelow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/YearLabels.svelte generated by Svelte v3.16.7 */

    const file$5 = "src/flower/YearLabels.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (9:2) {#each years as year}
    function create_each_block$1(ctx) {
    	let text_1;
    	let t_value = /*year*/ ctx[4] + "";
    	let t;
    	let text_1_transform_value;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(text_1, "transform", text_1_transform_value = "translate(0 " + (-/*scYearRadius*/ ctx[3](/*year*/ ctx[4]) + Math.min(/*width*/ ctx[0], /*height*/ ctx[1]) / 22) + ")");
    			attr_dev(text_1, "class", "svelte-anfrwp");
    			add_location(text_1, file$5, 9, 4, 188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*years*/ 4 && t_value !== (t_value = /*year*/ ctx[4] + "")) set_data_dev(t, t_value);

    			if (dirty & /*scYearRadius, years, width, height*/ 15 && text_1_transform_value !== (text_1_transform_value = "translate(0 " + (-/*scYearRadius*/ ctx[3](/*year*/ ctx[4]) + Math.min(/*width*/ ctx[0], /*height*/ ctx[1]) / 22) + ")")) {
    				attr_dev(text_1, "transform", text_1_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(9:2) {#each years as year}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let g;
    	let g_transform_value;
    	let each_value = /*years*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "transform", g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")");
    			add_location(g, file$5, 7, 0, 108);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*scYearRadius, years, Math, width, height*/ 15) {
    				each_value = /*years*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*width, height*/ 3 && g_transform_value !== (g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { years } = $$props;
    	let { scYearRadius } = $$props;
    	const writable_props = ["width", "height", "years", "scYearRadius"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<YearLabels> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("years" in $$props) $$invalidate(2, years = $$props.years);
    		if ("scYearRadius" in $$props) $$invalidate(3, scYearRadius = $$props.scYearRadius);
    	};

    	$$self.$capture_state = () => {
    		return { width, height, years, scYearRadius };
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("years" in $$props) $$invalidate(2, years = $$props.years);
    		if ("scYearRadius" in $$props) $$invalidate(3, scYearRadius = $$props.scYearRadius);
    	};

    	return [width, height, years, scYearRadius];
    }

    class YearLabels extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			width: 0,
    			height: 1,
    			years: 2,
    			scYearRadius: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "YearLabels",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[0] === undefined && !("width" in props)) {
    			console.warn("<YearLabels> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<YearLabels> was created without expected prop 'height'");
    		}

    		if (/*years*/ ctx[2] === undefined && !("years" in props)) {
    			console.warn("<YearLabels> was created without expected prop 'years'");
    		}

    		if (/*scYearRadius*/ ctx[3] === undefined && !("scYearRadius" in props)) {
    			console.warn("<YearLabels> was created without expected prop 'scYearRadius'");
    		}
    	}

    	get width() {
    		throw new Error("<YearLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<YearLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<YearLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<YearLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get years() {
    		throw new Error("<YearLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set years(value) {
    		throw new Error("<YearLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scYearRadius() {
    		throw new Error("<YearLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scYearRadius(value) {
    		throw new Error("<YearLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/CentralLineChart.svelte generated by Svelte v3.16.7 */
    const file$6 = "src/flower/CentralLineChart.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (46:0) {#if (data && selectedIso)}
    function create_if_block$1(ctx) {
    	let g;
    	let text_1;
    	let t;
    	let text_1_transform_value;
    	let path;
    	let path_d_value;
    	let line_1;
    	let line_1_x__value;
    	let line_1_y__value;
    	let line_1_x__value_1;
    	let line_1_y__value_1;
    	let g_transform_value;
    	let each_value_1 = /*yLabels*/ ctx[8];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*xScale*/ ctx[5].domain();
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			text_1 = svg_element("text");
    			t = text("deaths / 1000 births");
    			path = svg_element("path");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			line_1 = svg_element("line");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(text_1, "class", "title svelte-wfvw11");
    			attr_dev(text_1, "transform", text_1_transform_value = "translate(0 " + /*yScale*/ ctx[6].range()[1] * 1.4 + ")");
    			add_location(text_1, file$6, 47, 4, 1430);
    			attr_dev(path, "d", path_d_value = /*line*/ ctx[7](/*dataArr*/ ctx[4]));
    			attr_dev(path, "stroke", "white");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "fill", "none");
    			add_location(path, file$6, 49, 4, 1543);
    			attr_dev(line_1, "x1", line_1_x__value = /*xScale*/ ctx[5].range()[0]);
    			attr_dev(line_1, "y1", line_1_y__value = /*yScale*/ ctx[6].range()[0]);
    			attr_dev(line_1, "x2", line_1_x__value_1 = /*xScale*/ ctx[5].range()[1]);
    			attr_dev(line_1, "y2", line_1_y__value_1 = /*yScale*/ ctx[6].range()[0]);
    			attr_dev(line_1, "class", "svelte-wfvw11");
    			add_location(line_1, file$6, 58, 4, 1845);
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")");
    			add_location(g, file$6, 46, 2, 1374);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, text_1);
    			append_dev(text_1, t);
    			append_dev(g, path);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(g, null);
    			}

    			append_dev(g, line_1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*yScale*/ 64 && text_1_transform_value !== (text_1_transform_value = "translate(0 " + /*yScale*/ ctx[6].range()[1] * 1.4 + ")")) {
    				attr_dev(text_1, "transform", text_1_transform_value);
    			}

    			if (dirty & /*line, dataArr*/ 144 && path_d_value !== (path_d_value = /*line*/ ctx[7](/*dataArr*/ ctx[4]))) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (dirty & /*yLabels*/ 256) {
    				each_value_1 = /*yLabels*/ ctx[8];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(g, line_1);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*xScale*/ 32 && line_1_x__value !== (line_1_x__value = /*xScale*/ ctx[5].range()[0])) {
    				attr_dev(line_1, "x1", line_1_x__value);
    			}

    			if (dirty & /*yScale*/ 64 && line_1_y__value !== (line_1_y__value = /*yScale*/ ctx[6].range()[0])) {
    				attr_dev(line_1, "y1", line_1_y__value);
    			}

    			if (dirty & /*xScale*/ 32 && line_1_x__value_1 !== (line_1_x__value_1 = /*xScale*/ ctx[5].range()[1])) {
    				attr_dev(line_1, "x2", line_1_x__value_1);
    			}

    			if (dirty & /*yScale*/ 64 && line_1_y__value_1 !== (line_1_y__value_1 = /*yScale*/ ctx[6].range()[0])) {
    				attr_dev(line_1, "y2", line_1_y__value_1);
    			}

    			if (dirty & /*xScale, yScale*/ 96) {
    				each_value = /*xScale*/ ctx[5].domain();
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*width, height*/ 3 && g_transform_value !== (g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(46:0) {#if (data && selectedIso)}",
    		ctx
    	});

    	return block;
    }

    // (54:4) {#each yLabels as yLabel}
    function create_each_block_1(ctx) {
    	let text_1;
    	let t_value = /*yLabel*/ ctx[14].text + "";
    	let t;
    	let text_1_transform_value;
    	let text_1_text_anchor_value;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(text_1, "class", "y-label svelte-wfvw11");
    			attr_dev(text_1, "transform", text_1_transform_value = "translate(" + /*yLabel*/ ctx[14].x + " " + /*yLabel*/ ctx[14].y + ")");
    			attr_dev(text_1, "text-anchor", text_1_text_anchor_value = /*yLabel*/ ctx[14].textAnchor);
    			add_location(text_1, file$6, 54, 6, 1685);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*yLabels*/ 256 && t_value !== (t_value = /*yLabel*/ ctx[14].text + "")) set_data_dev(t, t_value);

    			if (dirty & /*yLabels*/ 256 && text_1_transform_value !== (text_1_transform_value = "translate(" + /*yLabel*/ ctx[14].x + " " + /*yLabel*/ ctx[14].y + ")")) {
    				attr_dev(text_1, "transform", text_1_transform_value);
    			}

    			if (dirty & /*yLabels*/ 256 && text_1_text_anchor_value !== (text_1_text_anchor_value = /*yLabel*/ ctx[14].textAnchor)) {
    				attr_dev(text_1, "text-anchor", text_1_text_anchor_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(54:4) {#each yLabels as yLabel}",
    		ctx
    	});

    	return block;
    }

    // (63:4) {#each xScale.domain() as xLabel, i}
    function create_each_block$2(ctx) {
    	let text_1;
    	let t_value = /*xLabel*/ ctx[11] + "";
    	let t;
    	let text_1_transform_value;
    	let text_1_text_anchor_value;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(text_1, "class", "x-label svelte-wfvw11");
    			attr_dev(text_1, "transform", text_1_transform_value = "translate(" + /*xScale*/ ctx[5](/*xLabel*/ ctx[11]) + " " + /*yScale*/ ctx[6].range()[0] * 1.25 + ")");
    			attr_dev(text_1, "text-anchor", text_1_text_anchor_value = /*i*/ ctx[13] % 2 === 0 ? "start" : "end");
    			add_location(text_1, file$6, 63, 6, 2028);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*xScale*/ 32 && t_value !== (t_value = /*xLabel*/ ctx[11] + "")) set_data_dev(t, t_value);

    			if (dirty & /*xScale, yScale*/ 96 && text_1_transform_value !== (text_1_transform_value = "translate(" + /*xScale*/ ctx[5](/*xLabel*/ ctx[11]) + " " + /*yScale*/ ctx[6].range()[0] * 1.25 + ")")) {
    				attr_dev(text_1, "transform", text_1_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(63:4) {#each xScale.domain() as xLabel, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let if_block = /*data*/ ctx[2] && /*selectedIso*/ ctx[3] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[2] && /*selectedIso*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { data } = $$props;
    	let { selectedIso } = $$props;
    	let { radius } = $$props;
    	let dataArr, xScale, yScale, line$1, yLabels;

    	function updateScalesAndGenerators(radius) {
    		$$invalidate(5, xScale = linear$1().domain(extent([].concat(...data.map(d => d.dataArr)).map(d => d.year))).range([-radius / 1.5, radius / 1.5]));
    		$$invalidate(6, yScale = linear$1().domain([-10, max([].concat(...data.map(d => d.dataArr)).map(d => d.value))]).range([radius / 2, -radius / 2]));
    		$$invalidate(7, line$1 = line().x(d => xScale(d.year)).y(d => yScale(d.value)).curve(cardinal));

    		$$invalidate(8, yLabels = [
    			{
    				x: xScale(dataArr[0].year) * 1.05,
    				y: yScale(dataArr[0].value) + Math.min(width, height) / 200,
    				text: Math.round(dataArr[0].value),
    				textAnchor: "end"
    			},
    			{
    				x: xScale(dataArr[dataArr.length - 1].year) * 1.05,
    				y: yScale(dataArr[dataArr.length - 1].value) + Math.min(width, height) / 200,
    				text: Math.round(dataArr[dataArr.length - 1].value),
    				textAnchor: "start"
    			}
    		]);
    	}

    	const writable_props = ["width", "height", "data", "selectedIso", "radius"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CentralLineChart> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("selectedIso" in $$props) $$invalidate(3, selectedIso = $$props.selectedIso);
    		if ("radius" in $$props) $$invalidate(9, radius = $$props.radius);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			data,
    			selectedIso,
    			radius,
    			dataArr,
    			xScale,
    			yScale,
    			line: line$1,
    			yLabels
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("selectedIso" in $$props) $$invalidate(3, selectedIso = $$props.selectedIso);
    		if ("radius" in $$props) $$invalidate(9, radius = $$props.radius);
    		if ("dataArr" in $$props) $$invalidate(4, dataArr = $$props.dataArr);
    		if ("xScale" in $$props) $$invalidate(5, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(6, yScale = $$props.yScale);
    		if ("line" in $$props) $$invalidate(7, line$1 = $$props.line);
    		if ("yLabels" in $$props) $$invalidate(8, yLabels = $$props.yLabels);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, selectedIso*/ 12) {
    			 if (data && selectedIso) $$invalidate(4, dataArr = data.find(d => d.iso === selectedIso).dataArr.filter(d => !isNaN(d.value)));
    		}

    		if ($$self.$$.dirty & /*data, dataArr, radius*/ 532) {
    			 if (data && dataArr) updateScalesAndGenerators(radius);
    		}
    	};

    	return [
    		width,
    		height,
    		data,
    		selectedIso,
    		dataArr,
    		xScale,
    		yScale,
    		line$1,
    		yLabels,
    		radius
    	];
    }

    class CentralLineChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			width: 0,
    			height: 1,
    			data: 2,
    			selectedIso: 3,
    			radius: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CentralLineChart",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[0] === undefined && !("width" in props)) {
    			console.warn("<CentralLineChart> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<CentralLineChart> was created without expected prop 'height'");
    		}

    		if (/*data*/ ctx[2] === undefined && !("data" in props)) {
    			console.warn("<CentralLineChart> was created without expected prop 'data'");
    		}

    		if (/*selectedIso*/ ctx[3] === undefined && !("selectedIso" in props)) {
    			console.warn("<CentralLineChart> was created without expected prop 'selectedIso'");
    		}

    		if (/*radius*/ ctx[9] === undefined && !("radius" in props)) {
    			console.warn("<CentralLineChart> was created without expected prop 'radius'");
    		}
    	}

    	get width() {
    		throw new Error("<CentralLineChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<CentralLineChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<CentralLineChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<CentralLineChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<CentralLineChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<CentralLineChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIso() {
    		throw new Error("<CentralLineChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIso(value) {
    		throw new Error("<CentralLineChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get radius() {
    		throw new Error("<CentralLineChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set radius(value) {
    		throw new Error("<CentralLineChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/CountryLabels.svelte generated by Svelte v3.16.7 */
    const file$7 = "src/flower/CountryLabels.svelte";

    function create_fragment$7(ctx) {
    	let g;
    	let g_transform_value;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")");
    			add_location(g, file$7, 58, 0, 1613);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			/*g_binding*/ ctx[10](g);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*width, height*/ 3 && g_transform_value !== (g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			/*g_binding*/ ctx[10](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { data } = $$props;
    	let { scCountryAngle } = $$props;
    	let { radius } = $$props;
    	let { selectedIso } = $$props;
    	const countryLabelArc = arc().startAngle(d => d.angle - Math.PI).endAngle(d => d.angle + Math.PI).innerRadius(d => d.radius).outerRadius(d => d.radius);
    	let container;
    	let model;

    	function update(selectedIso) {
    		if (!selectedIso) {
    			model = [];
    		} else {
    			const angle = scCountryAngle(selectedIso);

    			const realRadius = radius * (angle > Math.PI / 2 && angle < 1.5 * Math.PI
    			? 1.04
    			: 1.02);

    			model = [
    				{
    					angle,
    					radius: realRadius,
    					iso: selectedIso,
    					country: data.find(d => d.iso === selectedIso).country
    				}
    			];
    		}

    		select(container).selectAll(".country-label-path").data(model).join("path").attr("class", "country-label-path").attr("id", d => `country-label-path-${d.iso}`).attr("d", countryLabelArc).attr("fill", "none").attr("stroke", "none");

    		select(container).selectAll(".country-label").data(model).join("text").attr("class", "country-label").append("textPath").attr("href", d => `#country-label-path-${d.iso}`).attr("font-size", "0.9rem").attr("text-anchor", "middle").attr("startOffset", d => `${d.angle > Math.PI / 2 && d.angle < 1.5 * Math.PI
		? "75%"
		: "25%"}`).attr("fill", "white").text(d => d.country);
    	}

    	const writable_props = ["width", "height", "data", "scCountryAngle", "radius", "selectedIso"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CountryLabels> was created with unknown prop '${key}'`);
    	});

    	function g_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, container = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("scCountryAngle" in $$props) $$invalidate(4, scCountryAngle = $$props.scCountryAngle);
    		if ("radius" in $$props) $$invalidate(5, radius = $$props.radius);
    		if ("selectedIso" in $$props) $$invalidate(6, selectedIso = $$props.selectedIso);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			data,
    			scCountryAngle,
    			radius,
    			selectedIso,
    			container,
    			model
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("scCountryAngle" in $$props) $$invalidate(4, scCountryAngle = $$props.scCountryAngle);
    		if ("radius" in $$props) $$invalidate(5, radius = $$props.radius);
    		if ("selectedIso" in $$props) $$invalidate(6, selectedIso = $$props.selectedIso);
    		if ("container" in $$props) $$invalidate(2, container = $$props.container);
    		if ("model" in $$props) model = $$props.model;
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*container, selectedIso*/ 68) {
    			 if (container) update(selectedIso);
    		}
    	};

    	return [
    		width,
    		height,
    		container,
    		data,
    		scCountryAngle,
    		radius,
    		selectedIso,
    		model,
    		countryLabelArc,
    		update,
    		g_binding
    	];
    }

    class CountryLabels extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			width: 0,
    			height: 1,
    			data: 3,
    			scCountryAngle: 4,
    			radius: 5,
    			selectedIso: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CountryLabels",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[0] === undefined && !("width" in props)) {
    			console.warn("<CountryLabels> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<CountryLabels> was created without expected prop 'height'");
    		}

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<CountryLabels> was created without expected prop 'data'");
    		}

    		if (/*scCountryAngle*/ ctx[4] === undefined && !("scCountryAngle" in props)) {
    			console.warn("<CountryLabels> was created without expected prop 'scCountryAngle'");
    		}

    		if (/*radius*/ ctx[5] === undefined && !("radius" in props)) {
    			console.warn("<CountryLabels> was created without expected prop 'radius'");
    		}

    		if (/*selectedIso*/ ctx[6] === undefined && !("selectedIso" in props)) {
    			console.warn("<CountryLabels> was created without expected prop 'selectedIso'");
    		}
    	}

    	get width() {
    		throw new Error("<CountryLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<CountryLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<CountryLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<CountryLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<CountryLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<CountryLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scCountryAngle() {
    		throw new Error("<CountryLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scCountryAngle(value) {
    		throw new Error("<CountryLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get radius() {
    		throw new Error("<CountryLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set radius(value) {
    		throw new Error("<CountryLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIso() {
    		throw new Error("<CountryLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIso(value) {
    		throw new Error("<CountryLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/CountryHighlighter.svelte generated by Svelte v3.16.7 */
    const file$8 = "src/flower/CountryHighlighter.svelte";

    function create_fragment$8(ctx) {
    	let g;
    	let g_transform_value;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")");
    			add_location(g, file$8, 86, 0, 3448);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			/*g_binding*/ ctx[14](g);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*width, height*/ 3 && g_transform_value !== (g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			/*g_binding*/ ctx[14](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { data } = $$props;
    	let { years } = $$props;
    	let { scCountryAngle } = $$props;
    	let { scYearRadius } = $$props;
    	let { scMortRate } = $$props;
    	let { scReduction } = $$props;
    	let { selectedIso } = $$props;
    	let reduction;
    	let container;
    	let modelYears, modelReduction;

    	function update(selectedIso) {
    		if (!selectedIso) {
    			modelYears = [];
    			reduction = 0;
    			modelReduction = [];
    		} else {
    			reduction = data.find(d => d.iso === selectedIso).reduction;

    			modelReduction = [
    				{
    					cx: Math.sin(Math.PI - scCountryAngle(selectedIso)) * scReduction(reduction) * (reduction <= 0 ? 0.97 : 1.03),
    					cy: Math.cos(Math.PI - scCountryAngle(selectedIso)) * scReduction(reduction) * (reduction <= 0 ? 0.97 : 1.03),
    					r: Math.min(width, height) / 200
    				}
    			];

    			modelYears = data.find(d => d.iso === selectedIso).dataArr.filter(d => years.includes(d.year)) || [];
    		}

    		select(container).selectAll(".year-circle").data(modelYears).join(enter => enter.append("circle").attr("class", "year-circle").attr("fill", "white").attr("opacity", 0.6).attr("cx", 0).attr("cy", 0).attr("r", 0).call(enter => enter.transition().duration(100).attr("cx", d => Math.sin(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year)).attr("cy", d => Math.cos(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year)).attr("r", d => scMortRate(d.value))), update => update.transition().duration(100).attr("cx", d => Math.sin(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year)).attr("cy", d => Math.cos(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year)).attr("r", d => scMortRate(d.value)), exit => exit.transition().duration(100).attr("cx", 0).attr("cy", 0).attr("r", 0).remove());
    		select(container).selectAll(".reduction-circle").data(modelReduction).join(enter => enter.append("circle").attr("class", `reduction-circle ${reduction <= 0 ? "decreased" : "increased"}`).attr("cx", 0).attr("cy", 0).attr("r", 0).call(enter => enter.transition().duration(100).attr("cx", d => d.cx).attr("cy", d => d.cy).attr("r", d => d.r)), update => update.attr("class", `reduction-circle ${reduction <= 0 ? "decreased" : "increased"}`).transition().duration(100).attr("cx", d => d.cx).attr("cy", d => d.cy).attr("r", d => d.r), exit => exit.transition().duration(100).attr("cx", 0).attr("cy", 0).attr("r", 0).remove());
    	}

    	const writable_props = [
    		"width",
    		"height",
    		"data",
    		"years",
    		"scCountryAngle",
    		"scYearRadius",
    		"scMortRate",
    		"scReduction",
    		"selectedIso"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CountryHighlighter> was created with unknown prop '${key}'`);
    	});

    	function g_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, container = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("years" in $$props) $$invalidate(4, years = $$props.years);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("scYearRadius" in $$props) $$invalidate(6, scYearRadius = $$props.scYearRadius);
    		if ("scMortRate" in $$props) $$invalidate(7, scMortRate = $$props.scMortRate);
    		if ("scReduction" in $$props) $$invalidate(8, scReduction = $$props.scReduction);
    		if ("selectedIso" in $$props) $$invalidate(9, selectedIso = $$props.selectedIso);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			data,
    			years,
    			scCountryAngle,
    			scYearRadius,
    			scMortRate,
    			scReduction,
    			selectedIso,
    			reduction,
    			container,
    			modelYears,
    			modelReduction
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("years" in $$props) $$invalidate(4, years = $$props.years);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("scYearRadius" in $$props) $$invalidate(6, scYearRadius = $$props.scYearRadius);
    		if ("scMortRate" in $$props) $$invalidate(7, scMortRate = $$props.scMortRate);
    		if ("scReduction" in $$props) $$invalidate(8, scReduction = $$props.scReduction);
    		if ("selectedIso" in $$props) $$invalidate(9, selectedIso = $$props.selectedIso);
    		if ("reduction" in $$props) reduction = $$props.reduction;
    		if ("container" in $$props) $$invalidate(2, container = $$props.container);
    		if ("modelYears" in $$props) modelYears = $$props.modelYears;
    		if ("modelReduction" in $$props) modelReduction = $$props.modelReduction;
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*container, selectedIso*/ 516) {
    			 if (container) update(selectedIso);
    		}
    	};

    	return [
    		width,
    		height,
    		container,
    		data,
    		years,
    		scCountryAngle,
    		scYearRadius,
    		scMortRate,
    		scReduction,
    		selectedIso,
    		reduction,
    		modelYears,
    		modelReduction,
    		update,
    		g_binding
    	];
    }

    class CountryHighlighter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			width: 0,
    			height: 1,
    			data: 3,
    			years: 4,
    			scCountryAngle: 5,
    			scYearRadius: 6,
    			scMortRate: 7,
    			scReduction: 8,
    			selectedIso: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CountryHighlighter",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[0] === undefined && !("width" in props)) {
    			console.warn("<CountryHighlighter> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<CountryHighlighter> was created without expected prop 'height'");
    		}

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<CountryHighlighter> was created without expected prop 'data'");
    		}

    		if (/*years*/ ctx[4] === undefined && !("years" in props)) {
    			console.warn("<CountryHighlighter> was created without expected prop 'years'");
    		}

    		if (/*scCountryAngle*/ ctx[5] === undefined && !("scCountryAngle" in props)) {
    			console.warn("<CountryHighlighter> was created without expected prop 'scCountryAngle'");
    		}

    		if (/*scYearRadius*/ ctx[6] === undefined && !("scYearRadius" in props)) {
    			console.warn("<CountryHighlighter> was created without expected prop 'scYearRadius'");
    		}

    		if (/*scMortRate*/ ctx[7] === undefined && !("scMortRate" in props)) {
    			console.warn("<CountryHighlighter> was created without expected prop 'scMortRate'");
    		}

    		if (/*scReduction*/ ctx[8] === undefined && !("scReduction" in props)) {
    			console.warn("<CountryHighlighter> was created without expected prop 'scReduction'");
    		}

    		if (/*selectedIso*/ ctx[9] === undefined && !("selectedIso" in props)) {
    			console.warn("<CountryHighlighter> was created without expected prop 'selectedIso'");
    		}
    	}

    	get width() {
    		throw new Error("<CountryHighlighter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<CountryHighlighter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<CountryHighlighter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<CountryHighlighter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<CountryHighlighter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<CountryHighlighter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get years() {
    		throw new Error("<CountryHighlighter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set years(value) {
    		throw new Error("<CountryHighlighter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scCountryAngle() {
    		throw new Error("<CountryHighlighter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scCountryAngle(value) {
    		throw new Error("<CountryHighlighter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scYearRadius() {
    		throw new Error("<CountryHighlighter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scYearRadius(value) {
    		throw new Error("<CountryHighlighter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scMortRate() {
    		throw new Error("<CountryHighlighter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scMortRate(value) {
    		throw new Error("<CountryHighlighter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scReduction() {
    		throw new Error("<CountryHighlighter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scReduction(value) {
    		throw new Error("<CountryHighlighter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIso() {
    		throw new Error("<CountryHighlighter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIso(value) {
    		throw new Error("<CountryHighlighter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function getCentralAngle(x, y, width, height) {
      const pi = Math.PI;
      const pi2 = pi * 2;

      const corrX = x - width / 2;
      const corrY = height / 2 - y;

      let angle = corrY > 0 ? Math.atan(corrX / corrY) : Math.atan(corrY / corrX);

      if (corrY <= 0 && corrX > 0) angle = -angle + pi / 2;
      if (corrY <= 0 && corrX <= 0) angle = 1.5 * pi - angle;
      if (corrY > 0 && corrX <= 0) angle = angle + pi2;
      
      return angle;
    }

    /* src/flower/IsoDetector.svelte generated by Svelte v3.16.7 */
    const file$9 = "src/flower/IsoDetector.svelte";

    function create_fragment$9(ctx) {
    	let g;
    	let circle;
    	let g_transform_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", "0");
    			attr_dev(circle, "cy", "0");
    			attr_dev(circle, "r", /*radius*/ ctx[2]);
    			attr_dev(circle, "fill", "transparent");
    			attr_dev(circle, "stroke", "none");
    			add_location(circle, file$9, 23, 2, 644);
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")");
    			add_location(g, file$9, 22, 0, 590);

    			dispose = [
    				listen_dev(circle, "mousemove", /*detectIso*/ ctx[4], false, false, false),
    				listen_dev(circle, "mouseout", /*mouseout_handler*/ ctx[7], false, false, false),
    				listen_dev(circle, "click", stop_propagation(/*detectIso*/ ctx[4]), false, false, true)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, circle);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*radius*/ 4) {
    				attr_dev(circle, "r", /*radius*/ ctx[2]);
    			}

    			if (dirty & /*width, height*/ 3 && g_transform_value !== (g_transform_value = "translate(" + /*width*/ ctx[0] / 2 + " " + /*height*/ ctx[1] / 2 + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const eventName = "isochanged";

    function instance$9($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { radius } = $$props;
    	let { scCountryAngle } = $$props;
    	let { selectedIso } = $$props;
    	const dispatch = createEventDispatcher();

    	function detectIso(e) {
    		const angle = getCentralAngle(e.offsetX, e.offsetY, width, height);
    		const iso = scCountryAngle.domain()[bisectRight(scCountryAngle.range(), angle) - 1];
    		if (iso !== selectedIso) dispatch(eventName, iso);
    	}

    	const writable_props = ["width", "height", "radius", "scCountryAngle", "selectedIso"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IsoDetector> was created with unknown prop '${key}'`);
    	});

    	const mouseout_handler = () => dispatch(eventName, undefined);

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("radius" in $$props) $$invalidate(2, radius = $$props.radius);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("selectedIso" in $$props) $$invalidate(6, selectedIso = $$props.selectedIso);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			radius,
    			scCountryAngle,
    			selectedIso
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("radius" in $$props) $$invalidate(2, radius = $$props.radius);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("selectedIso" in $$props) $$invalidate(6, selectedIso = $$props.selectedIso);
    	};

    	return [
    		width,
    		height,
    		radius,
    		dispatch,
    		detectIso,
    		scCountryAngle,
    		selectedIso,
    		mouseout_handler
    	];
    }

    class IsoDetector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			width: 0,
    			height: 1,
    			radius: 2,
    			scCountryAngle: 5,
    			selectedIso: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IsoDetector",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[0] === undefined && !("width" in props)) {
    			console.warn("<IsoDetector> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<IsoDetector> was created without expected prop 'height'");
    		}

    		if (/*radius*/ ctx[2] === undefined && !("radius" in props)) {
    			console.warn("<IsoDetector> was created without expected prop 'radius'");
    		}

    		if (/*scCountryAngle*/ ctx[5] === undefined && !("scCountryAngle" in props)) {
    			console.warn("<IsoDetector> was created without expected prop 'scCountryAngle'");
    		}

    		if (/*selectedIso*/ ctx[6] === undefined && !("selectedIso" in props)) {
    			console.warn("<IsoDetector> was created without expected prop 'selectedIso'");
    		}
    	}

    	get width() {
    		throw new Error("<IsoDetector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<IsoDetector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<IsoDetector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<IsoDetector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get radius() {
    		throw new Error("<IsoDetector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set radius(value) {
    		throw new Error("<IsoDetector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scCountryAngle() {
    		throw new Error("<IsoDetector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scCountryAngle(value) {
    		throw new Error("<IsoDetector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIso() {
    		throw new Error("<IsoDetector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIso(value) {
    		throw new Error("<IsoDetector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/SVGVisualOver.svelte generated by Svelte v3.16.7 */
    const file$a = "src/flower/SVGVisualOver.svelte";

    function create_fragment$a(ctx) {
    	let svg;
    	let current;

    	const defs = new Defs({
    			props: { scReduction: /*scReduction*/ ctx[7] },
    			$$inline: true
    		});

    	const yearlabels = new YearLabels({
    			props: {
    				width: /*width*/ ctx[0],
    				height: /*height*/ ctx[1],
    				years: /*years*/ ctx[4],
    				scYearRadius: /*scYearRadius*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const centrallinechart = new CentralLineChart({
    			props: {
    				width: /*width*/ ctx[0],
    				height: /*height*/ ctx[1],
    				data: /*data*/ ctx[3],
    				selectedIso: /*selectedIso*/ ctx[9],
    				radius: /*innerRadius*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const countrylabels = new CountryLabels({
    			props: {
    				width: /*width*/ ctx[0],
    				height: /*height*/ ctx[1],
    				data: /*data*/ ctx[3].map(func),
    				scCountryAngle: /*scCountryAngle*/ ctx[5],
    				radius: /*countryRadius*/ ctx[11],
    				selectedIso: /*selectedIso*/ ctx[9]
    			},
    			$$inline: true
    		});

    	const countryhighlighter = new CountryHighlighter({
    			props: {
    				width: /*width*/ ctx[0],
    				height: /*height*/ ctx[1],
    				data: /*data*/ ctx[3],
    				years: /*years*/ ctx[4],
    				scCountryAngle: /*scCountryAngle*/ ctx[5],
    				scYearRadius: /*scYearRadius*/ ctx[6],
    				scMortRate: /*scMortRate*/ ctx[8],
    				scReduction: /*scReduction*/ ctx[7],
    				selectedIso: /*selectedIso*/ ctx[9]
    			},
    			$$inline: true
    		});

    	const isodetector = new IsoDetector({
    			props: {
    				width: /*width*/ ctx[0],
    				height: /*height*/ ctx[1],
    				radius: /*scReduction*/ ctx[7].range()[1],
    				scCountryAngle: /*scCountryAngle*/ ctx[5],
    				selectedIso: /*selectedIso*/ ctx[9]
    			},
    			$$inline: true
    		});

    	isodetector.$on("isochanged", /*isochanged_handler*/ ctx[12]);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			create_component(defs.$$.fragment);
    			create_component(yearlabels.$$.fragment);
    			create_component(centrallinechart.$$.fragment);
    			create_component(countrylabels.$$.fragment);
    			create_component(countryhighlighter.$$.fragment);
    			create_component(isodetector.$$.fragment);
    			attr_dev(svg, "class", "svg-visual svelte-x6infa");
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			set_style(svg, "margin", /*offset*/ ctx[2] / 2 + "px");
    			add_location(svg, file$a, 23, 0, 663);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			mount_component(defs, svg, null);
    			mount_component(yearlabels, svg, null);
    			mount_component(centrallinechart, svg, null);
    			mount_component(countrylabels, svg, null);
    			mount_component(countryhighlighter, svg, null);
    			mount_component(isodetector, svg, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const defs_changes = {};
    			if (dirty & /*scReduction*/ 128) defs_changes.scReduction = /*scReduction*/ ctx[7];
    			defs.$set(defs_changes);
    			const yearlabels_changes = {};
    			if (dirty & /*width*/ 1) yearlabels_changes.width = /*width*/ ctx[0];
    			if (dirty & /*height*/ 2) yearlabels_changes.height = /*height*/ ctx[1];
    			if (dirty & /*years*/ 16) yearlabels_changes.years = /*years*/ ctx[4];
    			if (dirty & /*scYearRadius*/ 64) yearlabels_changes.scYearRadius = /*scYearRadius*/ ctx[6];
    			yearlabels.$set(yearlabels_changes);
    			const centrallinechart_changes = {};
    			if (dirty & /*width*/ 1) centrallinechart_changes.width = /*width*/ ctx[0];
    			if (dirty & /*height*/ 2) centrallinechart_changes.height = /*height*/ ctx[1];
    			if (dirty & /*data*/ 8) centrallinechart_changes.data = /*data*/ ctx[3];
    			if (dirty & /*selectedIso*/ 512) centrallinechart_changes.selectedIso = /*selectedIso*/ ctx[9];
    			if (dirty & /*innerRadius*/ 1024) centrallinechart_changes.radius = /*innerRadius*/ ctx[10];
    			centrallinechart.$set(centrallinechart_changes);
    			const countrylabels_changes = {};
    			if (dirty & /*width*/ 1) countrylabels_changes.width = /*width*/ ctx[0];
    			if (dirty & /*height*/ 2) countrylabels_changes.height = /*height*/ ctx[1];
    			if (dirty & /*data*/ 8) countrylabels_changes.data = /*data*/ ctx[3].map(func);
    			if (dirty & /*scCountryAngle*/ 32) countrylabels_changes.scCountryAngle = /*scCountryAngle*/ ctx[5];
    			if (dirty & /*countryRadius*/ 2048) countrylabels_changes.radius = /*countryRadius*/ ctx[11];
    			if (dirty & /*selectedIso*/ 512) countrylabels_changes.selectedIso = /*selectedIso*/ ctx[9];
    			countrylabels.$set(countrylabels_changes);
    			const countryhighlighter_changes = {};
    			if (dirty & /*width*/ 1) countryhighlighter_changes.width = /*width*/ ctx[0];
    			if (dirty & /*height*/ 2) countryhighlighter_changes.height = /*height*/ ctx[1];
    			if (dirty & /*data*/ 8) countryhighlighter_changes.data = /*data*/ ctx[3];
    			if (dirty & /*years*/ 16) countryhighlighter_changes.years = /*years*/ ctx[4];
    			if (dirty & /*scCountryAngle*/ 32) countryhighlighter_changes.scCountryAngle = /*scCountryAngle*/ ctx[5];
    			if (dirty & /*scYearRadius*/ 64) countryhighlighter_changes.scYearRadius = /*scYearRadius*/ ctx[6];
    			if (dirty & /*scMortRate*/ 256) countryhighlighter_changes.scMortRate = /*scMortRate*/ ctx[8];
    			if (dirty & /*scReduction*/ 128) countryhighlighter_changes.scReduction = /*scReduction*/ ctx[7];
    			if (dirty & /*selectedIso*/ 512) countryhighlighter_changes.selectedIso = /*selectedIso*/ ctx[9];
    			countryhighlighter.$set(countryhighlighter_changes);
    			const isodetector_changes = {};
    			if (dirty & /*width*/ 1) isodetector_changes.width = /*width*/ ctx[0];
    			if (dirty & /*height*/ 2) isodetector_changes.height = /*height*/ ctx[1];
    			if (dirty & /*scReduction*/ 128) isodetector_changes.radius = /*scReduction*/ ctx[7].range()[1];
    			if (dirty & /*scCountryAngle*/ 32) isodetector_changes.scCountryAngle = /*scCountryAngle*/ ctx[5];
    			if (dirty & /*selectedIso*/ 512) isodetector_changes.selectedIso = /*selectedIso*/ ctx[9];
    			isodetector.$set(isodetector_changes);

    			if (!current || dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (!current || dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (!current || dirty & /*offset*/ 4) {
    				set_style(svg, "margin", /*offset*/ ctx[2] / 2 + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(defs.$$.fragment, local);
    			transition_in(yearlabels.$$.fragment, local);
    			transition_in(centrallinechart.$$.fragment, local);
    			transition_in(countrylabels.$$.fragment, local);
    			transition_in(countryhighlighter.$$.fragment, local);
    			transition_in(isodetector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(defs.$$.fragment, local);
    			transition_out(yearlabels.$$.fragment, local);
    			transition_out(centrallinechart.$$.fragment, local);
    			transition_out(countrylabels.$$.fragment, local);
    			transition_out(countryhighlighter.$$.fragment, local);
    			transition_out(isodetector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_component(defs);
    			destroy_component(yearlabels);
    			destroy_component(centrallinechart);
    			destroy_component(countrylabels);
    			destroy_component(countryhighlighter);
    			destroy_component(isodetector);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = d => ({ iso: d.iso, country: d.country });

    function instance$a($$self, $$props, $$invalidate) {
    	let { width } = $$props;
    	let { height } = $$props;
    	let { offset } = $$props;
    	let { data } = $$props;
    	let { years } = $$props;
    	let { scCountryAngle } = $$props;
    	let { scYearRadius } = $$props;
    	let { scReduction } = $$props;
    	let { scMortRate } = $$props;
    	let { selectedIso } = $$props;

    	const writable_props = [
    		"width",
    		"height",
    		"offset",
    		"data",
    		"years",
    		"scCountryAngle",
    		"scYearRadius",
    		"scReduction",
    		"scMortRate",
    		"selectedIso"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SVGVisualOver> was created with unknown prop '${key}'`);
    	});

    	function isochanged_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("offset" in $$props) $$invalidate(2, offset = $$props.offset);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("years" in $$props) $$invalidate(4, years = $$props.years);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("scYearRadius" in $$props) $$invalidate(6, scYearRadius = $$props.scYearRadius);
    		if ("scReduction" in $$props) $$invalidate(7, scReduction = $$props.scReduction);
    		if ("scMortRate" in $$props) $$invalidate(8, scMortRate = $$props.scMortRate);
    		if ("selectedIso" in $$props) $$invalidate(9, selectedIso = $$props.selectedIso);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			offset,
    			data,
    			years,
    			scCountryAngle,
    			scYearRadius,
    			scReduction,
    			scMortRate,
    			selectedIso,
    			innerRadius,
    			countryRadius
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("offset" in $$props) $$invalidate(2, offset = $$props.offset);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("years" in $$props) $$invalidate(4, years = $$props.years);
    		if ("scCountryAngle" in $$props) $$invalidate(5, scCountryAngle = $$props.scCountryAngle);
    		if ("scYearRadius" in $$props) $$invalidate(6, scYearRadius = $$props.scYearRadius);
    		if ("scReduction" in $$props) $$invalidate(7, scReduction = $$props.scReduction);
    		if ("scMortRate" in $$props) $$invalidate(8, scMortRate = $$props.scMortRate);
    		if ("selectedIso" in $$props) $$invalidate(9, selectedIso = $$props.selectedIso);
    		if ("innerRadius" in $$props) $$invalidate(10, innerRadius = $$props.innerRadius);
    		if ("countryRadius" in $$props) $$invalidate(11, countryRadius = $$props.countryRadius);
    	};

    	let innerRadius;
    	let countryRadius;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*scYearRadius, years*/ 80) {
    			 $$invalidate(10, innerRadius = scYearRadius(years[0]) * 0.62);
    		}

    		if ($$self.$$.dirty & /*scReduction*/ 128) {
    			 $$invalidate(11, countryRadius = scReduction.range()[1]);
    		}
    	};

    	return [
    		width,
    		height,
    		offset,
    		data,
    		years,
    		scCountryAngle,
    		scYearRadius,
    		scReduction,
    		scMortRate,
    		selectedIso,
    		innerRadius,
    		countryRadius,
    		isochanged_handler
    	];
    }

    class SVGVisualOver extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			width: 0,
    			height: 1,
    			offset: 2,
    			data: 3,
    			years: 4,
    			scCountryAngle: 5,
    			scYearRadius: 6,
    			scReduction: 7,
    			scMortRate: 8,
    			selectedIso: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SVGVisualOver",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*width*/ ctx[0] === undefined && !("width" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'height'");
    		}

    		if (/*offset*/ ctx[2] === undefined && !("offset" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'offset'");
    		}

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'data'");
    		}

    		if (/*years*/ ctx[4] === undefined && !("years" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'years'");
    		}

    		if (/*scCountryAngle*/ ctx[5] === undefined && !("scCountryAngle" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'scCountryAngle'");
    		}

    		if (/*scYearRadius*/ ctx[6] === undefined && !("scYearRadius" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'scYearRadius'");
    		}

    		if (/*scReduction*/ ctx[7] === undefined && !("scReduction" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'scReduction'");
    		}

    		if (/*scMortRate*/ ctx[8] === undefined && !("scMortRate" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'scMortRate'");
    		}

    		if (/*selectedIso*/ ctx[9] === undefined && !("selectedIso" in props)) {
    			console.warn("<SVGVisualOver> was created without expected prop 'selectedIso'");
    		}
    	}

    	get width() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get years() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set years(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scCountryAngle() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scCountryAngle(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scYearRadius() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scYearRadius(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scReduction() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scReduction(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scMortRate() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scMortRate(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIso() {
    		throw new Error("<SVGVisualOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIso(value) {
    		throw new Error("<SVGVisualOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/Tour.svelte generated by Svelte v3.16.7 */

    const file$b = "src/flower/Tour.svelte";

    function create_fragment$b(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "wrapper");
    			add_location(div, file$b, 27, 0, 314);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { data } = $$props;

    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tour> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { data };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	return [data];
    }

    class Tour extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tour",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Tour> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Tour>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Tour>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/Legend.svelte generated by Svelte v3.16.7 */
    const file$c = "src/flower/Legend.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (51:4) {#if scalesSet}
    function create_if_block$2(ctx) {
    	let defs;
    	let linearGradient;
    	let stop0;
    	let stop1;
    	let stop2;
    	let stop3;
    	let g0;
    	let text0;
    	let t0;
    	let text1;
    	let t1;
    	let text1_transform_value;
    	let g0_transform_value;
    	let g1;
    	let g2;
    	let path;
    	let path_d_value;
    	let text2;
    	let t2;
    	let text2_transform_value;
    	let text3;
    	let t3;
    	let text3_transform_value;
    	let each_value = /*mortalityCircles*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			defs = svg_element("defs");
    			linearGradient = svg_element("linearGradient");
    			stop0 = svg_element("stop");
    			stop1 = svg_element("stop");
    			stop2 = svg_element("stop");
    			stop3 = svg_element("stop");
    			g0 = svg_element("g");
    			text0 = svg_element("text");
    			t0 = text("Deaths / 1,000 births");
    			text1 = svg_element("text");
    			t1 = text("Deaths from 1998 to 2018");
    			g1 = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			g2 = svg_element("g");
    			path = svg_element("path");
    			text2 = svg_element("text");
    			t2 = text("increased");
    			text3 = svg_element("text");
    			t3 = text("decreased");
    			attr_dev(stop0, "offset", "0");
    			attr_dev(stop0, "stop-color", "#A6D9F7");
    			add_location(stop0, file$c, 57, 10, 1721);
    			attr_dev(stop1, "offset", "0.40");
    			attr_dev(stop1, "stop-color", "#A6D9F7");
    			add_location(stop1, file$c, 58, 10, 1772);
    			attr_dev(stop2, "offset", "0.40");
    			attr_dev(stop2, "stop-color", "#F40000");
    			add_location(stop2, file$c, 59, 10, 1826);
    			attr_dev(stop3, "offset", "1");
    			attr_dev(stop3, "stop-color", "#F40000");
    			add_location(stop3, file$c, 60, 10, 1880);
    			attr_dev(linearGradient, "id", "legend-reduction-gradient");
    			attr_dev(linearGradient, "x1", "0");
    			attr_dev(linearGradient, "y1", "100%");
    			attr_dev(linearGradient, "x2", "0");
    			attr_dev(linearGradient, "y2", "0");
    			add_location(linearGradient, file$c, 52, 8, 1536);
    			add_location(defs, file$c, 51, 6, 1521);
    			attr_dev(text0, "class", "svelte-2z1rcu");
    			add_location(text0, file$c, 64, 8, 2033);
    			attr_dev(text1, "transform", text1_transform_value = "translate(" + /*xScale*/ ctx[5].range()[0] + " 0)");
    			attr_dev(text1, "class", "svelte-2z1rcu");
    			add_location(text1, file$c, 65, 8, 2076);
    			attr_dev(g0, "class", "titles svelte-2z1rcu");
    			attr_dev(g0, "transform", g0_transform_value = "translate(0 " + /*titleHeight*/ ctx[3] + ")");
    			add_location(g0, file$c, 63, 6, 1967);
    			attr_dev(g1, "class", "mortality-circles");
    			attr_dev(g1, "transform", "translate(0 0)");
    			add_location(g1, file$c, 67, 6, 2176);
    			attr_dev(path, "class", "reduction-path svelte-2z1rcu");
    			attr_dev(path, "d", path_d_value = /*reductionPath*/ ctx[7](/*reductionData*/ ctx[8]));
    			attr_dev(path, "fill", "url(#legend-reduction-gradient)");
    			add_location(path, file$c, 77, 8, 2583);
    			attr_dev(text2, "class", "reduction-label red svelte-2z1rcu");
    			attr_dev(text2, "transform", text2_transform_value = "translate(" + (/*xScale*/ ctx[5].range()[0] + 5) + " " + (/*yScale*/ ctx[6].range()[1] + 15) + ")");
    			add_location(text2, file$c, 80, 8, 2723);
    			attr_dev(text3, "class", "reduction-label blue svelte-2z1rcu");
    			attr_dev(text3, "transform", text3_transform_value = "translate(" + (/*xScale*/ ctx[5].range()[0] + 5) + " " + (/*yScale*/ ctx[6].range()[0] + 7) + ")");
    			add_location(text3, file$c, 82, 8, 2868);
    			attr_dev(g2, "class", "reduction");
    			add_location(g2, file$c, 76, 6, 2553);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, defs, anchor);
    			append_dev(defs, linearGradient);
    			append_dev(linearGradient, stop0);
    			append_dev(linearGradient, stop1);
    			append_dev(linearGradient, stop2);
    			append_dev(linearGradient, stop3);
    			insert_dev(target, g0, anchor);
    			append_dev(g0, text0);
    			append_dev(text0, t0);
    			append_dev(g0, text1);
    			append_dev(text1, t1);
    			insert_dev(target, g1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g1, null);
    			}

    			insert_dev(target, g2, anchor);
    			append_dev(g2, path);
    			append_dev(g2, text2);
    			append_dev(text2, t2);
    			append_dev(g2, text3);
    			append_dev(text3, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*xScale*/ 32 && text1_transform_value !== (text1_transform_value = "translate(" + /*xScale*/ ctx[5].range()[0] + " 0)")) {
    				attr_dev(text1, "transform", text1_transform_value);
    			}

    			if (dirty & /*titleHeight*/ 8 && g0_transform_value !== (g0_transform_value = "translate(0 " + /*titleHeight*/ ctx[3] + ")")) {
    				attr_dev(g0, "transform", g0_transform_value);
    			}

    			if (dirty & /*mortalityCircles*/ 4) {
    				each_value = /*mortalityCircles*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*reductionPath, reductionData*/ 384 && path_d_value !== (path_d_value = /*reductionPath*/ ctx[7](/*reductionData*/ ctx[8]))) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (dirty & /*xScale, yScale*/ 96 && text2_transform_value !== (text2_transform_value = "translate(" + (/*xScale*/ ctx[5].range()[0] + 5) + " " + (/*yScale*/ ctx[6].range()[1] + 15) + ")")) {
    				attr_dev(text2, "transform", text2_transform_value);
    			}

    			if (dirty & /*xScale, yScale*/ 96 && text3_transform_value !== (text3_transform_value = "translate(" + (/*xScale*/ ctx[5].range()[0] + 5) + " " + (/*yScale*/ ctx[6].range()[0] + 7) + ")")) {
    				attr_dev(text3, "transform", text3_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(defs);
    			if (detaching) detach_dev(g0);
    			if (detaching) detach_dev(g1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(g2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(51:4) {#if scalesSet}",
    		ctx
    	});

    	return block;
    }

    // (69:8) {#each mortalityCircles as d}
    function create_each_block$3(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;
    	let circle_r_value;
    	let text_1;
    	let t_value = /*d*/ ctx[14].mortalityRate + "";
    	let t;
    	let text_1_transform_value;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(circle, "class", "mortality-circle svelte-2z1rcu");
    			attr_dev(circle, "cx", circle_cx_value = /*d*/ ctx[14].cx);
    			attr_dev(circle, "cy", circle_cy_value = /*d*/ ctx[14].cy);
    			attr_dev(circle, "r", circle_r_value = /*d*/ ctx[14].r);
    			add_location(circle, file$c, 69, 10, 2281);
    			attr_dev(text_1, "class", "mortality-labels svelte-2z1rcu");
    			attr_dev(text_1, "transform", text_1_transform_value = "translate(" + /*d*/ ctx[14].cx + " " + (/*d*/ ctx[14].cy - /*d*/ ctx[14].r - 10) + ")");
    			add_location(text_1, file$c, 73, 10, 2416);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*mortalityCircles*/ 4 && circle_cx_value !== (circle_cx_value = /*d*/ ctx[14].cx)) {
    				attr_dev(circle, "cx", circle_cx_value);
    			}

    			if (dirty & /*mortalityCircles*/ 4 && circle_cy_value !== (circle_cy_value = /*d*/ ctx[14].cy)) {
    				attr_dev(circle, "cy", circle_cy_value);
    			}

    			if (dirty & /*mortalityCircles*/ 4 && circle_r_value !== (circle_r_value = /*d*/ ctx[14].r)) {
    				attr_dev(circle, "r", circle_r_value);
    			}

    			if (dirty & /*mortalityCircles*/ 4 && t_value !== (t_value = /*d*/ ctx[14].mortalityRate + "")) set_data_dev(t, t_value);

    			if (dirty & /*mortalityCircles*/ 4 && text_1_transform_value !== (text_1_transform_value = "translate(" + /*d*/ ctx[14].cx + " " + (/*d*/ ctx[14].cy - /*d*/ ctx[14].r - 10) + ")")) {
    				attr_dev(text_1, "transform", text_1_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(69:8) {#each mortalityCircles as d}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div;
    	let svg;
    	let div_resize_listener;
    	let if_block = /*scalesSet*/ ctx[4] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			if (if_block) if_block.c();
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			add_location(svg, file$c, 49, 2, 1462);
    			attr_dev(div, "class", "container svelte-2z1rcu");
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[13].call(div));
    			add_location(div, file$c, 48, 0, 1384);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			if (if_block) if_block.m(svg, null);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[13].bind(div));
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*scalesSet*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(svg, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			div_resize_listener.cancel();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { data } = $$props;
    	let { scMortRate } = $$props;
    	let { scReduction } = $$props;
    	let width = 0;
    	let height = 0;
    	let mortalityCircles = [];
    	let titleHeight = 0;
    	let scalesSet = false;
    	let xScale, yScale, reductionPath;

    	function setupScales(width, height) {
    		if (width === 0 || height === 0) return;

    		$$invalidate(5, xScale = linear$1().domain([0, 10]).range([
    			mortalityCircles[mortalityCircles.length - 1].cx + width / 15,
    			width - width / 20
    		]));

    		$$invalidate(6, yScale = linear$1().domain(extent(reductionData.map(d => d.reduction))).range([height * 2 / 3, height / 3]));
    		$$invalidate(7, reductionPath = line().x((_, i) => xScale(i)).y(d => yScale(d.reduction)).curve(cardinal));
    	}

    	const writable_props = ["data", "scMortRate", "scReduction"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Legend> was created with unknown prop '${key}'`);
    	});

    	function div_elementresize_handler() {
    		width = this.offsetWidth;
    		height = this.offsetHeight;
    		$$invalidate(0, width);
    		$$invalidate(1, height);
    	}

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(9, data = $$props.data);
    		if ("scMortRate" in $$props) $$invalidate(10, scMortRate = $$props.scMortRate);
    		if ("scReduction" in $$props) $$invalidate(11, scReduction = $$props.scReduction);
    	};

    	$$self.$capture_state = () => {
    		return {
    			data,
    			scMortRate,
    			scReduction,
    			width,
    			height,
    			mortalityCircles,
    			titleHeight,
    			scalesSet,
    			xScale,
    			yScale,
    			reductionPath,
    			reductionData
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(9, data = $$props.data);
    		if ("scMortRate" in $$props) $$invalidate(10, scMortRate = $$props.scMortRate);
    		if ("scReduction" in $$props) $$invalidate(11, scReduction = $$props.scReduction);
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("mortalityCircles" in $$props) $$invalidate(2, mortalityCircles = $$props.mortalityCircles);
    		if ("titleHeight" in $$props) $$invalidate(3, titleHeight = $$props.titleHeight);
    		if ("scalesSet" in $$props) $$invalidate(4, scalesSet = $$props.scalesSet);
    		if ("xScale" in $$props) $$invalidate(5, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(6, yScale = $$props.yScale);
    		if ("reductionPath" in $$props) $$invalidate(7, reductionPath = $$props.reductionPath);
    		if ("reductionData" in $$props) $$invalidate(8, reductionData = $$props.reductionData);
    	};

    	let reductionData;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*scMortRate, height*/ 1026) {
    			 $$invalidate(2, mortalityCircles = [80, 40, 20, 10, 5].map((d, i, a) => {
    				return {
    					mortalityRate: d,
    					r: scMortRate(d),
    					cx: scMortRate(a.slice(0, i + 1).reduce((a, c) => a + c)) + scMortRate(a.slice(0, Math.max(i, 1)).reduce((a, c) => a + c)) - (i === 0 ? scMortRate(d) : 0) + i * 20,
    					cy: height / 2
    				};
    			}));
    		}

    		if ($$self.$$.dirty & /*mortalityCircles*/ 4) {
    			 $$invalidate(3, titleHeight = mortalityCircles[0].cy - mortalityCircles[0].r - 30);
    		}

    		if ($$self.$$.dirty & /*data*/ 512) {
    			 $$invalidate(8, reductionData = [...data.slice(55, 65), data[55]]);
    		}

    		if ($$self.$$.dirty & /*mortalityCircles, reductionData, width, height*/ 263) {
    			 if (mortalityCircles && reductionData) setupScales(width, height);
    		}

    		if ($$self.$$.dirty & /*xScale, yScale, reductionPath*/ 224) {
    			 if (xScale && yScale && reductionPath) $$invalidate(4, scalesSet = true);
    		}
    	};

    	return [
    		width,
    		height,
    		mortalityCircles,
    		titleHeight,
    		scalesSet,
    		xScale,
    		yScale,
    		reductionPath,
    		reductionData,
    		data,
    		scMortRate,
    		scReduction,
    		setupScales,
    		div_elementresize_handler
    	];
    }

    class Legend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { data: 9, scMortRate: 10, scReduction: 11 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Legend",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[9] === undefined && !("data" in props)) {
    			console.warn("<Legend> was created without expected prop 'data'");
    		}

    		if (/*scMortRate*/ ctx[10] === undefined && !("scMortRate" in props)) {
    			console.warn("<Legend> was created without expected prop 'scMortRate'");
    		}

    		if (/*scReduction*/ ctx[11] === undefined && !("scReduction" in props)) {
    			console.warn("<Legend> was created without expected prop 'scReduction'");
    		}
    	}

    	get data() {
    		throw new Error("<Legend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Legend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scMortRate() {
    		throw new Error("<Legend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scMortRate(value) {
    		throw new Error("<Legend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scReduction() {
    		throw new Error("<Legend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scReduction(value) {
    		throw new Error("<Legend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/flower/Flower.svelte generated by Svelte v3.16.7 */

    const { console: console_1 } = globals;
    const file$d = "src/flower/Flower.svelte";

    // (89:2) {#if (minDim > 0)}
    function create_if_block$3(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const svgvisualbelow = new SVGVisualBelow({
    			props: {
    				width: /*width*/ ctx[10],
    				height: /*height*/ ctx[11],
    				offset,
    				data: /*data*/ ctx[0],
    				years: /*years*/ ctx[1],
    				scCountryAngle: /*scCountryAngle*/ ctx[6],
    				scYearRadius: /*scYearRadius*/ ctx[7],
    				scReduction: /*scReduction*/ ctx[9],
    				selectedIso: /*selectedIso*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const canvasvisual = new CanvasVisual({
    			props: {
    				width: /*width*/ ctx[10],
    				height: /*height*/ ctx[11],
    				offset,
    				data: /*data*/ ctx[0],
    				years: /*years*/ ctx[1],
    				scYearColor: /*scYearColor*/ ctx[5],
    				scCountryAngle: /*scCountryAngle*/ ctx[6],
    				scYearRadius: /*scYearRadius*/ ctx[7],
    				scMortRate: /*scMortRate*/ ctx[8],
    				selectedIso: /*selectedIso*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const svgvisualover = new SVGVisualOver({
    			props: {
    				width: /*width*/ ctx[10],
    				height: /*height*/ ctx[11],
    				offset,
    				data: /*data*/ ctx[0],
    				years: /*years*/ ctx[1],
    				scCountryAngle: /*scCountryAngle*/ ctx[6],
    				scYearRadius: /*scYearRadius*/ ctx[7],
    				scReduction: /*scReduction*/ ctx[9],
    				scMortRate: /*scMortRate*/ ctx[8],
    				selectedIso: /*selectedIso*/ ctx[2]
    			},
    			$$inline: true
    		});

    	svgvisualover.$on("isochanged", /*isochanged_handler*/ ctx[17]);

    	const block = {
    		c: function create() {
    			create_component(svgvisualbelow.$$.fragment);
    			t0 = space();
    			create_component(canvasvisual.$$.fragment);
    			t1 = space();
    			create_component(svgvisualover.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(svgvisualbelow, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(canvasvisual, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(svgvisualover, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const svgvisualbelow_changes = {};
    			if (dirty & /*width*/ 1024) svgvisualbelow_changes.width = /*width*/ ctx[10];
    			if (dirty & /*height*/ 2048) svgvisualbelow_changes.height = /*height*/ ctx[11];
    			if (dirty & /*data*/ 1) svgvisualbelow_changes.data = /*data*/ ctx[0];
    			if (dirty & /*years*/ 2) svgvisualbelow_changes.years = /*years*/ ctx[1];
    			if (dirty & /*scCountryAngle*/ 64) svgvisualbelow_changes.scCountryAngle = /*scCountryAngle*/ ctx[6];
    			if (dirty & /*scYearRadius*/ 128) svgvisualbelow_changes.scYearRadius = /*scYearRadius*/ ctx[7];
    			if (dirty & /*scReduction*/ 512) svgvisualbelow_changes.scReduction = /*scReduction*/ ctx[9];
    			if (dirty & /*selectedIso*/ 4) svgvisualbelow_changes.selectedIso = /*selectedIso*/ ctx[2];
    			svgvisualbelow.$set(svgvisualbelow_changes);
    			const canvasvisual_changes = {};
    			if (dirty & /*width*/ 1024) canvasvisual_changes.width = /*width*/ ctx[10];
    			if (dirty & /*height*/ 2048) canvasvisual_changes.height = /*height*/ ctx[11];
    			if (dirty & /*data*/ 1) canvasvisual_changes.data = /*data*/ ctx[0];
    			if (dirty & /*years*/ 2) canvasvisual_changes.years = /*years*/ ctx[1];
    			if (dirty & /*scYearColor*/ 32) canvasvisual_changes.scYearColor = /*scYearColor*/ ctx[5];
    			if (dirty & /*scCountryAngle*/ 64) canvasvisual_changes.scCountryAngle = /*scCountryAngle*/ ctx[6];
    			if (dirty & /*scYearRadius*/ 128) canvasvisual_changes.scYearRadius = /*scYearRadius*/ ctx[7];
    			if (dirty & /*scMortRate*/ 256) canvasvisual_changes.scMortRate = /*scMortRate*/ ctx[8];
    			if (dirty & /*selectedIso*/ 4) canvasvisual_changes.selectedIso = /*selectedIso*/ ctx[2];
    			canvasvisual.$set(canvasvisual_changes);
    			const svgvisualover_changes = {};
    			if (dirty & /*width*/ 1024) svgvisualover_changes.width = /*width*/ ctx[10];
    			if (dirty & /*height*/ 2048) svgvisualover_changes.height = /*height*/ ctx[11];
    			if (dirty & /*data*/ 1) svgvisualover_changes.data = /*data*/ ctx[0];
    			if (dirty & /*years*/ 2) svgvisualover_changes.years = /*years*/ ctx[1];
    			if (dirty & /*scCountryAngle*/ 64) svgvisualover_changes.scCountryAngle = /*scCountryAngle*/ ctx[6];
    			if (dirty & /*scYearRadius*/ 128) svgvisualover_changes.scYearRadius = /*scYearRadius*/ ctx[7];
    			if (dirty & /*scReduction*/ 512) svgvisualover_changes.scReduction = /*scReduction*/ ctx[9];
    			if (dirty & /*scMortRate*/ 256) svgvisualover_changes.scMortRate = /*scMortRate*/ ctx[8];
    			if (dirty & /*selectedIso*/ 4) svgvisualover_changes.selectedIso = /*selectedIso*/ ctx[2];
    			svgvisualover.$set(svgvisualover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(svgvisualbelow.$$.fragment, local);
    			transition_in(canvasvisual.$$.fragment, local);
    			transition_in(svgvisualover.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(svgvisualbelow.$$.fragment, local);
    			transition_out(canvasvisual.$$.fragment, local);
    			transition_out(svgvisualover.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(svgvisualbelow, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(canvasvisual, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(svgvisualover, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(89:2) {#if (minDim > 0)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let t0;
    	let div9;
    	let div4;
    	let div0;
    	let t1;
    	let span0;
    	let t3;
    	let span1;
    	let t5;
    	let t6;
    	let div3;
    	let div1;
    	let t8;
    	let div2;
    	let t9;
    	let div8;
    	let div5;
    	let t11;
    	let t12;
    	let div6;
    	let t13;
    	let a0;
    	let t15;
    	let t16;
    	let div7;
    	let img;
    	let img_src_value;
    	let t17;
    	let a1;
    	let t19;
    	let t20;
    	let div10;
    	let div10_resize_listener;
    	let current;
    	document.body.addEventListener("click", /*click_handler*/ ctx[16]);

    	const tour = new Tour({
    			props: { data: /*data*/ ctx[0] },
    			$$inline: true
    		});

    	const legend = new Legend({
    			props: {
    				data: /*data*/ ctx[0],
    				scMortRate: /*scMortRate*/ ctx[8],
    				scReduction: /*scReduction*/ ctx[9]
    			},
    			$$inline: true
    		});

    	let if_block = /*minDim*/ ctx[12] > 0 && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			div9 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t1 = text("5.3 million children under five ");
    			span0 = element("span");
    			span0.textContent = "died";
    			t3 = text(" in 2018.\n      This is on average 15,000 children per day. However, the mortality rates are in fact declining.\n      Still 30 years ago, 12.5 million kids ");
    			span1 = element("span");
    			span1.textContent = "died";
    			t5 = text(" before their fifth birthday.\n      Within the last 20 years, the mortality rates fell for every country in the world. Almost.");
    			t6 = space();
    			div3 = element("div");
    			div1 = element("div");
    			div1.textContent = "Take a tour to these countries:";
    			t8 = space();
    			div2 = element("div");
    			create_component(tour.$$.fragment);
    			t9 = space();
    			div8 = element("div");
    			div5 = element("div");
    			div5.textContent = "How to read this chart:";
    			t11 = space();
    			create_component(legend.$$.fragment);
    			t12 = space();
    			div6 = element("div");
    			t13 = text("Median under five-year mortality rates are taken from the ");
    			a0 = element("a");
    			a0.textContent = "official resource";
    			t15 = text(" of the UN Inter-agency Group for Child Mortality Estimation.");
    			t16 = space();
    			div7 = element("div");
    			img = element("img");
    			t17 = text("\n      Higsch Data Visuals,  ");
    			a1 = element("a");
    			a1.textContent = "Matthias Stahl";
    			t19 = text(", 2020");
    			t20 = space();
    			div10 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "red");
    			add_location(span0, file$d, 63, 38, 1852);
    			attr_dev(span1, "class", "red");
    			add_location(span1, file$d, 65, 44, 2037);
    			attr_dev(div0, "class", "text svelte-19azb41");
    			add_location(div0, file$d, 62, 4, 1795);
    			attr_dev(div1, "class", "tour-title");
    			add_location(div1, file$d, 69, 6, 2233);
    			attr_dev(div2, "class", "tour-countries");
    			add_location(div2, file$d, 70, 6, 2301);
    			attr_dev(div3, "class", "tour svelte-19azb41");
    			add_location(div3, file$d, 68, 4, 2208);
    			attr_dev(div4, "class", "intro svelte-19azb41");
    			add_location(div4, file$d, 61, 1, 1771);
    			attr_dev(div5, "class", "text svelte-19azb41");
    			add_location(div5, file$d, 76, 4, 2417);
    			attr_dev(a0, "href", "https://data.unicef.org/topic/child-survival/under-five-mortality/");
    			add_location(a0, file$d, 80, 85, 2651);
    			attr_dev(div6, "class", "data-info svelte-19azb41");
    			add_location(div6, file$d, 80, 4, 2570);
    			if (img.src !== (img_src_value = "logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "higsch-logo");
    			attr_dev(img, "class", "svelte-19azb41");
    			add_location(img, file$d, 82, 6, 2849);
    			attr_dev(a1, "href", "https://www.linkedin.com/in/matthias-stahl/");
    			add_location(a1, file$d, 83, 33, 2923);
    			attr_dev(div7, "class", "imprint svelte-19azb41");
    			add_location(div7, file$d, 81, 4, 2821);
    			attr_dev(div8, "class", "legend svelte-19azb41");
    			add_location(div8, file$d, 75, 1, 2392);
    			attr_dev(div9, "class", "info svelte-19azb41");
    			add_location(div9, file$d, 60, 0, 1751);
    			attr_dev(div10, "class", "wrapper svelte-19azb41");
    			add_render_callback(() => /*div10_elementresize_handler*/ ctx[18].call(div10));
    			add_location(div10, file$d, 87, 0, 3028);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div4);
    			append_dev(div4, div0);
    			append_dev(div0, t1);
    			append_dev(div0, span0);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(div0, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			mount_component(tour, div2, null);
    			append_dev(div9, t9);
    			append_dev(div9, div8);
    			append_dev(div8, div5);
    			append_dev(div8, t11);
    			mount_component(legend, div8, null);
    			append_dev(div8, t12);
    			append_dev(div8, div6);
    			append_dev(div6, t13);
    			append_dev(div6, a0);
    			append_dev(div6, t15);
    			append_dev(div8, t16);
    			append_dev(div8, div7);
    			append_dev(div7, img);
    			append_dev(div7, t17);
    			append_dev(div7, a1);
    			append_dev(div7, t19);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, div10, anchor);
    			if (if_block) if_block.m(div10, null);
    			div10_resize_listener = add_resize_listener(div10, /*div10_elementresize_handler*/ ctx[18].bind(div10));
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tour_changes = {};
    			if (dirty & /*data*/ 1) tour_changes.data = /*data*/ ctx[0];
    			tour.$set(tour_changes);
    			const legend_changes = {};
    			if (dirty & /*data*/ 1) legend_changes.data = /*data*/ ctx[0];
    			if (dirty & /*scMortRate*/ 256) legend_changes.scMortRate = /*scMortRate*/ ctx[8];
    			if (dirty & /*scReduction*/ 512) legend_changes.scReduction = /*scReduction*/ ctx[9];
    			legend.$set(legend_changes);

    			if (/*minDim*/ ctx[12] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div10, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tour.$$.fragment, local);
    			transition_in(legend.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tour.$$.fragment, local);
    			transition_out(legend.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			document.body.removeEventListener("click", /*click_handler*/ ctx[16]);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div9);
    			destroy_component(tour);
    			destroy_component(legend);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div10);
    			if (if_block) if_block.d();
    			div10_resize_listener.cancel();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const offset = 10;
    const angleOffset = 0;

    function instance$d($$self, $$props, $$invalidate) {
    	let { data } = $$props;
    	let { years } = $$props;
    	let selectedIso;
    	let rawWidth = offset;
    	let rawHeight = offset;
    	let scYearColor, scCountryAngle, scYearRadius, scMortRate, scReduction;

    	function initScales(minDim) {
    		$$invalidate(5, scYearColor = ordinal().domain(years).range(["#F40000", "rgb(236, 54, 9)", "rgb(245, 120, 86)"]));
    		$$invalidate(6, scCountryAngle = ordinal().domain(data.map(d => d.iso)).range(sequence(angleOffset, 2 * Math.PI - angleOffset, (2 * Math.PI - 2 * angleOffset) / data.length)));
    		$$invalidate(7, scYearRadius = linear$1().domain([years[0], years[years.length - 1]]).range([minDim / 5, minDim / 2.4 - padding]));

    		$$invalidate(8, scMortRate = linear$1().domain([
    			0,
    			1.2 * max([].concat(...data.map(d => d.dataArr.filter(d => years.includes(d.year)).map(d => d.value))))
    		]).range([0, minDim / 9]));

    		$$invalidate(9, scReduction = linear$1().domain(extent(data.map(d => d.reduction))).range([
    			Math.min(scYearRadius(years[years.length - 1]) + reductionOffset, minDim / 2 - padding),
    			minDim / 2 - padding
    		]));
    	}

    	const writable_props = ["data", "years"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Flower> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, selectedIso = undefined);
    	const isochanged_handler = e => $$invalidate(2, selectedIso = e.detail);

    	function div10_elementresize_handler() {
    		rawWidth = this.offsetWidth;
    		rawHeight = this.offsetHeight;
    		$$invalidate(3, rawWidth);
    		$$invalidate(4, rawHeight);
    	}

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("years" in $$props) $$invalidate(1, years = $$props.years);
    	};

    	$$self.$capture_state = () => {
    		return {
    			data,
    			years,
    			selectedIso,
    			rawWidth,
    			rawHeight,
    			scYearColor,
    			scCountryAngle,
    			scYearRadius,
    			scMortRate,
    			scReduction,
    			padding,
    			reductionOffset,
    			width,
    			height,
    			minDim
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("years" in $$props) $$invalidate(1, years = $$props.years);
    		if ("selectedIso" in $$props) $$invalidate(2, selectedIso = $$props.selectedIso);
    		if ("rawWidth" in $$props) $$invalidate(3, rawWidth = $$props.rawWidth);
    		if ("rawHeight" in $$props) $$invalidate(4, rawHeight = $$props.rawHeight);
    		if ("scYearColor" in $$props) $$invalidate(5, scYearColor = $$props.scYearColor);
    		if ("scCountryAngle" in $$props) $$invalidate(6, scCountryAngle = $$props.scCountryAngle);
    		if ("scYearRadius" in $$props) $$invalidate(7, scYearRadius = $$props.scYearRadius);
    		if ("scMortRate" in $$props) $$invalidate(8, scMortRate = $$props.scMortRate);
    		if ("scReduction" in $$props) $$invalidate(9, scReduction = $$props.scReduction);
    		if ("padding" in $$props) padding = $$props.padding;
    		if ("reductionOffset" in $$props) reductionOffset = $$props.reductionOffset;
    		if ("width" in $$props) $$invalidate(10, width = $$props.width);
    		if ("height" in $$props) $$invalidate(11, height = $$props.height);
    		if ("minDim" in $$props) $$invalidate(12, minDim = $$props.minDim);
    	};

    	let width;
    	let height;
    	let minDim;
    	let padding;
    	let reductionOffset;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*rawWidth*/ 8) {
    			 $$invalidate(10, width = rawWidth - offset);
    		}

    		if ($$self.$$.dirty & /*rawHeight*/ 16) {
    			 $$invalidate(11, height = rawHeight - offset);
    		}

    		if ($$self.$$.dirty & /*width, height*/ 3072) {
    			 $$invalidate(12, minDim = Math.min(width, height));
    		}

    		if ($$self.$$.dirty & /*minDim*/ 4096) {
    			 padding = minDim / 40;
    		}

    		if ($$self.$$.dirty & /*minDim*/ 4096) {
    			 reductionOffset = minDim / 40;
    		}

    		if ($$self.$$.dirty & /*data, years, minDim*/ 4099) {
    			 if (data && years) initScales(minDim);
    		}

    		if ($$self.$$.dirty & /*selectedIso*/ 4) {
    			 console.log(selectedIso);
    		}
    	};

    	return [
    		data,
    		years,
    		selectedIso,
    		rawWidth,
    		rawHeight,
    		scYearColor,
    		scCountryAngle,
    		scYearRadius,
    		scMortRate,
    		scReduction,
    		width,
    		height,
    		minDim,
    		padding,
    		reductionOffset,
    		initScales,
    		click_handler,
    		isochanged_handler,
    		div10_elementresize_handler
    	];
    }

    class Flower extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { data: 0, years: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Flower",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console_1.warn("<Flower> was created without expected prop 'data'");
    		}

    		if (/*years*/ ctx[1] === undefined && !("years" in props)) {
    			console_1.warn("<Flower> was created without expected prop 'years'");
    		}
    	}

    	get data() {
    		throw new Error("<Flower>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Flower>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get years() {
    		throw new Error("<Flower>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set years(value) {
    		throw new Error("<Flower>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$e = "src/App.svelte";

    // (35:2) {#if data}
    function create_if_block$4(ctx) {
    	let current;

    	const flower = new Flower({
    			props: {
    				data: /*data*/ ctx[0],
    				years: /*years*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flower.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flower, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const flower_changes = {};
    			if (dirty & /*data*/ 1) flower_changes.data = /*data*/ ctx[0];
    			flower.$set(flower_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flower.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flower.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flower, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(35:2) {#if data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div2;
    	let div0;
    	let h1;
    	let t1;
    	let div1;
    	let current;
    	let if_block = /*data*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "The circle of hope";
    			t1 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(h1, "class", "svelte-6hy0c9");
    			add_location(h1, file$e, 31, 2, 616);
    			attr_dev(div0, "class", "header svelte-6hy0c9");
    			add_location(div0, file$e, 30, 1, 593);
    			attr_dev(div1, "id", "visual");
    			attr_dev(div1, "class", "svelte-6hy0c9");
    			add_location(div1, file$e, 33, 1, 653);
    			attr_dev(div2, "class", "wrapper svelte-6hy0c9");
    			add_location(div2, file$e, 29, 0, 570);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	const years = [1998, 2008, 2018];
    	let data;

    	async function load() {
    		$$invalidate(0, data = await csv$1("child_mortality.csv", d => {
    			const dataArr = [];

    			const returnObj = {
    				iso: d.iso,
    				country: d.country,
    				reduction: +d.reduction,
    				continent: d.continent
    			};

    			for (let key in d) {
    				if (key.match("^19|^20")) dataArr.push({ year: +key, value: +d[key] });
    			}

    			returnObj["dataArr"] = dataArr;
    			return returnObj;
    		}));
    	}

    	load();

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	return [data, years];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
