import { GalaxyMahjongRule } from '@/lib/mahjong/galaxy_rule'

const RULE = GalaxyMahjongRule.getInstance()
const parser = (s:string) => RULE.parser.parseTiles(s)

// 【#20 待ち牌検索バグの真因】
// solveHand(14枚) は solveNormalHand を呼ぶ。solveNormalHand は
//   const _intermediateHand = this.takeDuizi(tiles)   // 雀頭が1つも無いと []
//   takeRecursivelyXZi(_intermediateHand.map(...), ...) // [] を渡す
// となり、takeRecursivelyXZi 冒頭 `intermediateHand[0][1]` で
// intermediateHand[0] が undefined となりクラッシュする。
//
// 期待値の根拠（spec §4・§5・一般ルール）:
//   「雀頭が1枚も作れない14枚手」は和了形（標準形/七対子/国士）たりえない。
//   よって solveHand は **空配列を返すべき**であり、例外を投げてはならない。
//   待ち牌探索 solveHuleTile は候補牌を補った手で和了判定を行うため、
//   補完後に雀頭なし手が現れると探索全体がこの例外で巻き添えになる（= #20 の症状）。
//
// これは実装出力をなぞった期待値ではなく、和了形の定義から導いた期待値である。
describe('[bug #20] solveHand は雀頭なし14枚手でクラッシュせず空を返す', () => {
  it('雀頭が1つも無い14枚手（全て異なる牌）でも例外を投げない', () => {
    // 14枚すべて異なる数牌・字牌 → 対子なし。和了形ではないので結果は空。
    const hand = parser('1w2w3w4w5w6w7w8w9w1p2p3p4p5p')
    expect(() => RULE.solveHand(hand)).not.toThrow()
    expect(RULE.solveHand(hand).length).toBe(0)
  })

  it('issue 由来の具体手: 1w2w3w 7p8p9p 2s..8s + 4w（雀頭なし）でも投げない', () => {
    // solveHuleTile が候補 4w を補った時に内部で生成される 14 枚手に相当。
    const hand = parser('1w2w3w7p8p9p2s3s4s5s6s7s8s4w')
    expect(() => RULE.solveHand(hand)).not.toThrow()
    expect(RULE.solveHand(hand).length).toBe(0)
  })
})
