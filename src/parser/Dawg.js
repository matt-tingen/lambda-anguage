class Trie {
  constructor(values) {
    this.root = Object.create(null);
    values.forEach(valueArray => this.addValueArray(valueArray));
  }

  addValueArray(values) {
    let node = this.root;
    values.forEach(value => {
      node = this.addChild(node, value);
    });
  }

  addChild(node, value) {
    if (!(value in node)) {
      node[value] = Object.create(null);
    }
    return node[value];
  }
}


class Dawg {
  constructor(words) {
    this.trie = new Trie(words.map(word => [...word.split(''), null]));
    this.reset();
  }

  reset() {
    this.node = this.trie.root;
    this.trail = '';
    return this;
  }

  check(char) {
    return char in this.node;
  }

  next(char) {
    if (this.check(char)) {
      this.node = this.node[char];
      if (char) this.trail += char;
      return this.trail;
    }
    throw new Error(`Character not available: ${char}`)
  }
}


module.exports = Dawg;
