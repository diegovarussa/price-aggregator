import { FtxFeeder, ResponseFromServer } from "./feeder/FtxFeeder";

let ftxFeeder = new FtxFeeder();
ftxFeeder.on('tick', (tick: ResponseFromServer) => {
  console.log(tick);
})
// console.log(ftxFeeder.marketSymbols.size);
ftxFeeder.on('ready', () => {
  // console.log(ftxFeeder.marketSymbols.size);
  // ftxFeeder.marketSymbols.forEach((market, symbol) => {
  //   console.log(symbol);
  //   console.log(market);
  // });
  console.log(ftxFeeder.marketSymbols.get('BTC'));
  ftxFeeder.subscribeSymbol('BTC/USD');
  ftxFeeder.marketSymbols.get('BTC')!.forEach(market => {
    console.log(market.name);
    ftxFeeder.subscribeSymbol(market.name);
  });
});