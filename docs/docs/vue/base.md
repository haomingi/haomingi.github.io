# 双向绑定之前
在_init方法最后，会调用vm.$mount(vm.$options.el)，进行挂载，此时调用的是：

```
const mount = Vue.prototype.$mount // runtime/index.js
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {}
```
此时有一个mount备份,然后重新定义了$mount,$mount方法主要做的就是判断当前是否定义了render函数，没有定义的话拿template转化一个render函数，挂载到vm实例上面。然后调用mount备份函数

```
return mount.call(this, el, hydrating)
```
mount函数源码：

```
Vue.prototype.$mount = function (
  el?: any,
  hydrating?: boolean
): Component {
  return mountComponent(
    this,
    el && query(el, this.$document),
    hydrating
  )
}
```
mountComponent函数就是主要的函数挂载逻辑了（lifecycle.js）,核心代码以下两个：
```
<一>
updateComponent = () => {
    // vm._render()生成虚拟dom 然后更新
    vm._update(vm._render(), hydrating)
}
<二>
new Watcher(vm, updateComponent, noop, {
    before () { // 意思就是之前运行，触发钩子
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
}, true /* isRenderWatcher */)
```
**new Watcher 创建时候传入的第二个参数就是当前watcher被通知时候要调用的函数**

创建Watcher实例，传入vm、updateComponent，构造函数运行时候，把updateComponent赋值给了watch实例的getter上，**当调用this.get()时候，先把当前watch赋值给Dep.target上，在直接调用了this.getter.call(vm,vm)=>updateComponent，传入的第五个参数确定了当前watcher为renderWatcher。**

**updateComponent先调用了vm._render()生成虚拟dom，这个时候就是一次全局取数，renderWatcher与依赖的数据建立了依赖，vm._update()会根据虚拟dom，更新视图。**

当renderWatcher被依赖的数据通知发生改变的时候，默认调用renderWatcher上的update方法

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
queueWatcher对当前renderWatcher判断，防止多次调用，之后调用.run()方法，又一次调用了this.get()，此时在一次走上方加粗内容的逻辑，形成一个创建、更新的闭环。
