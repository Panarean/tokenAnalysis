const convertBigIntToString = (obj) => {
    // Base case: If the value is a BigInt, convert it to a string
    if (typeof obj === 'bigint') {
      return obj.toString()+'n BigInt';
    }

    // Recursive case: If the value is an object, iterate through its properties
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Recursively call the function for each subkey
          obj[key] = convertBigIntToString(obj[key]);
        }
      }
    }
  
    return obj;
}
const convertBigIntToInt = (obj) => {
  // Base case: If the value is a BigInt, convert it to a string
  if (typeof obj === 'bigint') {
    return parseInt(obj.toString())
  }

  // Recursive case: If the value is an object, iterate through its properties
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Recursively call the function for each subkey
        obj[key] = convertBigIntToInt(obj[key]);
      }
    }
  }

  return obj;
}
const convertStringToBigInt = (obj) => {
  // Base case: If the value is a BigInt, convert it to a string
  if (typeof obj === 'string' && obj.includes('n BigInt') == true) {

    return BigInt(obj.slice(0,-8))
  }

  // Recursive case: If the value is an object, iterate through its properties
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Recursively call the function for each subkey
        obj[key] = convertStringToBigInt(obj[key]);
      }
    }
  }

  return obj;
}
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Semaphore {
  constructor(initialCount ) {
      this.count = initialCount;
      this.queue = [];
  }

  async acquire() {
      return new Promise((resolve) => {
          let curTime = new Date();

          if (this.count > 0) {
              this.count--;
              resolve();
             
          } else {
            this.queue.push(resolve);
          }
      });
  }

  release() {
      if (this.queue.length > 0) {
          const resolve = this.queue.shift();
          resolve();
      } else {
          this.count++;
      }
  }
}

class Mutex {
  constructor() {
      this._locked = false;
      this._queue = [];
  }

  async lock() {
      return new Promise((resolve, reject) => {
          if (!this._locked) {
              this._locked = true;
              resolve();
          } else {
              this._queue.push(resolve);
          }
      });
  }

  unlock() {
      if (this._queue.length > 0) {
          const nextResolver = this._queue.shift();
          nextResolver();
      } else {
          this._locked = false;
      }
  }
}

module.exports = {
    convertBigIntToString,
    convertStringToBigInt,
    convertBigIntToInt,
    sleep,
    Semaphore,
    Mutex
} 