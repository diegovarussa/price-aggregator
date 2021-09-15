import { FtxFeeder, Tick, TradeSide } from "./feeder/FtxFeeder";

interface CompareTick extends Tick {
  // average: number;
  tradeSide: TradeSide;
  tradeSpread: number;
  tradeMaxSpread: number;
  tradeMinSpread: number;
  tradeSize: number;
  tradePercentage: number;
  tradeMaxPercentage: number;
  tradeMinPercentage: number;
}
interface BaseTick extends Tick {
  // average: number;
  compareArray: Map<string, CompareTick>;
}

let ftxFeeder = new FtxFeeder();
let lastTick = new Map<string, BaseTick>();

// console.log(ftxFeeder.marketSymbols.size);
ftxFeeder.on('ready', () => {
  // console.log(ftxFeeder.marketSymbols.size);
  // ftxFeeder.marketSymbols.forEach((market, symbol) => {
  //   console.log(symbol);
  //   console.log(market);
  // });
  // console.log(ftxFeeder.marketSymbols.get('BTC'));
  ftxFeeder.subscribeSymbol('BTC/USD');
  ftxFeeder.subscribeSymbol('BTC-PERP');
  ftxFeeder.marketSymbols.get('BTC')!.forEach(market => {
    // console.log(market.name);
    ftxFeeder.subscribeSymbol(market.name);
  });
});

ftxFeeder.on('tick', (tick: Tick) => {
  // console.log(`-----------------${tick.market}--------------------------`);
  // console.log(tick);
  // let tickAveragePrice = (tick.ask + tick.bid) / 2;
  // console.log(`Average: ${tickAveragePrice}`);

  let baseTick: BaseTick = {
    ...tick,
    // average: tickAveragePrice,
    compareArray: new Map<string, CompareTick>()
  };

  lastTick.forEach((current: BaseTick, market: string) => {
    if (tick.symbol === current.symbol && tick.market !== current.market) {
      // console.log(data);
      // let averagePrice = (data.ask + data.bid) / 2;
      // console.log(`Average: ${averagePrice}`);

      let compareTick: CompareTick = {
        symbol: current.symbol,
        market: current.market,
        bid: current.bid,
        ask: current.ask,
        bidSize: current.bidSize,
        askSize: current.askSize,
        time: current.time,
        tradeSide: TradeSide.buy,
        tradeSpread: 0,
        tradeMaxSpread: 0,
        tradeMinSpread: Infinity,
        tradeSize: 0,
        tradePercentage: 0,
        tradeMaxPercentage: 0,
        tradeMinPercentage: Infinity,
      };

      if (current.compareArray.has(tick.market)) {
        let currentMarket: CompareTick = current.compareArray.get(tick.market)!;
        compareTick.tradeMaxSpread = currentMarket.tradeMaxSpread;
        compareTick.tradeMinSpread = currentMarket.tradeMinSpread;
        compareTick.tradeMaxPercentage = currentMarket.tradeMaxPercentage;
        compareTick.tradeMinPercentage = currentMarket.tradeMinPercentage;
      }

      if (tick.bid > current.ask) { // Need to short
        let sellSpread = Math.abs(tick.bid - current.ask);
        let sellSize = Math.min(tick.bidSize, current.askSize);
        let sellPercentage = parseFloat(((sellSpread / current.ask) * 100).toFixed(2));
        compareTick.tradeSide = TradeSide.sell;
        compareTick.tradeSpread = sellSpread;
        compareTick.tradeSize = sellSize;
        compareTick.tradePercentage = sellPercentage;
        if (sellSpread > compareTick.tradeMaxSpread) {
          compareTick.tradeMaxSpread = sellSpread;
        }
        if (sellSpread < compareTick.tradeMinSpread) {
          compareTick.tradeMinSpread = sellSpread;
        }
        if (sellPercentage > compareTick.tradeMaxPercentage) {
          compareTick.tradeMaxPercentage = sellPercentage;
        }
        if (sellPercentage < compareTick.tradeMinPercentage) {
          compareTick.tradeMinPercentage = sellPercentage;
        }
      } else if (current.bid > tick.ask) { // Need to long
        let buySpread = Math.abs(tick.ask - current.bid);
        let buySize = Math.min(tick.askSize, current.bidSize);
        let buyPercentage = parseFloat(((buySpread / current.bid) * 100).toFixed(2));
        compareTick.tradeSide = TradeSide.buy;
        compareTick.tradeSpread = buySpread;
        compareTick.tradeSize = buySize;
        compareTick.tradePercentage = buyPercentage;
        if (buySpread > compareTick.tradeMaxSpread) {
          compareTick.tradeMaxSpread = buySpread;
        }
        if (buySpread < compareTick.tradeMinSpread) {
          compareTick.tradeMinSpread = buySpread;
        }
        if (buyPercentage > compareTick.tradeMaxPercentage) {
          compareTick.tradeMaxPercentage = buyPercentage;
        }
        if (buyPercentage < compareTick.tradeMinPercentage) {
          compareTick.tradeMinPercentage = buyPercentage;
        }
      }

      baseTick.compareArray.set(current.market, compareTick);

    }
  });
  lastTick.set(tick.market, baseTick);
  // console.log(lastTick);
  let tempTable = new Map<string, string>();
  lastTick.forEach((data, market) => {
    // console.log(data);
    let temp = '';
    data.compareArray.forEach((compareData, compareMarket) => {
      // console.log(compareData);
      temp += `${compareMarket}, Max: ${compareData.tradeMaxPercentage}%, Min: ${compareData.tradeMinPercentage}%|`;
    });
    tempTable.set(market, temp);
  });
  // console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }]);
  console.table(tempTable);

});