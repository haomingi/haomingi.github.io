# watch对象初始化
```
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}
```
**initWatch中拿到组件定的watch对象，循环拿到key/handler（key=>要监听的字段名,handler是字段改变回调）。**

createWatcher函数根据传入的key/handler创建watcher实例

```
Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    判断此监听事件是否立即执行
    if (options.immediate) {
      try {
        cb.call(vm, watcher.value)
      } catch (error) {
        handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
```
**const watcher = new Watcher(vm, expOrFn, cb, options)**
传入vm key handler，watcher构造函数运行时候会调用this.get(),把当前watch实例赋值给Dep.target,调用this.getter.call(vm,vm)也就是直接调用vm.key，完成一次对监听字段的取数，调用了key的get方法，使key对应的dep与当前watch完成绑定。

# this.$watch
在created/mounted中动态创建watch时候，因为创建的时间在renderWatch之后，所以watch.id大于renderWatch，定义的watch与renderWatch同时触发的时候，renderWatch会先走。

# 修改watch

```
if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
      debugger
      this.dynamic = options.dynamic
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = this.dynamic ? --dynamicUid : ++uid // uid for batching
    
    this.$watch('a', function (newVal, oldVal) {
      // 做点什么
      console.log('watch2')
    }, { dynamic: true })
```

1. 默认情况动态watch是在renderWatch之后走。此处添加一个dynamic字段，设置watch.id小于0，但是此多个watch顺序无法控制。
2. flushSchedulerQueue中针对quque数组排序的时候，把vm._watcher上的renderWatch放到数组最后面，最后调用。在默认queue.sort之后添加下面四行。

```
queue.sort((a, b) => a.id - b.id)
// 处理动态watch与renderWatch顺序
let renderWatch = queue[0].vm._watcher || { id: 0 }
let renderWatchIndex = queue.findIndex((item) => item.id === renderWatch.id)
queue.splice(renderWatchIndex, 1)
queue.push(renderWatch)
```


**可以给一个字段设置多个watch**
