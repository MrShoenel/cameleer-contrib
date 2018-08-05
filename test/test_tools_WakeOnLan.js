require('../meta/typedefs');

const { assert } = require('chai')
, { assertThrowsAsync } = require('sh.orchestration-tools')
, { wakeAsync, macRegex } = require('../lib/tools/WakeOnLan');


describe('Tools_WakeOnLan', () => {
  it('should only accept valid MAC addresses', async function() {
    this.timeout(5000);

    assert.isTrue(macRegex.test('01:02:03:04:05:ff'));
    assert.isFalse(macRegex.test('01-02-03-04-05-ff'));

    await assertThrowsAsync(async() => {
      await wakeAsync('foo');
    });

    const now = +new Date;
    await wakeAsync('00:00:00:00:00:00', .5);
    const then = (+new Date) - now;
    assert.isAtLeast(then, 500);

    const now2 = +new Date;
    await wakeAsync('00:00:00:00:00:00', -2);
    const then2 = (+new Date) - now2;
    assert.isBelow(then2, 1000); // because the above arg for waiting is invalid
  });
});