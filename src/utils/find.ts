import { TreeNode } from '../types/Node'
import { isString, isRegExp, isFunction, isBoolean } from './index'
import { SSL_OP_LEGACY_SERVER_CONNECT } from 'constants';

type Traveler = (source: TreeNode[], cb: (node: TreeNode) => boolean) => boolean
type Criteria = (node: TreeNode) => boolean

/**
 * Criterias:
 *  - api.find(/item \d{2}/) // it will search by text (using RegExp)
 *  - api.find('item') // the same
 *  - api.find(node => node.disabled) // function 
 * 
 *  - api.find({text: /item/, selected: true}) // AND
 *  - api.find({text: 'item 1'}, {text: 'item 2'}, {disabled: true}) // OR
 *  - api.find([{text: /item/}, {selected: true}]) // OR
 */

function isFalsy(val: any): boolean {
  return !val
}

function parseCriteria(criteria: any): Criteria {
  if (isFunction(criteria)) {
    return criteria
  }

  if (isString(criteria) ) {
    return (node: TreeNode): boolean => {
      return testKey(criteria, node.id) || testKey(criteria, node.text)
    }
  }

  const matches = isRegExp(criteria)
    ? { text: criteria }
    : criteria

  return (node: TreeNode): boolean => {
    const keys: string[] = Object.keys(matches)

    if (!keys.length) {
      return false
    }

    return keys.every((key: string): boolean => {
      // TODO: call parseCriteria recursively
      if ('data' === key) {
        return testData(matches[key], node[key])
      }

      return testKey(matches[key], node[key])
    })
  }
}

function testData(v0: any, v1: any): boolean {
  const keys: string[] = Object.keys(v0)

  return keys.every((key: string): boolean => {
    return testKey(v0[key], v1[key])
  })
}

function testKey(v0: any, v1: any): boolean {
  if (isRegExp(v0)) {
    return new RegExp(v0).test(v1)
  }

  if (isBoolean(v0) || isFalsy(v0) && isFalsy(v1)) {
    return !!v0 === !!v1
  }

  return v0 === v1
}

function matchCriterias(node: TreeNode, criterias: Criteria[]): boolean {
  return criterias.some(criteria => true === criteria(node))
}

export function find(source: TreeNode[], traveler: Traveler, multiple: boolean, criterias: any[]): any {
  if (!criterias.length || !criterias[0]) {
    return null
  }

  const result: TreeNode[] = []

  const searchCriterias: Criteria[] = criterias.map(parseCriteria)
  const seeker = (node: TreeNode): boolean => {
    if (matchCriterias(node, searchCriterias)) {
      result.push(node)
      return multiple
    }

    return true
  }

  traveler(source, seeker)

  if (!result.length) {
    return multiple ? [] : null
  }

  return multiple ? result : result[0]
}