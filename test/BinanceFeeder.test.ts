import { BinanceFeeder } from "../src/feeder/BinanceFeeder";

jest.setTimeout(1000 * 60 * 5);

describe("BinanceFeeder Class Tests", () => {
    let binanceFeederSpot: BinanceFeeder;
    let binanceFeederFuture: BinanceFeeder;

    beforeAll(async () => {
        binanceFeederSpot = new BinanceFeeder();
        binanceFeederFuture = new BinanceFeeder('future');
        await binanceFeederFuture.initMarketInfo();
    });

    it("Connect to the WebSocket Server", (done) => {
        binanceFeederSpot.on('ready', () => {
            binanceFeederSpot.subscribeSymbol("ethusdt");
        });
        binanceFeederSpot.on('closed', () => {
            done();
        });
        binanceFeederSpot.startWebSocket();

        binanceFeederFuture.on('ready', () => {
            // binanceFeederFuture.subscribeSymbol(binanceFeederFuture.marketSymbols[33]);
            binanceFeederFuture.subscribeSymbol("ETHUSDT_210924");
        });
        binanceFeederFuture.on('closed', () => {
            done();
        });

        console.log(binanceFeederFuture.marketSymbols);
        binanceFeederFuture.startWebSocket();

        expect(true).toBe(true);
    });

    afterAll(() => {
        // setTimeout(() => {
        //     binanceFeeder.stop();
        // }, 2000);
    });
});