export function multiplyMatrix(matA: number[], matB: number[]): number[] {
  const out = [];
  for (let i = 0; i < 3; ++i) {
    for (let j = 0; j < 3; ++j) {
      let temp = 0;
      for (let k = 0; k < 3; ++k) {
        temp += matA[i * 3 + k] * matB[k * 3 + j];
      }
      out.push(temp);
    }
  }
  return out;
}
