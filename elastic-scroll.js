const isBrowser = typeof window !== 'undefined'
const platform = isBrowser && navigator.platform
const ua = isBrowser && navigator.userAgent

// macOS Safari and iOS Safari have native implementations
const hasNativeSupport = isBrowser && (
  (/Mac/.test(platform) && /Safari/.test(ua) && !/Chrome/.test(ua)) ||
  (/iPhone|iPad|iPod/.test(platform) && !window.MSStream)
)

const isAppleDevice = hasNativeSupport || /Mac/.test(platform)

const defaults = {
  targets: '[data-elastic]',
  easing: 'cubic-bezier(.14,.38,.25,1)',
  duration: [100, 800],
  multiplier: 1,
  useNative: true,
  appleDevicesOnly: true
}

const createInnerWrap = el => {
  const div = document.createElement('div')
  div.classList = 'scroll-content'
  el.style.willChange = 'transform'
  el.style.backfaceVisibility = 'hidden'
  div.innerHTML = el.innerHTML
  el.innerHTML = ''
  el.appendChild(div)
  return div
}

const getArrayOfElements = value => {
  if (typeof value === 'string') {
    return [].slice.call(document.querySelectorAll(value))
  } else if (value instanceof NodeList) {
    return [].slice.call(value)
  } else if (value instanceof Element) {
    return [value]
  }
  
  return []
}

const createElasticScroll = (el, options) => {
  const offsetHeight = el.offsetHeight
  const scrollHeight = el.scrollHeight
  const easing = options.easing
  const innerWrap = createInnerWrap(el)
  let isTransitioning = false
  
  const onWheel = e => {
    const isAtTop = el.scrollTop <= 2
    const isAtBottom = el.scrollTop + offsetHeight >= scrollHeight - 2
    
    if (!isAtTop && !isAtBottom) {
      innerWrap.removeEventListener('transitionend', onBounceAwayTransitionEnd)
      innerWrap.removeEventListener('transitionend', onBounceBackTransitionEnd)
      innerWrap.style.transition = 'none'
      innerWrap.style.transform = 'translate3d(0, 0, 0)'
      isTransitioning = false
    }
    
    if ((isAtTop && e.deltaY > 0) || (isAtBottom && e.deltaY < 0)) return
    
    if (
      !isTransitioning && (isAtTop || isAtBottom)
    ) {
      isTransitioning = true
      innerWrap.addEventListener('transitionend', onBounceAwayTransitionEnd)
      innerWrap.style.transition = `all ${ options.duration[0] }ms ${ easing }`
      innerWrap.style.transform = `translate3d(0, ${ options.multiplier * -e.deltaY }px, 0)`
    }
  }
  
  const onBounceAwayTransitionEnd = () => {
    innerWrap.addEventListener('transitionend', onBounceBackTransitionEnd)
    innerWrap.style.transition = `all ${ options.duration[1] }ms ${ easing }`
    innerWrap.style.transform = 'translate3d(0, 0, 0)'
    innerWrap.removeEventListener('transitionend', onBounceAwayTransitionEnd)
  }
  
  const onBounceBackTransitionEnd = () => {
    isTransitioning = false
    innerWrap.removeEventListener('transitionend', onBounceBackTransitionEnd)
  }
  
  const enable = () => {
    if (options.appleDevicesOnly && !isAppleDevice) return
    
    if (options.useNative && hasNativeSupport) {
      el.style.webkitOverflowScrolling = 'touch'
    } else if (!options.useNative || !hasNativeSupport) {
      el.addEventListener('wheel', onWheel)
    }
  }
  const disable = () => {
    el.style.webkitOverflowScrolling = ''
    el.removeEventListener('wheel', onWheel)
  }
  
  enable()
  
  const elasticScroll = {
    el,
    options,
    enable,
    disable
  }
  
  el._elasticScroll = elasticScroll
  return elasticScroll
}

const elasticScroll = (options = {}) => {
  const targets = getArrayOfElements(options.targets || defaults.targets)
  options = { ...defaults, ...options }
  
  return targets.map(target => createElasticScroll(target, options))
}

elasticScroll.defaults = defaults

export default elasticScroll
