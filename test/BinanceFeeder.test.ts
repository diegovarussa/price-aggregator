import { BinanceFeeder } from "../src/feeder/BinanceFeeder";
import { IFeeder, MarketMode, Tick } from "../src/feeder/IFeeder";

describe("BinanceFeeder Class Tests", () => {
    let binanceFeederSpot: IFeeder;
    let binanceFeederFuture: IFeeder;

    beforeAll(() => {
        binanceFeederSpot = new BinanceFeeder();
        binanceFeederFuture = new BinanceFeeder('future');
    });

    test("Object Creation", () => {
        expect(binanceFeederSpot.mode).toBe(MarketMode.spot);
        expect(binanceFeederFuture.mode).toBe(MarketMode.future);
    });

    test("Init Market Info is Correct", async () => {
        await binanceFeederFuture.initMarketInfo();

        expect(Array.isArray(binanceFeederFuture.marketSymbols)).toBe(true);
        expect(binanceFeederFuture.marketSymbols).toContain('BTCUSDT');
        expect(binanceFeederFuture.marketSymbols.length).toBeGreaterThan(1);
    });

    test("Get Correct Tick Spot", (done: jest.DoneCallback) => {
        binanceFeederSpot.on('ready', () => {
            binanceFeederSpot.subscribeSymbol("BTCUSDT");
        });

        binanceFeederSpot.on('tick', (tick: Tick) => {
            expect(tick.broker).toBeDefined();
            expect(tick.mode).toBeDefined();
            expect(tick.symbol).toBeDefined();
            expect(tick.bid).toBeDefined();
            expect(tick.bidSize).toBeDefined();
            expect(tick.ask).toBeDefined();
            expect(tick.askSize).toBeDefined();

            binanceFeederSpot.stopWebSocket();
        });

        binanceFeederSpot.on('closed', () => {
            done();
        });

        binanceFeederSpot.startWebSocket();
    });

    test("Get Correct Tick Future", (done: jest.DoneCallback) => {
        binanceFeederFuture.on('ready', () => {
            binanceFeederFuture.subscribeSymbol("ETHUSDT_210924");
        });

        binanceFeederFuture.on('tick', (tick: Tick) => {
            expect(tick.broker).toBeDefined();
            expect(tick.mode).toBeDefined();
            expect(tick.symbol).toBeDefined();
            expect(tick.bid).toBeDefined();
            expect(tick.bidSize).toBeDefined();
            expect(tick.ask).toBeDefined();
            expect(tick.askSize).toBeDefined();

            binanceFeederFuture.stopWebSocket();
        });

        binanceFeederFuture.on('closed', () => {
            done();
        });

        binanceFeederFuture.startWebSocket();
    });
});