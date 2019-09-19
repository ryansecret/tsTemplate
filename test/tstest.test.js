'use strict';

const assert = require('assert');
const Tool = require('../src');
describe('test/index.js', () => {
  const tool = new Tool();


  it('should hi', () => {
    assert(tool.hello() === 'hi1');
  });

});
