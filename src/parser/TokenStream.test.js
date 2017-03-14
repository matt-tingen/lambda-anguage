const test = require('ava');
const sinon = require('sinon');
const TokenStream = require('./TokenStream.js');
const CharacterStream = require('./CharacterStream.js');

// Macros / Helpers
  const tokenStreamFromString = input => new TokenStream(new CharacterStream(input));

  function testTokenization(t, input, type, value=input) {
    ['next', 'peek'].forEach(method => {
        const tokens = tokenStreamFromString(input);
        t.deepEqual(tokens[method](), { type, value });
    });
  }
  testTokenization.title = (providedTitle, input, type) => (providedTitle || `Identifies ${input} as ${type}`);

  function tokenizationThrows(t, input) {
    ['next', 'peek'].forEach(method => {
        const tokens = tokenStreamFromString(input);
        t.throws(tokens[method].bind(tokens));
    });
  }
  tokenizationThrows.title = (providedTitle, input) => (providedTitle || `Croaks on ${input}`);


// Basic Tokenization
  test(testTokenization, '{', 'punc');
  test(testTokenization, '}', 'punc');
  test(testTokenization, '(', 'punc');
  test(testTokenization, ')', 'punc');
  test(testTokenization, ',', 'punc');
  test(testTokenization, ';', 'punc');

  test(testTokenization, '0', 'num', 0);
  test(testTokenization, '1', 'num', 1);
  test(testTokenization, '42', 'num', 42);
  test(testTokenization, '1.21', 'num', 1.21);
  test(testTokenization, '.5', 'num', .5);
  test(testTokenization, '0.25', 'num', .25);
  test(testTokenization, '016', 'num', 16); // No octal literals

  test(testTokenization, `""`, 'str', ``);
  test(testTokenization, `"abc"`, 'str', `abc`);
  test(testTokenization, `"123 abc"`, 'str', `123 abc`);
  test(testTokenization, `"'"`, 'str', `'`);
  test(testTokenization, `" "`, 'str', ` `);
  test.skip('Identifies escaped quotes', testTokenization, `"\\"test\\"`, 'str', `"test"`);
  test.skip('Identifies new line string', testTokenization, `"\\n"`, 'str', `\n`);
  test.skip('Identifies escaped slash', testTokenization, `"\\\\"`, 'str', `\\`);


  test(testTokenization, 'λ', 'kw', 'lambda');
  test(testTokenization, 'lambda', 'kw');
  test(testTokenization, 'if', 'kw');
  test(testTokenization, 'then', 'kw');
  test(testTokenization, 'else', 'kw');

  test(testTokenization, 'a', 'id');
  test(testTokenization, 'id', 'id');
  test(testTokenization, 'var', 'id');
  test(testTokenization, 'lamb', 'id');
  test(testTokenization, 'lambdas', 'id');
  test(testTokenization, 'snake_case', 'id');
  test(testTokenization, 'PascalCase', 'id');
  test(testTokenization, 'camelCase', 'id');
  test(testTokenization, '_', 'id');
  test(testTokenization, '__dunder__', 'id');

  test(testTokenization, '=', 'op');
  test(testTokenization, '+', 'op');
  test(testTokenization, '!=', 'op');
  test(testTokenization, '==', 'op');
  test(testTokenization, '-', 'op');
  test(testTokenization, '/', 'op');
  test(testTokenization, '*', 'op');

// Skips
  test('skips spaces at beginning', testTokenization, '  5', 'num', 5);
  test('skips lf at beginning', testTokenization, '\n\n5', 'num', 5);
  test('skips crlf at beginning', testTokenization, '\r\n\r\n5', 'num', 5);
  test('skips spaces at end', testTokenization, '5  ', 'num', 5);
  test('skips lf at end', testTokenization, '5\n\n', 'num', 5);
  test('skips crlf at end', testTokenization, '5\r\n\r\n', 'num', 5);
  
  test('is eof on empty input', t => {
    const tokens = tokenStreamFromString('');
    t.true(tokens.eof());
  });
  test('is eof after only whitespace', t => {
    const tokens = tokenStreamFromString('\r\n\r\n');
    t.true(tokens.eof());
  });

  test('is eof after only a comment', t => {
    const tokens = tokenStreamFromString('# comment');
    t.true(tokens.eof());
  });
  test('skips empty comment', testTokenization, '#\n5', 'num', 5);
  test(
    'skips comments',
    testTokenization,
    [
      '# comment',
      '# another comment',
      '5',
    ].join('\n'),
    'num',
    5
  );

// Errors
  test(tokenizationThrows, 'α'); // alpha - unicode chars are not allowed in identifiers
  test(tokenizationThrows, '.');
  test(tokenizationThrows, ':');
  test(tokenizationThrows, '!');
  test(tokenizationThrows, '^');
  test(tokenizationThrows, '&');
  test(tokenizationThrows, '%');
  test(tokenizationThrows, '$');
  test(tokenizationThrows, '@');
  test(tokenizationThrows, '?');
  test(tokenizationThrows, "'abc'"); // single quotes not supported
  test(tokenizationThrows, "[");

  test('croak throws via character stream', t => {
    const chars = new CharacterStream('abc');
    sinon.spy(chars, 'croak');
    const tokens = new TokenStream(chars);

    t.throws(() => tokens.croak('msg'));
    t.true(chars.croak.calledOnce);
    t.true(chars.croak.calledWithExactly('msg'));
  });

  test('provides meaningful message on invalid number', t => {
    const chars = new CharacterStream('. ');
    sinon.spy(chars, 'croak');   
    const tokens = new TokenStream(chars);
    const message = 'Expected number continuation, found " ".';

    try {
      tokens.next();
    } catch (err) {}

    t.true(chars.croak.calledOnce);
    t.true(chars.croak.alwaysCalledWithExactly(message));
  });

// Multiple Tokens
  test('next advances index', t => {
    const tokens = tokenStreamFromString('1 2');
    t.deepEqual(tokens.next(), {type: 'num', value: 1});
    t.deepEqual(tokens.next(), {type: 'num', value: 2});
  });

  test('peek does not advance index', t => {
    const tokens = tokenStreamFromString('1 2');
    t.deepEqual(tokens.peek(), {type: 'num', value: 1});
    t.deepEqual(tokens.next(), {type: 'num', value: 1});
  });

  test('identifies kebab as separate tokens', t => {
    const tokens = tokenStreamFromString('a-b-c');
    t.deepEqual(tokens.next(), {type: 'id', value: 'a'});
    t.deepEqual(tokens.next(), {type: 'op', value: '-'});
    t.deepEqual(tokens.next(), {type: 'id', value: 'b'});
    t.deepEqual(tokens.next(), {type: 'op', value: '-'});
    t.deepEqual(tokens.next(), {type: 'id', value: 'c'});
  });

  test('allows parenthesis to abut', t => {
    const tokens = tokenStreamFromString('(4)');
    t.deepEqual(tokens.next(), {type: 'punc', value: '('});
    t.deepEqual(tokens.next(), {type: 'num', value: 4});
    t.deepEqual(tokens.next(), {type: 'punc', value: ')'});
  });

  test('is greedy', t => {
    const tokens = tokenStreamFromString('===');
    t.deepEqual(tokens.next(), {type: 'op', value: '=='});
    t.deepEqual(tokens.next(), {type: 'op', value: '='});
  });

  test("doesn't discriminate misordered parenthesis", t => {
    const tokens = tokenStreamFromString(')(');
    t.deepEqual(tokens.next(), {type: 'punc', value: ')'});
    t.deepEqual(tokens.next(), {type: 'punc', value: '('});
  });

  test("identifies hex literal as seperate tokens", t => {
    const tokens = tokenStreamFromString('0xA2');
    t.deepEqual(tokens.next(), {type: 'num', value: 0});
    t.deepEqual(tokens.next(), {type: 'id', value: 'xA2'});
  });

  test('identifies tokens in assignment expression', t => {
    const tokens = tokenStreamFromString('test = 4 + 2');
    t.deepEqual(tokens.next(), {type: 'id', value: 'test'});
    t.deepEqual(tokens.next(), {type: 'op', value: '='});
    t.deepEqual(tokens.next(), {type: 'num', value: 4});
    t.deepEqual(tokens.next(), {type: 'op', value: '+'});
    t.deepEqual(tokens.next(), {type: 'num', value: 2});
  });

  test('identifies tokens in assignment expression without whitespace', t => {
    const tokens = tokenStreamFromString('test=4+2');
    t.deepEqual(tokens.next(), {type: 'id', value: 'test'});
    t.deepEqual(tokens.next(), {type: 'op', value: '='});
    t.deepEqual(tokens.next(), {type: 'num', value: 4});
    t.deepEqual(tokens.next(), {type: 'op', value: '+'});
    t.deepEqual(tokens.next(), {type: 'num', value: 2});
  });
  test('Identifies tokens woven between comments', t => {
    const tokens = tokenStreamFromString([
      '# first',
      '5',
      '# test',
      '1',
      '# comment',
    ].join('\n'));

    t.deepEqual(tokens.next(), {type: 'num', value: 5});
    t.deepEqual(tokens.next(), {type: 'num', value: 1});
    t.true(tokens.eof());
  });

// EOF
  test('eof returns true-negative', t => {
    const tokens = tokenStreamFromString('7');
    t.false(tokens.eof());
  });

  test('eof returns true-positive', t => {
    const tokens = tokenStreamFromString('7');
    tokens.next();
    t.true(tokens.eof());
  });

// Optimizations
  test('next after peek is short-cutted', t => {
    const tokens = tokenStreamFromString('7');
    sinon.spy(tokens, 'checkNumber');
    tokens.peek();
    tokens.next();
    t.true(tokens.checkNumber.calledOnce);
  });