import { FtxFeeder, Tick, TradeSide } from "./feeder/FtxFeeder";
var fs = require('fs');

export interface CompareTick extends Tick {
  tradeSide: TradeSide;
  tradeSpread: number;
  tradeMaxSpread: number;
  tradeMinSpread: number;
  tradeDiffSpread: number;
  tradeSize: number;
  tradePercentage: number;
  tradeMaxPercentage: number;
  tradeMinPercentage: number;
  tradeDiffPercentage: number;
}
export interface BaseTick extends Tick {
  compareArray: Map<string, CompareTick>;
}

let ftxFeeder = new FtxFeeder();
let lastTick = new Map<string, BaseTick>();

function replacer(key: any, value: any[]) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

ftxFeeder.on('ready', () => {
  ftxFeeder.marketSymbols.forEach((marketGroup, symbol) => {
    ftxFeeder.subscribeSymbol(`${symbol}/USD`);
    marketGroup.forEach((marketIndividual) => {
      ftxFeeder.subscribeSymbol(marketIndividual.name);
    });
  });

  setInterval(() => { // save json every 1 minute and group gy day
    let currentDay = (new Date()).toISOString().split('T')[0];
    fs.writeFileSync(`./src/logs/${currentDay}.json`, JSON.stringify(lastTick, replacer, 2));
  }, 60 * 1000);
});

ftxFeeder.on('tick', (tick: Tick) => {

  let baseTick: BaseTick = {
    ...tick,
    compareArray: new Map<string, CompareTick>()
  };

  lastTick.forEach((current: BaseTick, market: string) => {
    if (tick.symbol === current.symbol && tick.market !== current.market) {

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
        tradeDiffSpread: 0,
        tradeSize: 0,
        tradePercentage: 0,
        tradeMaxPercentage: 0,
        tradeMinPercentage: Infinity,
        tradeDiffPercentage: 0,
      };

      if (current.compareArray.has(tick.market)) {
        let currentMarket: CompareTick = current.compareArray.get(tick.market)!;
        compareTick.tradeMaxSpread = currentMarket.tradeMaxSpread;
        compareTick.tradeMinSpread = currentMarket.tradeMinSpread;
        compareTick.tradeDiffSpread = currentMarket.tradeDiffSpread;
        compareTick.tradeMaxPercentage = currentMarket.tradeMaxPercentage;
        compareTick.tradeMinPercentage = currentMarket.tradeMinPercentage;
        compareTick.tradeDiffPercentage = currentMarket.tradeDiffPercentage;
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
      compareTick.tradeDiffSpread = parseFloat((compareTick.tradeMaxSpread - compareTick.tradeMinSpread).toFixed(2));
      compareTick.tradeDiffPercentage = parseFloat((compareTick.tradeMaxPercentage - compareTick.tradeMinPercentage).toFixed(2));

      baseTick.compareArray.set(current.market, compareTick);
    }
  });

  lastTick.set(tick.market, baseTick);

  // let tempTable = new Map<string, string>();
  // lastTick.forEach((current: BaseTick, market: string) => {
  //   let temp = '';
  //   current.compareArray.forEach((compareData, compareMarket) => {
  //     temp += `${compareMarket}, Max: ${compareData.tradeMaxPercentage}%, Min: ${compareData.tradeMinPercentage}%, Diff: ${compareData.tradeDiffPercentage}%|`;
  //   });
  //   tempTable.set(market, temp);
  // });

});