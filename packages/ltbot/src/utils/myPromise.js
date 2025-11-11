/*
1.函数的延迟绑定，then里面的函数之后才会执行
2.函数的返回值穿透，then链式调用then，是一个then回把Promise对象返回
3.错误处理合并
*/
// 先定义三个常量表示状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
class MyPromise {
  constructor(executor) {
    try {
      executor(this.resolve, this.reject)
    } catch(error) {
      this.reject(error)
    }
  }
  // 状态 成功值 失败值
  status = PENDING
  value = null
  reason = null

  // 函数回调
  onFulfilledCallback = []
  onRejectedCallback = []

  // 成功状态
  resolve = (value) => {
    // 状态修改 值保存
    if (this.status === PENDING) {
      // debugger
      this.status = FULFILLED
      this.value = value
      while (this.onFulfilledCallback.length) {
        // Array.shift() 取出数组第一个元素，然后（）调用，shift不是纯函数，取出后，数组将失去该元素，直到数组为空
        this.onFulfilledCallback.shift()(value)
      }
    }
  }
  // 失败状态
  reject = (reason) => {
    // 状态修改 值保存
    if (this.status === PENDING) {
      this.status = REJECTED
      this.reason = reason
      while (this.onRejectedCallback.length) {
        this.onRejectedCallback.shift()(reason)
      }
    }
  }
  // then 返回值穿透
  then(onFulfilled, onRejected) {
    // let p2 = new Promise(() => {})
    let p2 = new Promise((resolve, reject) => {
      if (this.status === FULFILLED) {
        // 成功后执行
        let x = onFulfilled(this.value)
        resolvePromise(p2, x, resolve, reject)
      } else if (this.status === REJECTED) {
        onRejected(this.reason)
      } else {
        this.onFulfilledCallback.push(onFulfilled)
        this.onRejectedCallback.push(onRejected)
      }
    })
    return p2
  }
}

function resolvePromise(p2, x, resolve, reject) {
  // x本身就是一个Promise对象
  if (p2 === x) return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  if (x instanceof MyPromise) {
    x.then(resolve, reject)
  } else {
    resolve(x)
  }
}
export default MyPromise