import { ErrorCorrectionLevel } from './types';

/**
 * Reed-Solomon error correction implementation
 */
export class ReedSolomon {
  /**
   * Generate error correction codewords
   */
  static encode(data: number[], eccCount: number): number[] {
    const result = [...data];
    const generator = this.generatePolynomial(eccCount);
    
    // Append zeros for error correction codewords
    for (let i = 0; i < eccCount; i++) {
      result.push(0);
    }
    
    // Polynomial division
    for (let i = 0; i < data.length; i++) {
      const coef = result[i];
      if (coef !== 0) {
        for (let j = 0; j < generator.length; j++) {
          result[i + j] ^= this.galoisMultiply(generator[j], coef);
        }
      }
    }
    
    return result.slice(data.length);
  }
  
  /**
   * Generate generator polynomial for Reed-Solomon
   */
  private static generatePolynomial(degree: number): number[] {
    let poly = [1];
    
    for (let i = 0; i < degree; i++) {
      const newPoly = new Array(poly.length + 1).fill(0);
      const term = this.galoisExp(i);

      for (let j = 0; j < poly.length; j++) {
        // Multiply by (x + alpha^i): keep existing term and shifted/scaled term.
        newPoly[j] ^= poly[j];
        newPoly[j + 1] ^= this.galoisMultiply(poly[j], term);
      }

      poly = newPoly;
    }
    
    return poly;
  }
  
  /**
   * Galois field multiplication
   */
  private static galoisMultiply(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return this.galoisExp((this.galoisLog(a) + this.galoisLog(b)) % 255);
  }
  
  /**
   * Galois field exponential table
   */
  private static galoisExp(n: number): number {
    const table = this.getExpTable();
    return table[n % 255];
  }
  
  /**
   * Galois field logarithm table
   */
  private static galoisLog(n: number): number {
    const table = this.getLogTable();
    return table[n];
  }
  
  /**
   * Get or generate exponential table
   */
  private static getExpTable(): number[] {
    const table: number[] = [];
    let x = 1;
    for (let i = 0; i < 256; i++) {
      table[i] = x;
      x <<= 1;
      if (x & 0x100) {
        x ^= 0x11D;
      }
    }
    return table;
  }
  
  /**
   * Get or generate logarithm table
   */
  private static getLogTable(): number[] {
    const table: number[] = new Array(256);
    const expTable = this.getExpTable();
    for (let i = 0; i < 255; i++) {
      table[expTable[i]] = i;
    }
    return table;
  }
}

/**
 * Error correction code information
 */
export interface ECCInfo {
  totalCodewords: number;
  eccPerBlock: number;
  numBlocks1: number;
  dataPerBlock1: number;
  numBlocks2: number;
  dataPerBlock2: number;
}

/**
 * Get error correction information for a given version and level
 */
export function getECCInfo(version: number, level: ErrorCorrectionLevel): ECCInfo {
  // Simplified ECC table (subset for common versions)
  const eccTable: Record<string, ECCInfo> = {
    '1-L': { totalCodewords: 26, eccPerBlock: 7, numBlocks1: 1, dataPerBlock1: 19, numBlocks2: 0, dataPerBlock2: 0 },
    '1-M': { totalCodewords: 26, eccPerBlock: 10, numBlocks1: 1, dataPerBlock1: 16, numBlocks2: 0, dataPerBlock2: 0 },
    '1-Q': { totalCodewords: 26, eccPerBlock: 13, numBlocks1: 1, dataPerBlock1: 13, numBlocks2: 0, dataPerBlock2: 0 },
    '1-H': { totalCodewords: 26, eccPerBlock: 17, numBlocks1: 1, dataPerBlock1: 9, numBlocks2: 0, dataPerBlock2: 0 },
    '2-L': { totalCodewords: 44, eccPerBlock: 10, numBlocks1: 1, dataPerBlock1: 34, numBlocks2: 0, dataPerBlock2: 0 },
    '2-M': { totalCodewords: 44, eccPerBlock: 16, numBlocks1: 1, dataPerBlock1: 28, numBlocks2: 0, dataPerBlock2: 0 },
    '2-Q': { totalCodewords: 44, eccPerBlock: 22, numBlocks1: 1, dataPerBlock1: 22, numBlocks2: 0, dataPerBlock2: 0 },
    '2-H': { totalCodewords: 44, eccPerBlock: 28, numBlocks1: 1, dataPerBlock1: 16, numBlocks2: 0, dataPerBlock2: 0 },
    '3-L': { totalCodewords: 70, eccPerBlock: 15, numBlocks1: 1, dataPerBlock1: 55, numBlocks2: 0, dataPerBlock2: 0 },
    '3-M': { totalCodewords: 70, eccPerBlock: 26, numBlocks1: 1, dataPerBlock1: 44, numBlocks2: 0, dataPerBlock2: 0 },
    '3-Q': { totalCodewords: 70, eccPerBlock: 18, numBlocks1: 2, dataPerBlock1: 17, numBlocks2: 0, dataPerBlock2: 0 },
    '3-H': { totalCodewords: 70, eccPerBlock: 22, numBlocks1: 2, dataPerBlock1: 13, numBlocks2: 0, dataPerBlock2: 0 },
    '4-L': { totalCodewords: 100, eccPerBlock: 20, numBlocks1: 1, dataPerBlock1: 80, numBlocks2: 0, dataPerBlock2: 0 },
    '4-M': { totalCodewords: 100, eccPerBlock: 18, numBlocks1: 2, dataPerBlock1: 32, numBlocks2: 0, dataPerBlock2: 0 },
    '4-Q': { totalCodewords: 100, eccPerBlock: 26, numBlocks1: 2, dataPerBlock1: 24, numBlocks2: 0, dataPerBlock2: 0 },
    '4-H': { totalCodewords: 100, eccPerBlock: 16, numBlocks1: 4, dataPerBlock1: 9, numBlocks2: 0, dataPerBlock2: 0 },
    '5-L': { totalCodewords: 134, eccPerBlock: 26, numBlocks1: 1, dataPerBlock1: 108, numBlocks2: 0, dataPerBlock2: 0 },
    '5-M': { totalCodewords: 134, eccPerBlock: 24, numBlocks1: 2, dataPerBlock1: 43, numBlocks2: 0, dataPerBlock2: 0 },
    '5-Q': { totalCodewords: 134, eccPerBlock: 18, numBlocks1: 2, dataPerBlock1: 15, numBlocks2: 2, dataPerBlock2: 16 },
    '5-H': { totalCodewords: 134, eccPerBlock: 22, numBlocks1: 2, dataPerBlock1: 11, numBlocks2: 2, dataPerBlock2: 12 },
    '6-L': { totalCodewords: 172, eccPerBlock: 18, numBlocks1: 2, dataPerBlock1: 68, numBlocks2: 0, dataPerBlock2: 0 },
    '6-M': { totalCodewords: 172, eccPerBlock: 16, numBlocks1: 4, dataPerBlock1: 27, numBlocks2: 0, dataPerBlock2: 0 },
    '6-Q': { totalCodewords: 172, eccPerBlock: 24, numBlocks1: 4, dataPerBlock1: 19, numBlocks2: 0, dataPerBlock2: 0 },
    '6-H': { totalCodewords: 172, eccPerBlock: 28, numBlocks1: 4, dataPerBlock1: 15, numBlocks2: 0, dataPerBlock2: 0 },
  };
  
  const key = `${version}-${level}`;
  if (!eccTable[key]) {
    throw new Error(`Unsupported version/level combination: ${key}`);
  }
  
  return eccTable[key];
}
