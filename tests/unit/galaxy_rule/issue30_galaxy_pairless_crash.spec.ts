import { GalaxyMahjongRule } from '@/lib/mahjong/galaxy_rule'

const RULE = GalaxyMahjongRule.getInstance()
const parser = (s:string) => RULE.parser.parseTiles(s)

// 【#30 銀河牌を含む「雀頭なし手」のクラッシュ非再現テスト】
//
// 背景（監査指摘）:
//   #28 の修正テスト(issue20_pairless_crash.spec.ts)は非銀河の手のみを扱う。
//   銀河牌(ワイルドカード)を含む手では makeMianzi が色・数を複数候補に
//   展開するため、面子/雀頭分解の分岐条件が非銀河手と異なりうる。
//   銀河牌を含みつつ雀頭が一つも取れない手でも、#28 のガードが効いて
//   takeRecursivelyXZi が empty-intermediate で壊れないことを確認する。
//
// 期待値の根拠 (spec §1.3 / §3.1 / §4):
//   - 銀河の数牌は「同じ数字ならどの色にもなれる」が「数字までは自由にならない」。
//     よって銀河牌は『同じ数字の牌が他に1枚も無ければ対子を作れない』。
//   - 銀河の風牌は「どの風牌にもなれる」が、風牌が他に1枚も無ければ対子を作れない。
//   - 「雀頭が1枚も作れない手」は和了形(標準形/七対子/国士)たりえず空配列を返すべきで、
//     例外を投げてはならない。
//   いずれも実装出力ではなく仕様から導いた期待値である。
describe('[bug #30] solveHand は銀河牌を含む雀頭なし手でも壊れず空を返す', () => {
  it('銀河の数牌(5sg)を含むが同数の牌が他に無く雀頭が作れない14枚手でも投げない', () => {
    // 1w2w3w4w 6w7w8w9w 1p2p3p4p 6p + 5sg。
    // 数 5 の牌は銀河牌 5sg ただ1枚 → 5sg は対子相手を持たない。
    // 他の牌も全て (色,数) が相異なり対子化不能 → 雀頭ゼロ。
    const hand = parser('1w2w3w4w6w7w8w9w1p2p3p4p6p5sg')

    expect(hand.some(t => t.option.isGalaxy)).toBe(true)
    expect(() => RULE.solveHand(hand)).not.toThrow()
    expect(RULE.solveHand(hand).length).toBe(0)
  })

  it('銀河の風牌(北g)を含むが他に風牌が無く雀頭が作れない14枚手でも投げない', () => {
    // 1w2w3w 6w7w8w9w 1p2p3p 6p7p8p + ng(北の銀河牌)。
    // 風牌は ng ただ1枚 → どの風にもなれるが対子相手の風牌が無い。
    // ng の内部数(北=4)と衝突しないよう数 4 の牌は手牌に入れていないため
    // 数牌側とも対子を作れない → 雀頭ゼロ。
    const hand = parser('1w2w3w6w7w8w9w1p2p3p6p7p8png')

    expect(hand.some(t => t.option.isGalaxy)).toBe(true)
    expect(() => RULE.solveHand(hand)).not.toThrow()
    expect(RULE.solveHand(hand).length).toBe(0)
  })
})
