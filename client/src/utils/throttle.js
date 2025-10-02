// Throttle function to limit how often a function can be called
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  const wrapper = function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
  // Allow external cancellation of any pending invocation
  wrapper.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  return wrapper;
};

// Debounce function to delay function execution until after wait time has elapsed
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
};

// Memoize function to cache results of expensive function calls
export const memoize = (func, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  return function memoized(...args) {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

// Rate limiter to prevent too many API calls
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }

  getTimeUntilReset() {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

// API request queue to manage and throttle API calls
export class APIQueue {
  constructor(concurrency = 3, delay = 500) {
    this.concurrency = concurrency;
    this.delay = delay;
    this.queue = [];
    this.running = 0;
  }

  async add(apiCall) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        apiCall,
        resolve,
        reject
      });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { apiCall, resolve, reject } = this.queue.shift();

    try {
      const result = await apiCall();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        setTimeout(() => this.process(), this.delay);
      }
    }
  }
}
