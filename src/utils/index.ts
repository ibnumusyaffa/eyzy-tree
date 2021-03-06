import { TreeNode } from '../types/Node'

export const hasOwnProp = {}.hasOwnProperty

export function toArray(value: any): any[] {
  return isArray(value) ? value : [value]
} 

export function callFetcher(node: TreeNode, fn: any): PromiseLike<any> {
  if (!isCallable(fn)) {
    throw new TypeError('"fetcher" it must be either function or promise')
  }

  const result = isFunction(fn) ? fn(node) : fn

  if (!result || !result.then) {
    throw new TypeError('"fetcher" property must return a Promise')
  }

  return result
}

export function grapObjProps(obj: any, props: string[]) {
  return props.reduce((result: any, name: string) => {
    if (name in obj) {
      result[name] = obj[name]
    }

    return result
  }, {});
}

export function isObject(obj: any) {
  return obj != null && typeof obj === 'object' && !Array.isArray(obj)
}

export function isString(obj: any): boolean {
  return 'string' === typeof obj
}

export function isRegExp(obj: any): boolean {
  return obj instanceof RegExp
}

export function isBoolean(obj: any): boolean {
  return 'boolean' === typeof obj
}

export function isArray(obj: any): boolean {
  return Array.isArray(obj)
}

export function isExpandable(node: TreeNode): boolean {
  return !!(node.child && node.child.length) || !!node.isBatch
}

export function isCheckable(node: TreeNode): boolean {
  return !(!!node.disabled || !!node.disabledCheckbox)
}

export function isFunction(value: any): boolean {
  return 'function' === typeof value 
}

export function isCallable(value: any): boolean {
  return isFunction(value) || (value && !!value.then)
}

export function isEmpty(value: any): boolean {
  if (isArray(value)) {
    return value.length === 0
  }

  return !value
}

export function get(obj: any, path: any): any {
  if (!obj) {
    return void 0
  }

  if (!isArray(path)) {
    path = path.split('.')
  }

  const len: number = path.length
  let i: number = 0

  while (obj != null && i < len) {
    obj = obj[path[i++]]
  }

  return i && i === len ? obj : undefined
}

export function has(targetArray: any[], targetValue: any): boolean {
  return !!~targetArray.indexOf(targetValue)
}

export function copyArray<T>(arr: T[]): T[] {
  return arr.concat([])
}

export function copy(obj: any): any {
  const result = isArray(obj) ? [] : {}

  for (const key in obj) {
    if ('parent' === key) {
      continue
    }

    if (hasOwnProp.call(obj, key)) {
      const value: any = obj[key]
      result[key] = (typeof value === "object") ? copy(value) : value
    }
  }

  return result
}

export function copyObject(obj: any) {
  const newObj = {}

  for (const i in obj) {
    if (hasOwnProp.call(obj, i)) {
      newObj[i] = isArray(obj[i]) ? copyArray(obj[i]) : obj[i]
    }
  }

  return newObj
}

export function remove(targetArr: any[], targetItem: any) {
  const index: number = targetArr.indexOf(targetItem)

  if (~index) {
    targetArr.splice(index, 1)
  }
}

export function isRoot(node: TreeNode): boolean {
  return node && !node.parent
}

export function isLeaf(node: TreeNode): boolean {
  return !node.child || (0 === node.child.length && !node.isBatch)
}

export function isNodeIndeterminate(node: TreeNode, treeCheckedNodes: string[], indeterminateNodes: string[]): boolean {
  if (!node.child.length) {
    return false
  }

  const hasIndeterminate: boolean = node.child.some((child: TreeNode) => {
    return !child.disabled && !child.disabledCheckbox && -1 !== indeterminateNodes.indexOf(child.id)
  })

  if (hasIndeterminate) {
    return true
  }

  const uncheckedNodes = node.child.reduce((count: number, item: TreeNode) => {
    if (true !== item.disabled && true !== item.disabledCheckbox && -1 === treeCheckedNodes.indexOf(item.id)) {
      count++
    }

    return count
  }, 0)

  return uncheckedNodes > 0 && uncheckedNodes < node.child.length
}
