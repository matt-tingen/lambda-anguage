const Dawg = require('./Dawg.js');

class TokenStream {
  constructor(characterStream) {
    this.chars = characterStream;
    this.token = null;

    this.whiteSpace = /\s/;
    this.decimal = /[\d.]/;
    this.integer = /\d/;
    this.identifier = /\w/;
    this.comment = '#';
    this.quote = '"';
    this.escape = '\\';
    this.punctuation = [
      '{',
      '}',
      '(',
      ')',
      ',',
      ';',
    ];
    this.keywords = [
      'lambda',
      'if',
      'then',
      'else',
    ];
    this.operators = [
      '=',
      '+',
      '!=',
      '==',
      '-',
      '/',
      '*',
      '<',
      '>',
    ];

    this.escaped = {
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      v: '\v',
      '0': '\0',
    };

    this.dawgs = {
      keywords: new Dawg(this.keywords),
      operators: new Dawg(this.operators),
    };

    // Prime the first token.
    this.skip();
  }

  checkNext() {
    if (this.chars.eof()) {
      return null;
    }
    return this.checkString() ||
      this.checkNumber() ||
      this.checkKeywordOrIdentifier() ||
      this.checkPunctuation() ||
      this.checkOperator() ||
      this.croakInvalidChar();
  }

  skip() {
    while (this.skipWhitespace() || this.skipComments());
  }

  skipWhitespace() {
    if (this.chars.peek().match(this.whiteSpace)) {
      this.chars.next();
      return true;
    }
    return false;
  }

  skipComments() {  
    if (this.chars.peek() === this.comment) {
      this.skipLine();
      return true;
    }
    return false;
  }

  skipLine() {
    while (!this.chars.eof() && this.chars.peek() !== '\n') {
      this.chars.next();
    }
  }

  tokenFromBuffer(buffer, type) {
    return {
      type,
      value: buffer.join('')
    }
  }

  atWordEnd() {
    return this.chars.eof() || this.chars.peek().match(this.whiteSpace);
  }

  croakInvalidChar(expectation) {
    const found = `"${this.chars.peek()}"`;
    const message = expectation ? 
      `Expected ${expectation}, found ${found}.` :
      `Encountered unexpected character ${found}.`;
    this.croak(message);
  }

  getFromEscapedChar(escaped) {
    return this.escaped[escaped] || escaped;
  }

  checkString() {
    if (this.chars.peek() === this.quote) {
      this.chars.next(); // Consume opening quote.
      const buffer = [];
      let escapeNext = false;
      while (escapeNext || this.chars.peek() !== this.quote) {
        const raw = this.chars.next();
        let char;
        if (escapeNext) {
          char = this.getFromEscapedChar(raw);
          escapeNext = false;
        } else if (raw === this.escape) {
          char = null;
          escapeNext = true;
        } else {
          char = raw;
        }
        if (char) {
          buffer.push(char);
        }
      }
      this.chars.next(); // Consume closing quote.
      return this.tokenFromBuffer(buffer, 'str');
    }
    return null;
  }

  checkNumber() {
    if (this.chars.peek().match(this.decimal)) {
      const buffer = [this.chars.next()];
      let acceptDecimal = buffer[0] !== '.';
      while (this.chars.peek().match(acceptDecimal ? this.decimal : this.integer)) {
        buffer.push(this.chars.next());
        acceptDecimal = acceptDecimal && buffer[buffer.length - 1] !== '.';
      }

      const str = buffer.join('');
      const num = Number(str);
      if (isNaN(num)) {
        this.croakInvalidChar('number continuation');
      }

      return {
        type: 'num',
        value: num
      };
    }
    return null;
  }

  checkKeywordOrIdentifier() {
    if (this.chars.peek() === 'λ') {
      this.chars.next();
      return { type: 'kw', value: 'lambda' };
    }

    const dawg = this.dawgs.keywords.reset();
    let word;
    while (dawg.check(this.chars.peek())) {
      word = dawg.next(this.chars.next());
    }
    if (dawg.check(null) && this.atWordEnd()) {
      return { type: 'kw', value: word };
    }

    const buffer = word ? word.split('') : [];
    while (this.chars.peek().match(this.identifier)) {
      buffer.push(this.chars.next());
    }
    if (buffer.length) {
      return this.tokenFromBuffer(buffer, 'id');
    }

    return null;
  }

  checkPunctuation() {
    if (this.punctuation.includes(this.chars.peek())) {
      return { type: 'punc', value: this.chars.next() };
    }
    return null;
  }

  checkOperator() {
    const dawg = this.dawgs.operators.reset();
    let word;
    while (dawg.check(this.chars.peek())) {
      word = dawg.next(this.chars.next());
    }
    if (word) {
      if (dawg.check(null)) {
        return { type: 'op', value: word };
      }
      this.croakInvalidChar('operator continuation');
    }
    return null;
  }

  next() {
    const token = this.token || this.checkNext();
    this.token = null;
    this.skip();
    return token;
  }

  peek() {
    return (this.token = this.token || this.checkNext());
  }

  eof() {
    return this.chars.eof();
  }

  croak(msg) {
    return this.chars.croak(msg);
  }
}

module.exports = TokenStream;
