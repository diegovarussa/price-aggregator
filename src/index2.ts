import { BinanceFeeder } from "./feeder/BinanceFeeder";
import { IFeeder } from "./feeder/IFeeder";

let binanceFeederSpot: IFeeder;
let binanceFeederFuture: IFeeder;
binanceFeederSpot = new BinanceFeeder();
binanceFeederFuture = new BinanceFeeder('future');
binanceFeederSpot.on('tick', (tick) => {
  console.log(tick);
});
binanceFeederSpot.on('ready', () => {
  binanceFeederSpot.subscribeSymbol("ethusdt");
});
binanceFeederSpot.startWebSocket();


binanceFeederFuture.on('tick', (tick) => {
  console.log(tick);
});
binanceFeederFuture.on('ready', () => {
  binanceFeederFuture.subscribeSymbol("ETHUSDT_210924");
});
binanceFeederFuture.startWebSocket();

