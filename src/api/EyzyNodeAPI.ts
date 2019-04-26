import { IEyzyNodeAPI, APIOpts } from '../types/Api'
import { TreeComponent, TreeProps, TreeAPI } from '../types/Tree'
import { TreeNode } from '../types/Node'
import { State } from '../types/State'

import { hasChild } from './utils'
import { InsertOptions } from 'src/types/Core';

export default class EyzyNode implements IEyzyNodeAPI {
  _tree: TreeComponent
  _props: TreeProps
  _state: State
  _api: TreeAPI
  _nodes: TreeNode[]
  _opts: APIOpts

  constructor(nodes: TreeNode[] | TreeNode | null, api: TreeAPI, opts: APIOpts) {
    this._api = api
    this._state = api.state
    this._tree = api.tree
    this._props = api.tree.props
    this._nodes = Array.isArray(nodes) 
      ? nodes 
      : (nodes ? [nodes] : [])
    this._opts = opts
  }

  get length(): number {
    return this._nodes.length
  }

  get result(): TreeNode[] | null {
    return this._nodes.length ? this._nodes : null
  }

  private isSilence() {
    return this._opts && this._opts.silence
  }

  private _operate(updateState: boolean, operator: (node: TreeNode, state: State) => any): boolean {
    if (this.isSilence()) {
      this._tree.silence = true
    }

    const result: boolean = this._nodes
      .map((node: TreeNode) => operator(node, this._state))
      .every(res => false !== res)

    if (updateState) {
      this._tree.updateState(this._state)
    }

    if (this.isSilence()) {
      this._tree.silence = false
    }

    return this._nodes.length == 0 ? false : result
  }

  remove(): boolean {
    return this._operate(false, (node: TreeNode, state: State): any => {
      return this._api.remove(node.id)
    })
  }

  empty(): boolean {
    return this._operate(true, (node: TreeNode, state: State): any => {
      if (!hasChild(node)) {
        return false
      }

      this._api.core.clearKeys(node, true)

      state.set(node.id, {
        child: [],
        indeterminate: false,
        isBatch: false
      })

      if (node.parent) {
        this._tree.refreshDefinite(node.id, !!node.checked, false)
      }
    })
  }

  select(extendSelection?: boolean): boolean {
    return this._operate(false, (node: TreeNode): any => {
      if (node.selected) {
        return false
      }

      if (this._props.multiple) {
        this._tree.select(node, false, extendSelection)
      } else {
        this._tree.select(node)
      }
    })
  }

  unselect(): boolean {
    return this._operate(false, (node: TreeNode): any => {
      if (!node.selected) {
        return false
      }

      this._tree.unselect(node)
    })
  }

  check(): boolean {
    if (!this._props.checkable) {
      return false
    }

    return this._operate(false, (node: TreeNode): any => {
      if (node.checked) {
        return false
      }

      this._tree.check(node)
    })
  }

  uncheck(): boolean {
    if (!this._props.checkable) {
      return false
    }

    return this._operate(false, (node: TreeNode, state: State): any => {
      if (!node.checked) {
        return false
      }

      this._tree.check(node)
    })
  }

  disable(): boolean {
    return this._operate(true, (node: TreeNode, state: State): any => {
      if (node.disabled) {
        return false
      }

      state.set(node.id, 'disabled', true)
    })
  }

  enable(): boolean {
    return this._operate(true, (node: TreeNode, state: State): any => {
      if (!node.disabled) {
        return false
      }

      state.set(node.id, 'disabled', false)
    })
  }

  disableCheckbox(): boolean {
    if (!this._props.checkable) {
      return false
    }

    return this._operate(true, (node: TreeNode, state: State): any => {
      if (node.disabledCheckbox) {
        return false
      }

      state.set(node.id, 'disabledCheckbox', true)
    })
  }

  enableCheckbox(): boolean {
    if (!this._props.checkable) {
      return false
    }

    return this._operate(true, (node: TreeNode, state: State): any => {
      if (!node.disabledCheckbox) {
        return false
      }

      state.set(node.id, 'disabledCheckbox', false)

      if (hasChild(node) && this._props.useIndeterminateState) {
        const iNode: TreeNode = node.checked
          ? node
          : node.child[0]

        this._tree.refreshDefinite(iNode.id, !!iNode.checked, false)
      }
    })
  }

  expand(includingDisabled?: boolean): boolean {
    return this._operate(false, (node: TreeNode): any => {
      if (!hasChild(node) || node.expanded) {
        return false
      }

      this._tree.expand(node, includingDisabled)
    })
  }

  collapse(includingDisabled?: boolean): boolean {
    return this._operate(false, (node: TreeNode): any => {
      if (!hasChild(node) || !node.expanded) {
        return false
      }

      this._tree.expand(node, includingDisabled)
    })
  }

  data(key: any, value?: any): any {
    const nodes = this._nodes
    
    if (1 === nodes.length) {
      return this._api.core.data(nodes[0], key, value)
    }

    return nodes.map((node: TreeNode) => this._api.core.data(node, key, value))
  }

  hasClass(className: string): boolean {
    return this._nodes.some((node: TreeNode) => this._api.core.hasClass(node, className))
  }

  addClass(classNames: string | string[]): boolean {
    this._nodes.forEach((node: TreeNode) => this._api.core.addClass(node, classNames))

    return true
  }

  removeClass(classNames: string | string[]): boolean {
    return this._operate(false, (node: TreeNode) => {
      if (!node.className) {
        return
      }

      const oldClassNames = node.className
      const updatedNode = this._api.core.removeClass(node, classNames)

      return oldClassNames !== updatedNode.className
    })
  }

  append(source: any, opts?: InsertOptions): any {
    return this._operate(false, (node: TreeNode) => {
      return this._api.core.insert(node, source, opts)
    })
  }
  
  prepend(source: any, opts?: InsertOptions): any {
    return this._operate(false, (node: TreeNode) => {
      return this._api.core.insert(node, source, Object.assign({}, opts, {index: 0}))
    })
  }
  
  before(source: any): any {
    return this._operate(false, (node: TreeNode) => {
      return this._api.core.beside(node, source, 0)
    })
  }

  after(source: any): any {
    return this._operate(false, (node: TreeNode) => {
      return this._api.core.beside(node, source, 1)
    })
  }

  _find<T>(query: any, multiple: boolean): T | null {
    const core = this._api.core
    const nodes = core
      .flatMap(this._nodes)
      .nodes
      .filter((node: TreeNode) => !~this._nodes.indexOf(node))

    return core.find<T>(nodes, multiple, query)
  }

  find(query: any): IEyzyNodeAPI {
    const node: TreeNode | null = this._find<TreeNode>(query, false)
    return new EyzyNode(node ? [node] : [], this._api, this._opts)
  }

  findAll(query: any): IEyzyNodeAPI {
    const nodes: TreeNode[] | null = this._find<TreeNode[]>(query, true)
    return new EyzyNode(nodes && nodes.length ? nodes : [], this._api, this._opts)
  }
}