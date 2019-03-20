import { TreeNode } from './types/Node'
import { TreeComponent } from './types/Tree'
import { State } from './types/State'
import { CheckboxValueConsistency } from './types/Tree'

import { isString, isNodeCheckable, isLeaf } from './utils/index'
import { find } from './utils/find'
import { walkBreadth } from './utils/traveler'

export class TreeAPI {
  private state: State
  private tree: TreeComponent

  constructor(tree: TreeComponent, state: State) {
    this.tree = tree
    this.state = state
  }

  data(query: any, key: any, value?: any): any {
    const node: TreeNode | null = this.find(query)

    if (!node || !key) {
      return
    }

    if (undefined === value && isString(key)) {
      return node.data[key]
    }

    let data

    if (!isString(key)) {
      data = key
    } else {
      node.data[key] = value
      data = node.data
    }

    this.state.set(node.id, 'data', data)
    this.tree.updateState(this.state)

    return node
  }

  set(query: any, key: string, value: any): boolean {
    const node = this.find(query)

    if (!node) {
      return false
    }

    // TODO: selected, checked should be dublicated in the tree state
    this.state.set(node.id, key, value)
    this.tree.updateState(this.state)

    return true
  }

  find(...criterias: any): TreeNode | null {
    return find(this.state.get(), walkBreadth, false, criterias)
  }

  findAll(...criterias: any): TreeNode[] {
    return find(this.state.get(), walkBreadth, true, criterias)
  }

  selected(): TreeNode[] | TreeNode | null {
    const state = this.state
    const selected: Array<TreeNode | null> = this.tree.selected
      .map((id: string): TreeNode | null => state.byId(id))

    if (true !== this.tree.props.multiple) {
      return selected.length ? selected[0] : null
    }

    return selected.filter((item: TreeNode | null) => null !== item) as TreeNode[]
  }

  checked(valueConsistsOf?: CheckboxValueConsistency, showDisabled?: boolean): TreeNode[] {
    const state = this.state
    let checked: TreeNode[] = []

    this.tree.checked.forEach((id: string) => {
      const node = state.byId(id)

      if (node) {
        checked.push(node)
      }
    })

    if ('WITH_INDETERMINATE' === valueConsistsOf) {
      this.tree.indeterminate.forEach((id: string) => {
        const node = state.byId(id)
  
        if (node) {
          checked.push(node)
        }
      })
    }

    if (!showDisabled) {
      checked = checked.filter(isNodeCheckable)
    }

    switch(valueConsistsOf) {
      case 'LEAF': return checked.filter((node: TreeNode) => isLeaf(node))
      case 'BRANCH': 
        return checked.filter((node: TreeNode) => {
          if (node.parent && node.parent.checked) {
            return false
          }

          return true
        })
    }

    return checked
  }

  // TODO:
  toArray(): TreeNode[] {
    return this.state.get()
  }
}