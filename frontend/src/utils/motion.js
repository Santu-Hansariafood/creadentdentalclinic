export const fadeIn = (direction = 'up', delay = 0) => ({
  initial: {
    opacity: 0,
    y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0,
    x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0
  },
  animate: {
    opacity: 1,
    y: 0,
    x: 0
  },
  transition: {
    duration: 0.3,
    delay,
    ease: 'easeOut'
  }
})

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const slideIn = (direction = 'left', delay = 0) => ({
  initial: {
    x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
    y: direction === 'up' ? 100 : direction === 'down' ? -100 : 0,
    opacity: 0
  },
  animate: {
    x: 0,
    y: 0,
    opacity: 1
  },
  transition: {
    duration: 0.4,
    delay,
    ease: 'easeOut'
  }
})

export const scaleIn = (delay = 0) => ({
  initial: {
    scale: 0.9,
    opacity: 0
  },
  animate: {
    scale: 1,
    opacity: 1
  },
  transition: {
    duration: 0.3,
    delay,
    ease: 'easeOut'
  }
})

export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  transition: {
    duration: 0.2,
    ease: 'easeInOut'
  }
}

export const buttonTap = {
  whileTap: { scale: 0.95 },
  transition: { duration: 0.1 }
}

export const paymentSuccess = {
  initial: {
    scale: 0,
    opacity: 0
  },
  animate: {
    scale: [0, 1.2, 1],
    opacity: 1
  },
  transition: {
    duration: 0.6,
    ease: 'easeOut'
  }
}

export const modalSlideIn = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  transition: {
    duration: 0.3,
    ease: 'easeOut'
  }
}

export const loadingSpinner = {
  animate: {
    rotate: 360
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear'
  }
}