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
module.exports = {
    convertBigIntToString,
    convertStringToBigInt,
    convertBigIntToInt
} 