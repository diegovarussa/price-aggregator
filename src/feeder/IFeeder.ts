import EventEmitter from 'events';

export enum MarketMode {
    spot = 'spot',
    future = 'future',
}

export interface Tick {
    broker: string;
    mode: MarketMode;
    symbol: string;
    bid: number;
    bidSize: number;
    ask: number;
    askSize: number;
}

export interface IFeeder extends EventEmitter {
    mode: MarketMode;
    marketSymbols: string[];

    startWebSocket(): void;
    stopWebSocket(): void;
    initMarketInfo(): Promise<void>;
    subscribeSymbol(symbol: string): void;
}