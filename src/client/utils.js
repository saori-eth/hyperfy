export function cls(...args) {
  let str = ''
  for (const arg of args) {
    if (typeof arg === 'string') {
      str += ' ' + arg
    } else if (typeof arg === 'object') {
      for (const key in arg) {
        const value = arg[key]
        if (value) str += ' ' + key
      }
    }
  }
  return str
}

// export const isTouch = !!navigator.userAgent.match(/OculusBrowser|iPhone|iPad|iPod|Android/i)

// if at least two indicators point to touch, consider it primarily touch-based:
const coarse = window.matchMedia('(pointer: coarse)').matches
const noHover = window.matchMedia('(hover: none)').matches
const hasTouch = navigator.maxTouchPoints > 0
export const isTouch = (coarse && hasTouch) || (noHover && hasTouch)

export function sanitizeCSS(css) {
  if (!css || typeof css !== 'string') return ''

  // Remove comments from the CSS string first
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')

  // Extended whitelist for reticle customization
  const allowedProperties = [
    // Colors and backgrounds
    'color',
    'background-color',
    'background',
    'border-color',
    'outline-color',
    'text-shadow',
    'box-shadow',

    // Sizing and spacing
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',

    // Positioning (for reticle customization)
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'z-index', // Limited range will be enforced

    // Borders
    'border',
    'border-width',
    'border-style',
    'border-radius',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',

    // Typography
    'font-size',
    'font-family',
    'font-weight',
    'font-style',
    'line-height',
    'letter-spacing',
    'text-align',
    'text-decoration',
    'text-transform',

    // Display and visibility
    'display',
    'opacity',
    'visibility',
    'overflow',
    'overflow-x',
    'overflow-y',

    // Transforms and transitions
    'transform',
    'transform-origin',
    'transition',
    'animation',
    'animation-duration',
    'animation-timing-function',

    // Flexbox
    'flex',
    'flex-direction',
    'justify-content',
    'align-items',
    'gap',
    'row-gap',
    'column-gap',

    // Special properties for pseudo-elements
    'content', // Will be restricted to safe values

    // Blend modes
    'mix-blend-mode',
    'isolation',

    // Box model
    'box-sizing',
  ]

  // Parse CSS including pseudo-elements
  const rules = []
  const selectorPattern = /([^{]+)\{([^}]+)\}/g
  let match

  while ((match = selectorPattern.exec(cssWithoutComments)) !== null) {
    const selector = match[1].trim()
    const declarations = match[2]

    // Only allow specific selectors
    if (!isSelectorSafe(selector)) {
      continue
    }

    const properties = declarations.match(/([a-z-]+)\s*:\s*([^;!]+)(\s*!important)?\s*;/gi) || []

    const sanitizedProps = properties
      .map(prop => {
        const propMatch = prop.match(/([a-z-]+)\s*:\s*([^;!]+)(\s*!important)?\s*;/i)
        if (!propMatch) return null

        const [, property, value, important] = propMatch
        const propName = property.trim().toLowerCase()
        const propValue = value.trim()

        // Check if property is allowed
        if (!allowedProperties.includes(propName)) {
          return null
        }

        // Validate the value
        const safeValue = sanitizeValue(propName, propValue)
        if (!safeValue) {
          return null
        }

        // Allow !important for reticle styling
        return `${propName}: ${safeValue}${important || ''};`
      })
      .filter(Boolean)

    if (sanitizedProps.length > 0) {
      rules.push(`${selector} { ${sanitizedProps.join(' ')} }`)
    }
  }

  const result = rules.join('\n')
  return result
}

function isSelectorSafe(selector) {
  // Allow class selectors and pseudo-elements for .reticle-item
  const allowedPatterns = [
    /^\.reticle-item$/,
    /^\.reticle-item::before$/,
    /^\.reticle-item::after$/,
    /^\.reticle-item:[a-z-]+$/, // pseudo-classes like :hover
    /^\.reticle-[a-z-]+$/, // other reticle-related classes
  ]

  return allowedPatterns.some(pattern => pattern.test(selector.trim()))
}

function sanitizeValue(property, value) {
  const cleanValue = value.toLowerCase().trim()

  // Block dangerous patterns
  if (
    cleanValue.includes('url(') ||
    cleanValue.includes('expression(') ||
    cleanValue.includes('javascript:') ||
    cleanValue.includes('@import') ||
    cleanValue.includes('data:') ||
    cleanValue.includes('blob:')
  ) {
    return null
  }

  // Special handling for content property
  if (property === 'content') {
    // Only allow empty content or simple strings
    if (cleanValue === "''" || cleanValue === '""' || cleanValue === 'none') {
      return value
    }
    return null
  }

  // Special handling for position values
  if (property === 'position') {
    const allowedPositions = ['static', 'relative', 'absolute', 'fixed', 'sticky']
    if (allowedPositions.includes(cleanValue)) {
      return value
    }
    return null
  }

  // Special handling for z-index (limit range)
  if (property === 'z-index') {
    const num = parseInt(cleanValue)
    if (!isNaN(num) && num >= -100 && num <= 100) {
      return value
    }
    return null
  }

  // Special handling for mix-blend-mode
  if (property === 'mix-blend-mode') {
    const allowedModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference', 'exclusion']
    if (allowedModes.includes(cleanValue)) {
      return value
    }
    return null
  }

  // Allow safe keywords
  const safeKeywords = [
    'none',
    'auto',
    'inherit',
    'initial',
    'unset',
    'transparent',
    'currentcolor',
    'white',
    'black',
    'block',
    'inline',
    'inline-block',
    'flex',
    'grid',
    'relative',
    'absolute',
    'fixed',
    'static',
    'visible',
    'hidden',
    'scroll',
    'center',
    'left',
    'right',
    'top',
    'bottom',
    'normal',
    'bold',
    'italic',
    'solid',
    'dashed',
    'dotted',
    'border-box',
    'content-box',
  ]

  if (safeKeywords.includes(cleanValue)) {
    return value
  }

  // Allow colors
  if (
    /^#[0-9a-f]{3,8}$/i.test(cleanValue) ||
    /^rgba?\([^)]+\)$/i.test(cleanValue) ||
    /^hsla?\([^)]+\)$/i.test(cleanValue)
  ) {
    return value
  }

  // Allow measurements with units (including negative values for positioning)
  if (/^-?\d*\.?\d+\s*(px|rem|em|%|vh|vw|deg|ms|s|fr)$/i.test(cleanValue)) {
    return value
  }

  // Allow transform functions
  if (/^(translate|rotate|scale|skew)[XYZ]?\([^)]+\)$/i.test(cleanValue)) {
    return value
  }

  // Allow multiple values (for padding, margin, box-shadow, etc.)
  const values = cleanValue.split(/\s+/)
  const allValuesSafe = values.every(v => {
    return /^-?\d*\.?\d+\s*(px|rem|em|%)?$/i.test(v) || /^#[0-9a-f]{3,8}$/i.test(v) || safeKeywords.includes(v)
  })

  if (allValuesSafe) {
    return value
  }

  return null
}
