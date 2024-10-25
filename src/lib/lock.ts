interface ChunkProcessingOptions {
  chunkSize: number;
  maxSize: number;
}

class LargeDataCrypto {
  private static readonly DEFAULT_OPTIONS: ChunkProcessingOptions = {
    chunkSize: 1024 * 1024, // 1MB chunks
    maxSize: 100 * 1024 * 1024, // 100MB max
  };

  private static readonly SALT_SIZE = 16;

  /**
   * Generates a random salt of specified length
   */
  private static generateSalt(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return String.fromCharCode(...Array.from(array));
  }

  /**
   * Processes data in chunks using XOR operation
   */
  private static processChunks(
    data: string,
    key: string,
    salt: string,
    chunkSize: number
  ): string {
    let result = "";
    const keyLength = key.length;
    const saltLength = salt.length;

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const processed = chunk
        .split("")
        .map((char, index) => {
          const absoluteIndex = i + index;
          return String.fromCharCode(
            char.charCodeAt(0) ^
              key.charCodeAt(absoluteIndex % keyLength) ^
              salt.charCodeAt(absoluteIndex % saltLength)
          );
        })
        .join("");
      result += processed;
    }

    return result;
  }

  /**
   * Validates the input size against maximum allowed size
   */
  private static validateSize(data: string, maxSize: number): void {
    if (data.length > maxSize) {
      throw new Error(
        `Data size exceeds maximum allowed size of ${maxSize} bytes`
      );
    }
  }

  /**
   * Serializes data to string safely
   */
  private static safeStringify(data: any): string {
    try {
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch (error) {
      throw new Error(`Failed to serialize data: ${(error as Error).message}`);
    }
  }

  /**
   * Deserializes string to data safely
   */
  private static safeParse(data: string): any {
    try {
      return JSON.parse(data);
    } catch {
      // If parsing fails, return the original string
      return data;
    }
  }

  /**
   * Converts string to Base64 safely
   */
  private static toBase64(str: string): string {
    try {
      // Using TextEncoder for better UTF-8 support
      const encoder = new TextEncoder();
      const data = encoder.encode(str);

      // Convert Uint8Array to a regular array before using String.fromCharCode
      const charArray = Array.from(data).map((byte) =>
        String.fromCharCode(byte)
      );

      return btoa(charArray.join("")); // Join the characters and then encode to Base64
    } catch (error) {
      throw new Error(`Base64 encoding failed: ${(error as Error).message}`);
    }
  }

  /**
   * Converts Base64 to string safely
   */
  private static fromBase64(str: string): string {
    try {
      const binaryStr = atob(str);
      // Using TextDecoder for better UTF-8 support
      const decoder = new TextDecoder();
      const arr = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        arr[i] = binaryStr.charCodeAt(i);
      }
      return decoder.decode(arr);
    } catch (error) {
      throw new Error(`Base64 decoding failed: ${(error as Error).message}`);
    }
  }

  /**
   * Encrypts data with chunked processing
   */
  static encrypt(
    data: any,
    key: string = process.env.JWT_SECRET || "",
    options: Partial<ChunkProcessingOptions> = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const serializedData = this.safeStringify(data);

    this.validateSize(serializedData, opts.maxSize);

    const salt = this.generateSalt(this.SALT_SIZE);
    const processed = this.processChunks(
      serializedData,
      key,
      salt,
      opts.chunkSize
    );

    const saltedData = salt + processed;
    return this.toBase64(saltedData)
      .replace(/\//g, "_")
      .replace(/\+/g, "-")
      .replace(/=/g, ".");
  }

  /**
   * Decrypts data with chunked processing
   */
  static decrypt(
    encryptedData: string,
    key: string = process.env.JWT_SECRET || "",
    options: Partial<ChunkProcessingOptions> = {}
  ): any {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      const base64 = encryptedData
        .replace(/_/g, "/")
        .replace(/-/g, "+")
        .replace(/\./g, "=");

      const saltedData = this.fromBase64(base64);
      const salt = saltedData.slice(0, this.SALT_SIZE);
      const data = saltedData.slice(this.SALT_SIZE);

      this.validateSize(data, opts.maxSize);

      const processed = this.processChunks(data, key, salt, opts.chunkSize);

      return this.safeParse(processed);
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }
}

export const encrypt = (
  data: any,
  options?: Partial<ChunkProcessingOptions>
): string => {
  return LargeDataCrypto.encrypt(data, process.env.JWT_SECRET, options);
};

export const decrypt = (
  encryptedData: string,
  options?: Partial<ChunkProcessingOptions>
): any => {
  return LargeDataCrypto.decrypt(
    encryptedData,
    process.env.JWT_SECRET,
    options
  );
};
