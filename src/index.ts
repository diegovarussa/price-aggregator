import { FtxFeeder, Tick, TradeSide } from "./feeder/FtxFeeder";

interface CompareTick extends Tick {
  average: number;
  tradeSide: TradeSide;
  tradeSpread: number;
  tradeSize: number;
  tradePercentage: number;
}
interface BaseTick extends Tick {
  average: number;
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
  let tickAveragePrice = (tick.ask + tick.bid) / 2;
  // console.log(`Average: ${tickAveragePrice}`);

  let baseTick: BaseTick = {
    ...tick,
    average: tickAveragePrice,
    compareArray: new Map<string, CompareTick>()
  };

  lastTick.forEach((data, market) => {
    if (tick.symbol === data.symbol && tick.market !== data.market) {
      // console.log(data);
      let averagePrice = (data.ask + data.bid) / 2;
      // console.log(`Average: ${averagePrice}`);

      let compareTick: CompareTick = {
        ...data,
        average: averagePrice,
        tradeSide: TradeSide.buy,
        tradeSpread: 0,
        tradeSize: 0,
        tradePercentage: 0
      };

      if (tickAveragePrice > averagePrice) { // Need to short
        let sellSpread = Math.abs(tick.bid - data.ask);
        let sellSize = Math.min(tick.bidSize, data.askSize);
        let sellPercentage = parseFloat(((sellSpread / data.ask) * 100).toFixed(2));
        compareTick.tradeSpread = sellSpread;
        compareTick.tradeSize = sellSize;
        compareTick.tradePercentage = sellPercentage;
        // console.log(`Sell Spread: ${sellSpread}, Size ${sellSize} (${sellPercentage}%)`);
      }
      if (tickAveragePrice < averagePrice) { // Need to long
        let buySpread = Math.abs(tick.ask - data.bid);
        let buySize = Math.min(tick.askSize, data.bidSize);
        let buyPercentage = parseFloat(((buySpread / data.bid) * 100).toFixed(2));
        // console.log(`Buy Spread: ${buySpread}, Size ${buySize} (${buyPercentage}%)`);
      }

      baseTick.compareArray.set(data.market, compareTick);

    }
  });
  lastTick.set(tick.market, baseTick);
  // console.log(lastTick);
  lastTick.forEach((data, market) => {
    console.log(data);
  });

});