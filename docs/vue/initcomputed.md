# 计算属性初始化
```
const computedWatcherOptions = { lazy: true }

function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      // 其实就是添加一个watcher，每添加一个，this.watchers中就多一个，可以试试。
      // computedWatcherOptions 定义懒惰watcher
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}
```
# 包装回调函数
**此处显示使用computedWatcherOptions定义了一个lazy字段，此字段用在创建watch时候，进行代码状态的区分！**

- 判断_computedWatchers函数是否存在，不存在了创建，存入vm中。
- 循环computed，拿到key/userDef。
- 判断是否服务端渲染。
- 根据key/userDef/computedWatcherOptions，创建watcher实例，存入vm._computedWatchers对象中。
- 判断计算属性key是否与props/data命名冲突，目的是此处会在vm上创建一个以计算属性名称一致的字段，用以保存计算属性计算值（快照）。第一次计算属性计算完成之后，不发生改变的情况下，之后的renderWatcher渲染时候都从此处取值，不会从新调用计算属性函数计算结果。

**此处watcher创建有不同之处！**

默认情况下watch构造函数运行的时候回默认调用this.get()去进行依赖收集，此处传递的computedWatcherOptions.lazy会阻止这一行为，**同时维护一个dirty去控制watch调用get函数**。

**目的是有些时候定义了一个计算属性，但是在当前模板中没有使用，此处直接去绑定就会是无效操作。**

# vm上创建字段

```
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    直接传递进来get set方法的情况
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  // 在vm上创建一个computed名字一样的字段 添加get方法
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter (key) {
  return function computedGetter () {
    // 取到watcher
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // dirty为true的时候，进行一次取数，双方绑定依赖
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // dep watcher关系以及绑定
      // 看此时还有顶层watcher没有，有了接着绑定。这个是针对绑定组件watcher，当计算属性依赖的字段改变时，出了依赖组件被通知，外侧watcher也被通知了！！！
      if (Dep.target) {
        // 与deps绑定依赖
        watcher.depend()
      }
      return watcher.value
    }
  }
}
```
此处是在vm上创建一个跟计算属性名称一样的字段（key）,同时只给此字段添加一个get方法（computedGetter），如果定义的时候自己配置的有set/get就用自己定的。

**此处代码完成，此时仍没有进行依赖绑定。**
# createComputedGetter
此函数调用的返回函数computedGetter就是vm.key的get函数，当renderWatcher进行依赖绑定的时候，获取计算属性值，此函数会运行。
- 取到vm._computedWatchers上存储的watcher
- 判断watcher.dirty，这个字段就是判断watcher是否需要计算值
- watcher.evaluate()运行调用this.get()，设置Dep.target，运行计算属性的函数，此次函数运行会对内部依赖的字段进行取值，双方建立依赖关系。获取函数运行结果，赋值给vm.key
- this.dirty = false，关闭watch运行状态。模板中多次用一个计算属性时候，只有第一次计算属性函数会运行，之后就不会运行。
- watcher.get()方法，会先设置设置Dep.target = 当前watcher，双方依赖绑定之后会调用popTarget()，把当前watcher移除Dep.target

```
export function popTarget () {
  // 删除最后一个watcher
  targetStack.pop()
  // 看前面是不是还有watcher
  Dep.target = targetStack[targetStack.length - 1]
}
```
**此时需要注意！**

当前computedGetter运行是因为renderWatcher在进行取数，所以在computedGetter运行前，Dep.target=renderWatcher，renderWatcher备份存储在==targetStack==中，computedGetter运行后，使用计算属性watch替换了Dep.target，targetStack中就存储了两个watcher[renderWatcher, 计算属性watch]

popTarget函数调用，移除了计算属性watch，同时把renderWatcher赋值给Dep.target

```
computedGetter函数中的这段代码
if (Dep.target) {
    // 与deps绑定依赖
    watcher.depend()
  }
```
此处Dep.target等于renderWatcher，取到计算属性watcher依赖的deps，与当前Dep.targt（renderWatcher），建立依赖关系！！！

因此！此处进行了两次watcher依赖绑定。计算属性使用的字段与计算属性watch绑定，计算属性使用的字段与renderWatcher，当字段发生改变时候，根据存储的watcher先后顺序，先通知计算属性watch，在通知renderWatcher。


```
update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }
```
字段deps通知watch，会判断this.lazy，把当前计算属性watch的dirty更改，使其重新计算结果。
# example
当组件中先使用了a变量，之后才有计算属性也是有a变量，根据先后顺序，是a变量先跟renderWatcher建立依赖，然后renderWatcher取数到计算属性的时候，a与计算属性建立依赖。

那么当a发生数据改变的时候，也是根据先后顺序触发renderWatcher、计算属性watcher。

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
flushing默认是false，只有当flushSchedulerQueue开始运行的时候改为true，在这个时候如果某个更新触发了数据更改，queueWatcher重新走了，就直接插入到queue中，看下方代码。

此处：

```
while (i > index && queue[i].id > watcher.id) {
    i--
  }
```
会判断当前已存储queue[i].id与当次存入watcher.id的大小，找到存储watch的位置，id小的放到前面去先调用。
- watch、计算属性、renderWatcher，以上三个都触发的时候，运行顺序。
- 计算属性watch最先创建、watch、renderWatcher
- 计算属性watch创建之后没有与数据绑定，最先绑定的是watch
- 创建的字段在三个watcher中都使用的时候，如果根据例子的顺序，字段deps[watch, renderWatcher, 计算属性watch]
- flushSchedulerQueue函数会对维护的queue排序，queue.sort((a, b) => a.id - b.id)
- 排序之后计算属性在前，之后是watch，最后是renderWatcher

遗留问题：
排序之后计算属性watch在最前面，因为id最小，但是实际运行时候watch最先走！
