# 双向绑定
在_init()调用的时候有一个initState()此时对组件内部定义的内容进行初始化

```
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  // 初始化的顺序
  // 1
  if (opts.props) initProps(vm, opts.props)
  // 2
  if (opts.methods) initMethods(vm, opts.methods)
  // 3
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  // 4
  if (opts.computed) initComputed(vm, opts.computed)
  // 5
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```
顺序按照上方的1-5，现在主要看initData()

```
function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  // 判断props中的变量是否与data重复
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  observe(data, true /* asRootData */)
}
```
initData中先获取当时组件上面定义的data，这个时候进行一个data类型的判断，data默认应该是一个函数返回一个对象，这样处理是为了在该组件多次调用时候，数据不会互相影响。

之后while循环判断props中的变量是否与data重复，一切正常调用observe函数

```
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 挂载了就直接取
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```
先判断observe是否创建（__ob__有没有），创建了就直接取，没有的话new一个

```
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}
```
Observer函数先存储自身，def(value, '__ob__', this)，之后针对于data进行判断。

是数组的话循环给每一项调用observe，此处会针对于数组修改默认的数组方法，使vue能够监听数组数据改变。

是对象，循环给每个字段调用defineReactive(obj, keys[i])，defineReactive主要逻辑：

```
const dep = new Dep()
const property = Object.getOwnPropertyDescriptor(obj, key)
Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      // 组件里面取值时候没有watcher
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      // 计算属性
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
```
对每个传入的字段，都创建一个**dep**，**看当前字段是否可修改**，都添加set、get方法
# get方法
get方法调用分为两次情况，一种是Watcher建立依赖时候，一种是组件内容取值调用，**是通过Dep.target判断，此字段觉得了是否走后面的依赖建立逻辑**。

```
get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      // 组件里面取值时候没有watcher
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
}
```
dep.depend()会调用Dep.target中存储的watcher，watcher判断下与当前dep是否建立过一次（模板中多次用一个字段），就是看当前dep的id在watcher里面存没存过，如果没有建立依赖，watcher存储dep，调用dep.addSub(this),使dep存储watcher，此时双方依赖建立完成。
# set方法

```
set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      // 计算属性
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
```
先判断新旧值是否一直，判断当前字段是否有setter方法，没有就返回。
更新数据，dep循环通知存储的watcher，watcher进行queue处理。

```
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      nextTick(flushSchedulerQueue)
    }
  }
}
```

queue会判断当前watcher是否已经被queue存下(就是存下watch.id),没有处理就把watcher加入到queue数组中，此处有waiting判断，只会调用nextTick一次，之后调用queueWatcher就是存储到queue数组中去(事件循环中修改多个字段时候每个字段都会通知一次)。

flushSchedulerQueue运行时候会循环调用queue数组中的每一个watcher.run()运行，重新触发this.get()，触发创建watch时候传入的第二个参数this.getter.call(vm,vm)。example:renderWatcher运行的是updateComponent。
# nextTick
nextTick函数重点是在浏览器运行时候区分环境，此处判断是使用微任务还是宏任务。

```
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Techinically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```
看是否支持promise/MutationObserver/setImmediate/setTimeout，此处需要知道微任务运行的比宏任务早，判断目的就是为了尽快运行。


