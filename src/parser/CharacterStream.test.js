const test = require('ava');
const CharacterStream = require('./CharacterStream.js');

const advance = (stream, n) => {
  for (let i = 0; i < n; i++) {
    stream.next();
  }
};

test('next returns first character', t => {
  const stream = new CharacterStream('abc');
  t.is(stream.next(), 'a');
});

test('next advances index', t => {
  const stream = new CharacterStream('abc');
  t.is(stream.next(), 'a');
  t.is(stream.next(), 'b');
});

test('peek returns first character', t => {
  const stream = new CharacterStream('abc');
  t.is(stream.peek(), 'a');
});

test("peek doesn't advance index", t => {
  const stream = new CharacterStream('abc');
  t.is(stream.peek(), 'a');
  t.is(stream.peek(), 'a');
});

test('eof returns true-negatives', t => {
  const stream = new CharacterStream('abc');
  t.false(stream.eof());
});

test('eof returns true-positives', t => {
  const stream = new CharacterStream('abc');
  advance(stream, 3);
  t.true(stream.eof());
});

test('next returns empty string when eof', t => {
  const stream = new CharacterStream('abc');
  advance(stream, 3);
  t.is(stream.next(), '');
});

test('peek returns empty string when eof', t => {
  const stream = new CharacterStream('abc');
  advance(stream, 3);
  t.is(stream.peek(), '');
});

test('croak throws', t => {
  const stream = new CharacterStream('abc');
  t.throws(() => stream.croak('msg'));
});

test('croak message matches format', t => {
  const stream = new CharacterStream('abc');
  try {
    stream.croak('msg');
  } catch (e) {
    t.regex(e.message, /Croaked at \d+:\d+ - .+/);
  }
});

test('croak includes provided message', t => {
  const stream = new CharacterStream('abc');
  const msg = 'Custom Message';
  try {
    stream.croak(msg);
  } catch (e) {
    t.true(e.message.includes(msg));
  }
});

test('croak includes zero-indexed column number', t => {
  const stream = new CharacterStream('abc');
  try {
    stream.croak('msg');
  } catch (e) {
    t.regex(e.message, /:0\b/);
  }
});

test('croak includes one-indexed line number', t => {
  const stream = new CharacterStream('abc');
  try {
    stream.croak('msg');
  } catch (e) {
    t.regex(e.message, /\b1:/);
  }
});

test('line number is incremented', t => {
  const stream = new CharacterStream('abc\ndef');
  advance(stream, 4);
  try {
    stream.croak('msg');
  } catch (e) {
    t.regex(e.message, /\b2:/);
  }
});
