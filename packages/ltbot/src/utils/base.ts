import { ElMessage } from 'element-plus'
// import { VNode } from 'vue'
// import { MessageType } from 'element-plus'

// 弹框 接口
interface Win {
  /*
  * des: 弹框提示信息
  * @param message 提示内容
  * @param type 类型
  */
  msg(message: string, type ?: any): void
}

interface Util {
  shallowCopy(src: Array<any>): any
  deepCopy(src: any, map?: any): any
  deepClone(src: any): any
}

export class Base {
  win: Win = {
    msg(message:string, type:any) {
      ElMessage({
        message: message,
        type: type || 'warning'
      })
    }
  };
  util: Util = {
    shallowCopy: (obj: any) => {
      if (typeof obj !== 'object') return
      let newObj: any = obj instanceof Array ? [] : {}
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          newObj[key] = obj[key];
        }
      }
      return newObj
    },
    deepCopy: (target: any, map = new Map()) => {
      // 防止循环引用
      if (map.get(target)) {
        return target
      }
      if (isObject(target)) {
        map.set(target, true)
        const cloneTarget = Array.isArray(target) ? []: {};
        for (let prop in target) {
          if (target.hasOwnProperty(prop)) {
              cloneTarget[prop] = (typeof target[prop] === 'object' ? this.util.deepCopy(target[prop]) : target[prop]);
          }
        }
        return cloneTarget;
      } else {
        return target;
      }
    },
    deepClone: (target) => {
      let cloneTarget
      if (!isObject(target)) return target
      let type = Object.prototype.toString.call(target)
      if(!canTraverse[type]) {
        // 处理不能遍历的对象
        return handleNotTraverse(target, type)
      } else {
        // 这波操作相当关键，可以保证对象的原型不丢失！
        let ctor = target.constructor;
        cloneTarget = new ctor();
        console.log('type', type)
      }
      // Map类型
      if (type === '[object Map]') {
        target.forEach((item, key) => {
          cloneTarget.set(this.util.deepClone(key), this.util.deepClone(item));
        })
      }

      // Set结构
      if (type === '[object Set]') {
        target.forEach((item, key) => {
          cloneTarget.add(this.util.deepClone(item));
        })
      }

      // 普通对象 数组
      for (let prop in target) {
        if (target.hasOwnProperty(prop)) {
            cloneTarget[prop] = (typeof target[prop] === 'object' ? this.util.deepClone(target[prop]) : target[prop]);
        }
      }
      return cloneTarget;
    }
  }
}
const isObject = (target) => { return (typeof target === 'object' || typeof target === 'function') && target !== null }
const canTraverse = {
  '[object Map]': true,
  '[object Set]': true,
  '[object Array]': true,
  '[object Object]': true,
  '[object Arguments]': true,
}
const handleRegExp = (target) => {
  const { source, flags } = target;
  return new target.constructor(source, flags);
}
const handleNotTraverse = (target, tag) => {
  let ctor = target.constructor;
  return new ctor(target)
}

const base = new Base()
export default base