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
