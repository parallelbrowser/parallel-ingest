const test = require('ava')
const {newDB, ts} = require('./lib/util')
const DatArchive = require('node-dat-archive')
const tempy = require('tempy')

var archives = []

async function setupNewDB () {
  const testDB = newDB()
  testDB.schema({
    version: 1,
    single: {
      singular: true,
      index: ['first', 'second', 'first+second', 'third', '_author']
    },
    multi: {
      primaryKey: 'first',
      index: ['first', 'second', 'first+second', 'third', '_author']
    }
  })
  await testDB.open()
  await testDB.addArchives(archives)
  return testDB
}

test.before('setup archives', async () => {
  async function def (i, fn) {
    const a = await DatArchive.create({localPath: tempy.directory(), author: {url: 'dat://' + (i.toString().repeat(32))}})
    await a.mkdir('/multi')
    const write = (path, record) => a.writeFile(path, JSON.stringify(record))
    await fn(write, a)
    return a
  }
  for (let i = 0; i < 10; i++) {
    archives.push(await def(i, async write => {
      await write('/single.json', {first: 'first' + i, second: i, third: 'third' + i + 'single'})
      await write('/multi/1.json', {first: 'first' + i, second: (i+1)*100, third: 'third' + i + 'multi1'})
      await write('/multi/2.json', {first: 'first' + i, second: i, third: 'third' + i + 'multi2'})
      await write('/multi/3.json', {first: 'first' + (i+1)*100, second: i, third: 'third' + i + 'multi3'})
    }))
  }
})

test('above()', async t => {
  const testDB = await setupNewDB()
  var result = await testDB.single.where('first').above('first2').first()
  t.is(result.first, 'first3')
  var result = await testDB.single.where('second').above(3).first()
  t.is(result.second, 4)
  var result = await testDB.single.where('first+second').above(['first5',5]).first()
  t.is(result.first, 'first6')
  t.is(result.second, 6)
  var result = await testDB.single.where('first+second').above(['first5',0]).first()
  t.is(result.first, 'first5')
  t.is(result.second, 5)
  var result = await testDB.single.where('first+second').above(['first5',6]).first()
  t.is(result.first, 'first6')
  t.is(result.second, 6)
  await testDB.close()
})

test('aboveOrEqual()', async t => {
  const testDB = await setupNewDB()
  var result = await testDB.single.where('first').aboveOrEqual('first2').first()
  t.is(result.first, 'first2')
  var result = await testDB.single.where('second').aboveOrEqual(3).first()
  t.is(result.second, 3)
  var result = await testDB.single.where('first+second').aboveOrEqual(['first5',5]).first()
  t.is(result.first, 'first5')
  t.is(result.second, 5)
  var result = await testDB.single.where('first+second').aboveOrEqual(['first5',0]).first()
  t.is(result.first, 'first5')
  t.is(result.second, 5)
  var result = await testDB.single.where('first+second').aboveOrEqual(['first5',6]).first()
  t.is(result.first, 'first6')
  t.is(result.second, 6)
  await testDB.close()
})

test('anyOf()', async t => {
  const testDB = await setupNewDB()
  var results = await testDB.single.where('first').anyOf('first2', 'first4', 'first6').toArray()
  t.is(results.length, 3)
  t.is(results[0].first, 'first2')
  t.is(results[1].first, 'first4')
  t.is(results[2].first, 'first6')
  var results = await testDB.single.where('second').anyOf(2, 4, 6).toArray()
  t.is(results.length, 3)
  t.is(results[0].second, 2)
  t.is(results[1].second, 4)
  t.is(results[2].second, 6)
  var results = await testDB.single.where('first').anyOf('first0', 'first10000').toArray()
  t.is(results.length, 1)
  t.is(results[0].first, 'first0')
  await testDB.close()
})

test('anyOfIgnoreCase()', async t => {
  const testDB = await setupNewDB()
  var results = await testDB.single.where('first').anyOfIgnoreCase('FIRST2', 'FIRST4', 'FIRST6').toArray()
  t.is(results.length, 3)
  t.is(results[0].first, 'first2')
  t.is(results[1].first, 'first4')
  t.is(results[2].first, 'first6')
  var results = await testDB.single.where('second').anyOfIgnoreCase(2, 4, 6).toArray()
  t.is(results.length, 3)
  t.is(results[0].second, 2)
  t.is(results[1].second, 4)
  t.is(results[2].second, 6)
  var results = await testDB.single.where('first').anyOfIgnoreCase('FIRST0', 'FIRST10000').toArray()
  t.is(results.length, 1)
  t.is(results[0].first, 'first0')
  await testDB.close()
})

test('below()', async t => {
  const testDB = await setupNewDB()
  var result = await testDB.single.where('first').below('first2').last()
  t.is(result.first, 'first1')
  var result = await testDB.single.where('second').below(3).last()
  t.is(result.second, 2)
  var result = await testDB.single.where('first+second').below(['first5',5]).last()
  t.is(result.first, 'first4')
  t.is(result.second, 4)
  var result = await testDB.single.where('first+second').below(['first5',0]).last()
  t.is(result.first, 'first4')
  t.is(result.second, 4)
  var result = await testDB.single.where('first+second').below(['first5',6]).last()
  t.is(result.first, 'first5')
  t.is(result.second, 5)
  await testDB.close()
})

test('belowOrEqual()', async t => {
  const testDB = await setupNewDB()
  var result = await testDB.single.where('first').belowOrEqual('first2').last()
  t.is(result.first, 'first2')
  var result = await testDB.single.where('second').belowOrEqual(3).last()
  t.is(result.second, 3)
  var result = await testDB.single.where('first+second').belowOrEqual(['first5',5]).last()
  t.is(result.first, 'first5')
  t.is(result.second, 5)
  var result = await testDB.single.where('first+second').belowOrEqual(['first5',0]).last()
  t.is(result.first, 'first4')
  t.is(result.second, 4)
  var result = await testDB.single.where('first+second').belowOrEqual(['first5',6]).last()
  t.is(result.first, 'first5')
  t.is(result.second, 5)
  await testDB.close()
})

test('between()', async t => {
  const testDB = await setupNewDB()
  var results = await testDB.single.where('first').between('first2', 'first4').toArray()
  t.is(results.length, 1)
  t.is(results[0].first, 'first3')
  var results = await testDB.single.where('first').between('first2', 'first4', {includeLower: true}).toArray()
  t.is(results.length, 2)
  t.is(results[0].first, 'first2')
  t.is(results[1].first, 'first3')
  var results = await testDB.single.where('first').between('first2', 'first4', {includeUpper: true}).toArray()
  t.is(results.length, 2)
  t.is(results[0].first, 'first3')
  t.is(results[1].first, 'first4')
  var results = await testDB.single.where('first').between('first2', 'first4', {includeLower: true, includeUpper: true}).toArray()
  t.is(results.length, 3)
  t.is(results[0].first, 'first2')
  t.is(results[1].first, 'first3')
  t.is(results[2].first, 'first4')
  var results = await testDB.single.where('second').between(2, 4).toArray()
  t.is(results.length, 1)
  t.is(results[0].second, 3)
  var results = await testDB.single.where('second').between(2, 4, {includeLower: true}).toArray()
  t.is(results.length, 2)
  t.is(results[0].second, 2)
  t.is(results[1].second, 3)
  var results = await testDB.single.where('second').between(2, 4, {includeUpper: true}).toArray()
  t.is(results.length, 2)
  t.is(results[0].second, 3)
  t.is(results[1].second, 4)
  var results = await testDB.single.where('second').between(2, 4, {includeLower: true, includeUpper: true}).toArray()
  t.is(results.length, 3)
  t.is(results[0].second, 2)
  t.is(results[1].second, 3)
  t.is(results[2].second, 4)
  await testDB.close()
})

test('equals()', async t => {
  const testDB = await setupNewDB()
  var result = await testDB.single.where('first').equals('first2').first()
  t.is(result.first, 'first2')
  var result = await testDB.single.where('second').equals(3).first()
  t.is(result.second, 3)
  var result = await testDB.single.where('first+second').equals(['first4',4]).first()
  t.is(result.first, 'first4')
  t.is(result.second, 4)
  var result = await testDB.single.where('first').equals('no match').first()
  t.falsy(result)
  var result = await testDB.single.where('_origin').equals(archives[0].url).first()
  t.is(result.first, 'first0')
  var result = await testDB.single.where('_author').equals('dat://99999999999999999999999999999999').first()
  t.is(result.first, 'first9')
  await testDB.close()
})

test('equalsIgnoreCase()', async t => {
  const testDB = await setupNewDB()
  var result = await testDB.single.where('first').equalsIgnoreCase('FIRST2').first()
  t.is(result.first, 'first2')
  var result = await testDB.single.where('second').equalsIgnoreCase(3).first()
  t.is(result.second, 3)
  await testDB.close()
})

test('noneOf()', async t => {
  const testDB = await setupNewDB()
  var results = await testDB.single.where('first').noneOf('first2', 'first4', 'first6').toArray()
  t.is(results.length, 7)
  var results = await testDB.single.where('second').noneOf(2, 4, 6).toArray()
  t.is(results.length, 7)
  var results = await testDB.single.where('first').noneOf('first0', 'first10000').toArray()
  t.is(results.length, 9)
  await testDB.close()
})

test('notEqual()', async t => {
  const testDB = await setupNewDB()
  var results = await testDB.single.where('first').notEqual('first2').toArray()
  t.is(results.length, 9)
  var results = await testDB.single.where('second').notEqual(2).toArray()
  t.is(results.length, 9)
  var results = await testDB.single.where('first').noneOf('first10000').toArray()
  t.is(results.length, 10)
  await testDB.close()
})

test('startsWith()', async t => {
  const testDB = await setupNewDB()
  var results = await testDB.single.where('first').startsWith('first').toArray()
  t.is(results.length, 10)
  var results = await testDB.single.where('first').startsWith('nomatch').toArray()
  t.is(results.length, 0)
  await testDB.close()
})

test('startsWithAnyOf()', async t => {
  const testDB = await setupNewDB()
  var results = await testDB.single.where('first').startsWithAnyOf('first1', 'first2').toArray()
  t.is(results.length, 2)
  var results = await testDB.single.where('first').startsWithAnyOf('first', 'nomatch').toArray()
  t.is(results.length, 10)
  var results = await testDB.single.where('first').startsWithAnyOf('nomatch').toArray()
  t.is(results.length, 0)
  await testDB.close()
})

test('startsWithAnyOfIgnoreCase()', async t => {
  const testDB = await setupNewDB()
  var results = await testDB.single.where('first').startsWithAnyOfIgnoreCase('FIRST1', 'FIRST2').toArray()
  t.is(results.length, 2)
  var results = await testDB.single.where('first').startsWithAnyOfIgnoreCase('FIRST', 'NOMATCH').toArray()
  t.is(results.length, 10)
  var results = await testDB.single.where('first').startsWithAnyOfIgnoreCase('NOMATCH').toArray()
  t.is(results.length, 0)
  await testDB.close()
})

test('startsWithIgnoreCase()', async t => {
  const testDB = await setupNewDB()
  var results = await testDB.single.where('first').startsWithIgnoreCase('FIRST').toArray()
  t.is(results.length, 10)
  var results = await testDB.single.where('first').startsWithIgnoreCase('NOMATCH').toArray()
  t.is(results.length, 0)
  await testDB.close()
})

