import { GalaxyMahjongRule } from '@/lib/mahjong/galaxy_rule'
import { _ } from '@/lib/util/util'

const RULE = GalaxyMahjongRule.getInstance()
const parser = (s:string) => RULE.parser.parseTiles(s)

/** solveHuleTile の待ち牌集合を、色・数の重複を除いた文字列ソート配列で取り出すヘルパ。 */
const waitTileSet = (hand:ReturnType<typeof parser>):string[] => {
  const wait = RULE.solveHuleTile(hand)
  const tiles = _.uniq(
    wait.map(([_mianzis, tiles, _form]) => tiles).flat(),
    (ta, tb) => RULE.compareTileByNumber(ta, tb)
  )
  return tiles.map(t => t.toString()).sort()
}

// 【#29 待ち牌探索(solveHuleTile)レベルの回帰テスト】
//
// 背景（監査指摘）:
//   #28 の修正テスト(issue20_pairless_crash.spec.ts)は solveHand 単体での
//   クラッシュ非再現のみを検証しており、ユーザー症状の経路である
//   solveHuleTile レベルの回帰テストが無い。
//   solveHuleTile は手牌から面子/雀頭を再帰的に抜く takeRecursivelyXZi を
//   直接駆動するため、(a) 補完過程で面子が取りきれず牌が残る/雀頭が無い
//   中間構成が現れても探索が壊れないこと、(b) 対称な双椪解の片側を
//   取りこぼさず正しい待ちを返すこと、を public 経路で担保する。
//
// 期待値の根拠（いずれも spec 由来であり実装出力ではない）:
//   - 「両面」待ちの待ち牌は連続2枚の両端2種 (spec §5.1)。
//   - 標準形は「3面子+1雀頭の一歩手前」から待ちを導く (spec §4.1, §5)。
//     222s/444s + 789w の3面子に対し、雀頭候補が 33s と 55s の双方ありえ、
//     さらに 345s 順子化を含めると待ちは {3s,4s,5s,6s} の4種 (spec §3,§5)。
describe('[bug #29] solveHuleTile は補完過程で壊れず双椪の片側も取りこぼさない', () => {
  it('(a) 面子優先探索で行き止まり構成が生じても例外を投げず両面の待ちを返す', () => {
    // 1w1w 234w 567w 234s + 6s7s（両面塔子）の13枚聴牌。
    // solveHuleTile は面子を最大限抜く過程で雀頭の取れない/牌の余る
    // 中間構成を生成しうるが、探索全体が壊れてはならない。
    // spec §5.1「両面」より、6s7s の待ちは両端 5s と 8s。
    const hand = parser('1w1w2w3w4w5w6w7w2s3s4s6s7s')

    expect(() => RULE.solveHuleTile(hand)).not.toThrow()
    expect(waitTileSet(hand)).toEqual(['5s', '8s'])
  })

  it('(b) 完全な13枚聴牌の対称な双椪でも片側(5s)を取りこぼさない', () => {
    // 789w（完成面子）+ 索子 222s 33s 444s 55s の13枚聴牌。
    // 索子部は #20 スクショ手(2s2s2s3s3s4s4s4s5s5s)と同じ「3面子+雀頭の
    // 一歩手前」構造だが、ここでは 789w を加えた完全な13枚聴牌として
    // solveHuleTile を public 経路で検証する（既存テストは10枚の索子断片のみ）。
    // 3s 和了 = 222s/333s/444s+雀頭55s、対称な 5s 和了 = 222s/444s/555s+雀頭33s、
    // さらに 345s 順子待ちを含め、仕様(3面子+1雀頭)から導いた正しい待ち = {3s,4s,5s,6s}。
    // 以前は対称解の片側(5s)を再帰の途中で捨てて取りこぼしていた。
    const hand = parser('7w8w9w2s2s2s3s3s4s4s4s5s5s')

    expect(() => RULE.solveHuleTile(hand)).not.toThrow()
    const waitTiles = waitTileSet(hand)
    expect(waitTiles).toEqual(['3s', '4s', '5s', '6s'])
  })
})
