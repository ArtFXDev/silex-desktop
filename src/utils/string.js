function asciiToHexa(str) {
  const arr1 = [];

  for (let n = 0; n < str.length; n++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }

  return arr1.join("");
}

module.exports = { asciiToHexa };
