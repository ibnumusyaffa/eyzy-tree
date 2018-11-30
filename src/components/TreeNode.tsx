import React from 'react'
import { Node } from '../types/Node'

import cn from '../utils/cn'

const hasChild = (node: Node): boolean => {
  return Array.isArray(node.child) && node.child.length > 0
}

export default class TreeNode extends React.PureComponent<Node> {
  getNode(): Node {
    const {
      id,
      checked,
      selected,
      text,
      child,
      expanded,
      disabled
    } = this.props

    return {
      id,
      checked,
      selected,
      text,
      child,
      expanded,
      disabled
    }
  }

  handleSelect = () => {
    if (this.props.disabled) {
      return
    }

    if (this.props.onSelect) {
      this.props.onSelect(this.getNode())
    }
  }

  handleCheck = () => {
    if (this.props.disabled || this.props.disabledCheckbox) {
      return
    }

    if (this.props.onCheck) {
      this.props.onCheck(this.getNode())
    }
  }

  handleExpand = () => {
    if (this.props.onExpand) {
      this.props.onExpand(this.getNode())
    }
  }

  handleDoubleClick = (e: any) => {
    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(this.getNode())
    }
  }

  renderCheckbox = () => {
    if (!this.props.checkable || this.props.hidenCheckbox) {
      return null
    }

    const Checkbox = this.props.checkboxRenderer

    if (!Checkbox) {
      return <span className="node-checkbox" onMouseUp={this.handleCheck} /> 
    }

    return (
      <span className="node-checkbox-overrided" onMouseUp={this.handleCheck}>
        <Checkbox node={this.getNode()} />
      </span>
    )
  }

  renderArrow = () => {
    const ArrowRenderer = this.props.arrowRenderer

    if (!hasChild(this.props)) {
      return <span className="node-noop" />
    }

    if (!ArrowRenderer) {
      return <span className="node-arrow" onMouseUp={this.handleExpand} />
    }

    return (
      <span className="node-arrow-extended" onMouseUp={this.handleExpand}>
        <ArrowRenderer node={this.getNode()} />
      </span>
    )
  }

  render() {
    const {
      checked,
      selected,
      children,
      expanded,
      disabled,
      disabledCheckbox,
      textRenderer: TextRenderer
    } = this.props

    const text = this.props.text
    const nodeContentClass = cn({
      'node-content': true,
      'has-child': hasChild(this.props),
      'selected': selected,
      'checked': checked,
      'expanded': expanded,
      'disabled': disabled,
      'disabled-checkbox': disabledCheckbox
    })

    return (
      <li className="tree-node">
        <div className={nodeContentClass}>

          { this.renderArrow() }
          { this.renderCheckbox() }

          <span className="node-text" onMouseUp={this.handleSelect} onDoubleClick={this.handleDoubleClick}>
            { TextRenderer ? <TextRenderer node={this.getNode()} /> : text }
          </span>
        </div>

        { hasChild(this.props) && expanded &&
          <ul className="node-child">{ children }</ul>
        }
      </li>
    )
  }
}
