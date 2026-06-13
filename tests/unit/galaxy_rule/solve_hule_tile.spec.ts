import { GalaxyMahjongRule } from '@/lib/mahjong/galaxy_rule'
import { galaxyMianziToString, waitForm } from '@/lib/mahjong/mianzi'
import { _ } from '@/lib/util/util'

const GALAXY_RULE = GalaxyMahjongRule.getInstance()
const parser = (str:string) => GALAXY_RULE.parser.parseTiles(str)

describe('通常形上がり牌探索', () => {
  it('待ち判定', () => {
    const hand = parser('ngegn4s5s6s6p5p4wg1wg1w2w3w')
    const wait = GALAXY_RULE.solveHuleTile(hand)
    /*
    wait.forEach(([mianzis, waitTile, _waitForm]) => {
      console.log(
        mianzis.map(m => galaxyMianziToString(m)).join(','),
        waitTile.map(t => t.toString()).join(','),
        waitForm[_waitForm])
    })
    */
    expect(wait.length).toBe(6)
  })

  it('対称な双椪の片側を取りこぼさない', () => {
    // #20 真症状: 222 33 444 55 は 3 面子+雀頭の一歩手前。
    // 3s で和了 = 222/333/444 + 雀頭55、対称な 5s で和了 = 222/444/555 + 雀頭33。
    // 仕様(3面子+1雀頭)から人手で導いた正しい待ち = {3s, 4s, 5s, 6s}。
    // 以前は対称解の片側(5s)を列挙で取りこぼしていた。
    const hand = parser('2s2s2s3s3s4s4s4s5s5s')
    const wait = GALAXY_RULE.solveHuleTile(hand)
    const waitTiles = _.uniq(
      wait.map(([mianzi, tiles, form]) => tiles).flat(),
      (ta, tb) => GALAXY_RULE.compareTileByNumber(ta, tb)
    )
    expect(waitTiles.length).toBe(4)
    parser('3s4s5s6s').forEach(w => {
      expect(waitTiles).toContainEqual(w)
    })
  })

  it('双椪判定', () => {
    const hand = parser('nnlglg')
    const wait = GALAXY_RULE.solveHuleTile(hand)
    /*
    wait.forEach(([mianzis, waitTile, _waitForm]) => {
      console.log(
        mianzis.map(m => galaxyMianziToString(m)).join(','),
        waitTile.map(t => t.toString()).join(','),
        waitForm[_waitForm])
    })
    */
    expect(wait.length).toBe(3)
  })

  it('七対子判定', () => {
    const hand = parser('1w1w1wg3p3p5s5snnwwhh')
    const wait = GALAXY_RULE.solveHuleTile(hand)
    /*
    wait.forEach(([mianzis, waitTile, _waitForm]) => {
      console.log(
        mianzis.map(m => galaxyMianziToString(m)).join(','),
        waitTile.map(t => t.toString()).join(','),
        waitForm[_waitForm])
    })
    */
    expect(wait.length).toBe(4)
  })

  it('国士無双判定', () => {
    const hand = parser('1wg9wg9p1s9swssgenbbgh')
    const wait = GALAXY_RULE.solveHuleTile(hand)
    /*
    wait.forEach(([mianzis, waitTile, _waitForm]) => {
      console.log(
        mianzis.map(m => galaxyMianziToString(m)).join(','),
        waitTile.map(t => t.toString()).join(','),
        waitForm[_waitForm])
    })
    */
    expect(wait.length).toBe(8)
  })

  it('国士七対子総合判定', () => {
    const hand = parser('9s1p9pg1wg9wgesgwngblghhg')
    const wait = GALAXY_RULE.solveHuleTile(hand)
    /*
    wait.forEach(([mianzis, waitTile, _waitForm]) => {
      console.log(
        mianzis.map(m => galaxyMianziToString(m)).join(','),
        waitTile.map(t => t.toString()).join(','),
        waitForm[_waitForm])
    })
    */
    const waitTiles = _.uniq(wait.map(([mianzi, tiles, form]) => tiles).flat(), (ta, tb) => GALAXY_RULE.compareTileByNumber(ta, tb))
    expect(waitTiles.length).toBe(5)
    parser('1s1w9p9w9s').forEach(w => {
      expect(waitTiles).toContainEqual(w)
    })
  })
})
