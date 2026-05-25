import { ErrorCorrectionLevel, EncodingMode, QRCode, QRCodeOptions, QRModule } from './types';
import { QREncoder } from './encoder';
import { ReedSolomon, getECCInfo } from './errorCorrection';

/**
 * QR Code Generator
 */
export class QRCodeGenerator {
  /**
   * Generate a QR code from input data
   */
  static generate(data: string, options: QRCodeOptions = {}): QRCode {
    const errorCorrectionLevel = options.errorCorrectionLevel || ErrorCorrectionLevel.M;
    const margin = options.margin ?? 4;
    
    // Determine version
    const version = this.determineVersion(data, errorCorrectionLevel);
    const size = version * 4 + 17;
    
    // Encode data
    const segment = QREncoder.createSegment(data);
    const bits = QREncoder.segmentToBits(segment, version);
    
    // Add terminator and padding
    const eccInfo = getECCInfo(version, errorCorrectionLevel);
    const dataCapacity = this.getDataCapacity(eccInfo);
    this.addTerminatorAndPadding(bits, dataCapacity);
    
    // Convert to bytes
    const dataBytes = QREncoder.bitsToBytes(bits);
    
    // Add error correction
    const codewords = this.addErrorCorrection(dataBytes, eccInfo);
    
    // Create matrix
    const matrix = this.createMatrix(size, version, errorCorrectionLevel);
    
    // Place data
    this.placeData(matrix, codewords);
    
    // Apply mask
    const maskPattern = options.maskPattern ?? this.selectBestMask(matrix, errorCorrectionLevel);
    this.applyMask(matrix, maskPattern);
    
    // Add format information
    this.addFormatInfo(matrix, errorCorrectionLevel, maskPattern);
    
    // Extract final modules
    const modules = matrix.map(row => row.map(module => module.value));
    
    return {
      size,
      modules,
      version,
      errorCorrectionLevel
    };
  }
  
  /**
   * Determine the minimum version needed for the data
   */
  private static determineVersion(data: string, level: ErrorCorrectionLevel): number {
    const segment = QREncoder.createSegment(data);
    
    // Try each version starting from 1
    for (let version = 1; version <= 40; version++) {
      const charCountBits = this.getCharCountBits(segment.mode, version);
      const totalBits = 4 + charCountBits + segment.bitLength; // mode + char count + data
      
      try {
        const eccInfo = getECCInfo(version, level);
        const capacity = this.getDataCapacity(eccInfo);
        
        if (totalBits <= capacity) {
          return version;
        }
      } catch {
        // Version not in table, continue
        continue;
      }
    }
    
    throw new Error('Data too large for supported versions (currently 1-6)');
  }
  
  /**
   * Get character count indicator bit length (moved from encoder)
   */
  private static getCharCountBits(mode: EncodingMode, version: number): number {
    if (version <= 9) {
      return mode === EncodingMode.NUMERIC ? 10 : 
             mode === EncodingMode.ALPHANUMERIC ? 9 : 8;
    } else if (version <= 26) {
      return mode === EncodingMode.NUMERIC ? 12 : 
             mode === EncodingMode.ALPHANUMERIC ? 11 : 16;
    } else {
      return mode === EncodingMode.NUMERIC ? 14 : 
             mode === EncodingMode.ALPHANUMERIC ? 13 : 16;
    }
  }
  
  /**
   * Get data capacity in bits
   */
  private static getDataCapacity(eccInfo: any): number {
    const totalData = eccInfo.numBlocks1 * eccInfo.dataPerBlock1 +
                      eccInfo.numBlocks2 * eccInfo.dataPerBlock2;
    return totalData * 8;
  }
  
  /**
   * Add terminator and padding to bit stream
   */
  private static addTerminatorAndPadding(bits: number[], capacity: number): void {
    // Add terminator (up to 4 zeros)
    const terminatorLength = Math.min(4, capacity - bits.length);
    for (let i = 0; i < terminatorLength; i++) {
      bits.push(0);
    }
    
    // Pad to byte boundary
    while (bits.length % 8 !== 0) {
      bits.push(0);
    }
    
    // Add padding bytes
    const paddingBytes = [0b11101100, 0b00010001];
    let paddingIndex = 0;
    
    while (bits.length < capacity) {
      const padByte = paddingBytes[paddingIndex % 2];
      for (let i = 7; i >= 0 && bits.length < capacity; i--) {
        bits.push((padByte >> i) & 1);
      }
      paddingIndex++;
    }
  }
  
  /**
   * Add error correction codewords
   */
  private static addErrorCorrection(data: number[], eccInfo: any): number[] {
    const result: number[] = [];
    const blocks: number[][] = [];
    const eccBlocks: number[][] = [];
    
    // Split data into blocks
    let offset = 0;
    for (let i = 0; i < eccInfo.numBlocks1; i++) {
      blocks.push(data.slice(offset, offset + eccInfo.dataPerBlock1));
      offset += eccInfo.dataPerBlock1;
    }
    for (let i = 0; i < eccInfo.numBlocks2; i++) {
      blocks.push(data.slice(offset, offset + eccInfo.dataPerBlock2));
      offset += eccInfo.dataPerBlock2;
    }
    
    // Generate ECC for each block
    for (const block of blocks) {
      eccBlocks.push(ReedSolomon.encode(block, eccInfo.eccPerBlock));
    }
    
    // Interleave data blocks
    const maxDataLength = Math.max(...blocks.map(b => b.length));
    for (let i = 0; i < maxDataLength; i++) {
      for (const block of blocks) {
        if (i < block.length) {
          result.push(block[i]);
        }
      }
    }
    
    // Interleave ECC blocks
    for (let i = 0; i < eccInfo.eccPerBlock; i++) {
      for (const eccBlock of eccBlocks) {
        result.push(eccBlock[i]);
      }
    }
    
    return result;
  }
  
  /**
   * Create QR code matrix with function patterns
   */
  private static createMatrix(size: number, version: number, level: ErrorCorrectionLevel): QRModule[][] {
    const matrix: QRModule[][] = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ value: false, reserved: false }))
    );
    
    // Add finder patterns
    this.addFinderPattern(matrix, 0, 0);
    this.addFinderPattern(matrix, size - 7, 0);
    this.addFinderPattern(matrix, 0, size - 7);
    
    // Add separators
    this.addSeparators(matrix, size);
    
    // Add timing patterns
    this.addTimingPatterns(matrix, size);
    
    // Add alignment patterns (for version 2+)
    if (version >= 2) {
      this.addAlignmentPatterns(matrix, version);
    }
    
    // Reserve format information areas
    this.reserveFormatAreas(matrix, size);
    
    // Add dark module (always at row 4*version + 9, column 8)
    matrix[4 * version + 9][8].value = true;
    matrix[4 * version + 9][8].reserved = true;
    
    return matrix;
  }
  
  /**
   * Add finder pattern at position
   */
  private static addFinderPattern(matrix: QRModule[][], row: number, col: number): void {
    const pattern = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ];
    
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (row + i < matrix.length && col + j < matrix.length) {
          matrix[row + i][col + j].value = pattern[i][j] === 1;
          matrix[row + i][col + j].reserved = true;
        }
      }
    }
  }
  
  /**
   * Add separators around finder patterns
   */
  private static addSeparators(matrix: QRModule[][], size: number): void {
    // Top-left
    for (let i = 0; i < 8; i++) {
      matrix[7][i].reserved = true;
      matrix[i][7].reserved = true;
    }
    
    // Top-right
    for (let i = 0; i < 8; i++) {
      matrix[7][size - 8 + i].reserved = true;
      matrix[i][size - 8].reserved = true;
    }
    
    // Bottom-left
    for (let i = 0; i < 8; i++) {
      matrix[size - 8][i].reserved = true;
      matrix[size - 8 + i][7].reserved = true;
    }
  }
  
  /**
   * Add timing patterns
   */
  private static addTimingPatterns(matrix: QRModule[][], size: number): void {
    for (let i = 8; i < size - 8; i++) {
      const value = i % 2 === 0;
      matrix[6][i].value = value;
      matrix[6][i].reserved = true;
      matrix[i][6].value = value;
      matrix[i][6].reserved = true;
    }
  }
  
  /**
   * Reserve format information areas (must be done before data placement)
   */
  private static reserveFormatAreas(matrix: QRModule[][], size: number): void {
    // Reserve around top-left finder
    for (let i = 0; i <= 8; i++) {
      if (i !== 6) { // Skip timing pattern column
        matrix[8][i].reserved = true;
      }
    }
    for (let i = 0; i <= 8; i++) {
      if (i !== 6) { // Skip timing pattern row
        matrix[i][8].reserved = true;
      }
    }
    
    // Reserve bottom-left column
    for (let i = 0; i < 7; i++) {
      matrix[size - 1 - i][8].reserved = true;
    }
    
    // Reserve top-right row (8 cells starting from column size-8)
    for (let i = 0; i < 8; i++) {
      matrix[8][size - 8 + i].reserved = true;
    }
  }
  
  /**
   * Add alignment patterns for version 2+
   */
  private static addAlignmentPatterns(matrix: QRModule[][], version: number): void {
    const positions = this.getAlignmentPatternPositions(version);
    
    for (const row of positions) {
      for (const col of positions) {
        // Skip if conflicts with finder patterns
        if ((row === 6 && col === 6) ||
            (row === 6 && col === positions[positions.length - 1]) ||
            (row === positions[positions.length - 1] && col === 6)) {
          continue;
        }
        
        this.addAlignmentPattern(matrix, row, col);
      }
    }
  }
  
  /**
   * Get alignment pattern center positions for a version
   */
  private static getAlignmentPatternPositions(version: number): number[] {
    if (version === 1) return [];
    
    // Simplified alignment pattern table for versions 2-6
    const positionTable: Record<number, number[]> = {
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30],
      6: [6, 34],
    };
    
    const positions = positionTable[version];
    if (!positions) {
      throw new Error(`Alignment pattern positions are not implemented for version ${version}`);
    }

    return positions;
  }
  
  /**
   * Add a single alignment pattern
   */
  private static addAlignmentPattern(matrix: QRModule[][], centerRow: number, centerCol: number): void {
    const pattern = [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ];
    
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const row = centerRow + i;
        const col = centerCol + j;
        if (row >= 0 && row < matrix.length && col >= 0 && col < matrix.length) {
          matrix[row][col].value = pattern[i + 2][j + 2] === 1;
          matrix[row][col].reserved = true;
        }
      }
    }
  }
  
  /**
   * Place data in matrix
   */
  private static placeData(matrix: QRModule[][], codewords: number[]): void {
    const size = matrix.length;
    let bitIndex = 0;
    let direction = -1; // -1 for upward, 1 for downward
    
    // Place data starting from bottom-right, moving upward in columns
    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--; // Skip timing column
      
      for (let row = 0; row < size; row++) {
        const r = direction === -1 ? size - 1 - row : row;
        
        for (let c = 0; c < 2; c++) {
          const currentCol = col - c;
          
          if (!matrix[r][currentCol].reserved) {
            if (bitIndex < codewords.length * 8) {
              const byte = codewords[Math.floor(bitIndex / 8)];
              const bit = (byte >> (7 - (bitIndex % 8))) & 1;
              matrix[r][currentCol].value = bit === 1;
              bitIndex++;
            }
          }
        }
      }
      
      // Alternate direction for next column pair
      direction = -direction;
    }
  }
  
  /**
   * Apply mask pattern
   */
  private static applyMask(matrix: QRModule[][], pattern: number): void {
    const size = matrix.length;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!matrix[row][col].reserved) {
          if (this.getMaskValue(row, col, pattern)) {
            matrix[row][col].value = !matrix[row][col].value;
          }
        }
      }
    }
  }
  
  /**
   * Get mask pattern value
   */
  private static getMaskValue(row: number, col: number, pattern: number): boolean {
    switch (pattern) {
      case 0: return (row + col) % 2 === 0;
      case 1: return row % 2 === 0;
      case 2: return col % 3 === 0;
      case 3: return (row + col) % 3 === 0;
      case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
      case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
      case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
      case 7: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
      default: return false;
    }
  }
  
  /**
   * Select best mask pattern
   */
  private static selectBestMask(matrix: QRModule[][], level: ErrorCorrectionLevel): number {
    let bestPattern = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let pattern = 0; pattern < 8; pattern++) {
      const candidate = this.cloneMatrix(matrix);
      this.applyMask(candidate, pattern);
      const score = this.calculateMaskPenalty(candidate);

      if (score < bestScore) {
        bestScore = score;
        bestPattern = pattern;
      }
    }

    return bestPattern;
  }

  private static cloneMatrix(matrix: QRModule[][]): QRModule[][] {
    return matrix.map(row => row.map(module => ({ ...module })));
  }

  private static calculateMaskPenalty(matrix: QRModule[][]): number {
    return this.penaltyRule1(matrix) +
           this.penaltyRule2(matrix) +
           this.penaltyRule3(matrix) +
           this.penaltyRule4(matrix);
  }

  private static penaltyRule1(matrix: QRModule[][]): number {
    const size = matrix.length;
    let penalty = 0;

    for (let row = 0; row < size; row++) {
      let runLength = 1;
      let last = matrix[row][0].value;

      for (let col = 1; col < size; col++) {
        const current = matrix[row][col].value;
        if (current === last) {
          runLength++;
        } else {
          if (runLength >= 5) penalty += 3 + (runLength - 5);
          runLength = 1;
          last = current;
        }
      }
      if (runLength >= 5) penalty += 3 + (runLength - 5);
    }

    for (let col = 0; col < size; col++) {
      let runLength = 1;
      let last = matrix[0][col].value;

      for (let row = 1; row < size; row++) {
        const current = matrix[row][col].value;
        if (current === last) {
          runLength++;
        } else {
          if (runLength >= 5) penalty += 3 + (runLength - 5);
          runLength = 1;
          last = current;
        }
      }
      if (runLength >= 5) penalty += 3 + (runLength - 5);
    }

    return penalty;
  }

  private static penaltyRule2(matrix: QRModule[][]): number {
    const size = matrix.length;
    let penalty = 0;

    for (let row = 0; row < size - 1; row++) {
      for (let col = 0; col < size - 1; col++) {
        const value = matrix[row][col].value;
        if (matrix[row][col + 1].value === value &&
            matrix[row + 1][col].value === value &&
            matrix[row + 1][col + 1].value === value) {
          penalty += 3;
        }
      }
    }

    return penalty;
  }

  private static penaltyRule3(matrix: QRModule[][]): number {
    const size = matrix.length;
    let penalty = 0;
    const pattern1 = [true, false, true, true, true, false, true, false, false, false, false];
    const pattern2 = [false, false, false, false, true, false, true, true, true, false, true];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - 11; col++) {
        if (this.matchesPatternInRow(matrix, row, col, pattern1) ||
            this.matchesPatternInRow(matrix, row, col, pattern2)) {
          penalty += 40;
        }
      }
    }

    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - 11; row++) {
        if (this.matchesPatternInColumn(matrix, row, col, pattern1) ||
            this.matchesPatternInColumn(matrix, row, col, pattern2)) {
          penalty += 40;
        }
      }
    }

    return penalty;
  }

  private static matchesPatternInRow(
    matrix: QRModule[][],
    row: number,
    startCol: number,
    pattern: boolean[]
  ): boolean {
    for (let i = 0; i < pattern.length; i++) {
      if (matrix[row][startCol + i].value !== pattern[i]) {
        return false;
      }
    }
    return true;
  }

  private static matchesPatternInColumn(
    matrix: QRModule[][],
    startRow: number,
    col: number,
    pattern: boolean[]
  ): boolean {
    for (let i = 0; i < pattern.length; i++) {
      if (matrix[startRow + i][col].value !== pattern[i]) {
        return false;
      }
    }
    return true;
  }

  private static penaltyRule4(matrix: QRModule[][]): number {
    const size = matrix.length;
    const total = size * size;
    let dark = 0;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (matrix[row][col].value) dark++;
      }
    }

    const darkPercent = (dark * 100) / total;
    const deviation = Math.abs(darkPercent - 50);
    return Math.floor(deviation / 5) * 10;
  }
  
  /**
   * Add format information
   */
  private static addFormatInfo(matrix: QRModule[][], level: ErrorCorrectionLevel, mask: number): void {
    const formatBits = this.generateFormatBits(level, mask);
    const size = matrix.length;
    const getBit = (i: number): boolean => ((formatBits >> i) & 1) === 1;
    
    // First copy
    for (let i = 0; i <= 5; i++) {
      matrix[i][8].value = getBit(i);
      matrix[i][8].reserved = true;
    }
    matrix[7][8].value = getBit(6);
    matrix[7][8].reserved = true;
    matrix[8][8].value = getBit(7);
    matrix[8][8].reserved = true;
    matrix[8][7].value = getBit(8);
    matrix[8][7].reserved = true;
    for (let i = 9; i < 15; i++) {
      matrix[8][14 - i].value = getBit(i);
      matrix[8][14 - i].reserved = true;
    }
    
    // Second copy
    for (let i = 0; i < 8; i++) {
      matrix[8][size - 1 - i].value = getBit(i);
      matrix[8][size - 1 - i].reserved = true;
    }
    for (let i = 8; i < 15; i++) {
      matrix[size - 15 + i][8].value = getBit(i);
      matrix[size - 15 + i][8].reserved = true;
    }
  }
  
  /**
   * Generate format information bits
   */
  private static generateFormatBits(level: ErrorCorrectionLevel, mask: number): number {
    const levelBits: Record<string, number> = {
      'L': 0b01,
      'M': 0b00,
      'Q': 0b11,
      'H': 0b10
    };
    
    const formatInt = (levelBits[level] << 3) | mask;

    // Calculate BCH(15,5): append 10 zero bits, then divide by generator polynomial.
    const generator = 0b10100110111;
    let remainder = formatInt << 10;

    for (let i = 14; i >= 10; i--) {
      if (((remainder >> i) & 1) === 1) {
        remainder ^= generator << (i - 10);
      }
    }

    const formatWithECC = (formatInt << 10) | (remainder & 0x03FF);
    const maskedFormat = formatWithECC ^ 0b101010000010010;
    
    return maskedFormat;
  }
}
