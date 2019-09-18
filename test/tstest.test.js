'use strict';

const assert = require('assert')
const Tool = require('../src');
describe('test/index.js', () => {
  const tool = new Tool();


  it('should hi', () => {
    assert(tool.hello() === 'hi1');
  });

});
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(3), -1);
    });
  });
});

