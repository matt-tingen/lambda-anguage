class CharacterStream {
  constructor(input) {
    this.input = input;
    this.index = 0;
    this.line = 1;
    this.column = 0;
  }

  peek() {
    return this.input.charAt(this.index);
  }

  next() {
    const char = this.input.charAt((this.index++));
    if (char === '\n') {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    return char;
  }

  eof() {
    return this.index === this.input.length;
  }

  croak(msg) {
    throw new Error(`Croaked at ${this.line}:${this.column} - ${msg}`);
  }
}

module.exports = CharacterStream;
