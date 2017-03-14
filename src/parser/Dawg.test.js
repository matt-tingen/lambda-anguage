const test = require('ava');
const sinon = require('sinon');
const Dawg = require('./Dawg.js');

test('check returns true-positive', t => {
  const dawg = new Dawg(['a']);
  t.true(dawg.check('a'));
});

test('check returns true-negative', t => {
  const dawg = new Dawg(['a']);
  t.false(dawg.check('b'));
});

test('check returns true-positives with multiple options', t => {
  const dawg = new Dawg(['a', 'b']);
  t.true(dawg.check('a'));
  t.true(dawg.check('b'));
});

test('check returns true-negative with multiple options', t => {
  const dawg = new Dawg(['a', 'b']);
  t.false(dawg.check('c'));
});

test('next returns first character consumed', t => {
  const dawg = new Dawg(['a', 'b']);
  t.is(dawg.next('a'), 'a');
});

test('next throws on invalid option', t => {
  const dawg = new Dawg(['a', 'b']);
  t.throws(() => dawg.next('c'));
});

test('next throws on invalid end-of-word', t => {
  const dawg = new Dawg(['a', 'b']);
  t.throws(() => dawg.next(null));
});

test('next consumes multiple characters', t => {
  const dawg = new Dawg(['abc', 'a']);
  t.notThrows(() => dawg.next('a'));
  t.notThrows(() => dawg.next('b'));
  t.notThrows(() => dawg.next('c'));
});

test('check returns true-positive for second character', t => {
  const dawg = new Dawg(['abc']);
  dawg.next('a');
  t.true(dawg.check('b'));
});

test('check returns true-negative for second character', t => {
  const dawg = new Dawg(['abc']);
  dawg.next('a');
  t.false(dawg.check('c'));
});

test('check returns true-positive for end-of-word', t => {
  const dawg = new Dawg(['abc', 'a']);
  dawg.next('a');
  dawg.next('b');
  dawg.next('c');
  t.true(dawg.check(null));
});

test('next consumes end-of-word', t => {
  const dawg = new Dawg(['abc', 'a']);
  dawg.next('a');
  dawg.next('b');
  dawg.next('c');
  t.notThrows(() => dawg.next(null));
});

test('next throws on null after end-of-word', t => {
  const dawg = new Dawg(['abc', 'a']);
  dawg.next('a');
  dawg.next('b');
  dawg.next('c');
  dawg.next(null);
  t.throws(() => dawg.next(null));
});

test('next throws on first character after end-of-word', t => {
  const dawg = new Dawg(['abc', 'a']);
  dawg.next('a');
  dawg.next('b');
  dawg.next('c');
  dawg.next(null);
  t.throws(() => dawg.next('a'));
});

test('check returns true-positive for alternative to end-of-word', t => {
  const dawg = new Dawg(['abc', 'abcd']);
  dawg.next('a');
  dawg.next('b');
  dawg.next('c');
  t.true(dawg.check('d'));
});

test('next consumes alternative to end-of-word', t => {
  const dawg = new Dawg(['abc', 'abcd']);
  dawg.next('a');
  dawg.next('b');
  dawg.next('c');
  t.notThrows(() => dawg.next('d'));
});

test('check returns true-negative for end-of-word', t => {
  const dawg = new Dawg(['abc', 'a']);
  dawg.next('a');
  dawg.next('b');
  t.false(dawg.check(null));
});

test('next returns all characters consumed', t => {
  const dawg = new Dawg(['abc', 'abcd']);
  dawg.next('a');
  t.is(dawg.next('b'), 'ab');
  t.is(dawg.next('c'), 'abc');
});

test('next whole word', t => {
  const dawg = new Dawg(['abc', 'abcd']);
  dawg.next('a');
  dawg.next('b');
  dawg.next('c');
  t.is(dawg.next(null), 'abc');
});

test('reset is idempotent when already reset', t => {
  const dawg = new Dawg(['abc']);
  dawg.reset();
  t.is(dawg.next('a'), 'a');
});

test('reset is clears history mid-word', t => {
  const dawg = new Dawg(['abc']);
  dawg.next('a');
  dawg.next('b');
  dawg.reset();
  t.is(dawg.next('a'), 'a');
});

test('reset is clears history at eow', t => {
  const dawg = new Dawg(['abc']);
  dawg.next('a');
  dawg.next('b');
  dawg.next('c');
  dawg.reset();
  t.is(dawg.next('a'), 'a');
});

test('reset returns the instance', t => {
  const dawg = new Dawg(['abc']);
  dawg.next('a');
  t.is(dawg.reset(), dawg);
});