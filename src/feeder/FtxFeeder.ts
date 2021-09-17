import WebSocket from 'ws';
import { ClientRequest, IncomingMessage } from 'http';
import EventEmitter from 'events';


export enum ChannelType {
  orderbook = 'orderbook',
  orderbookGrouped = 'orderbookGrouped',
  trades = 'trades',
  ticker = 'ticker',
  markets = 'markets',
  ftxpay = 'ftxpay',
  fills = 'fills',
  orders = 'orders',
}

export enum RequestOp {
  subscribe = 'subscribe',
  unsubscribe = 'unsubscribe',
}

export enum ResponseType {
  error = 'error',
  subscribed = 'subscribed',
  unsubscribed = 'unsubscribed',
  info = 'info',
  partial = 'partial',
  update = 'update',
}

export enum MarketType {
  spot = 'spot',
  future = 'future',
}

export enum TradeSide {
  buy = 'buy',
  sell = 'sell',
}

export enum OrderBookAction {
  partial = 'partial',
  update = 'update',
}

export interface RequestToServer {
  channel: ChannelType;
  market?: string;
  op: RequestOp;
  grouping?: number;
}

export interface ResponseFromServer {
  channel: string;
  market: string;
  type: ResponseType;
  code?: any;
  msg?: any;
  data?: any;
}

export interface Ticker {
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  last: number | null;
  time: number | null;
}

export interface Tick {
  symbol: string;
  market: string;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  time: number;
}

export interface Market {
  name: string;
  enabled: boolean;
  postOnly: boolean;
  priceIncrement: number;
  sizeIncrement: number;
  type: MarketType;
  baseCurrency: string | null;
  quoteCurrency: string | null;
  restricted: boolean;
  underlying: string | null;
  future: any | null;
  highLeverageFeeExempt: boolean;
}

export interface MarketFuture {
  name: string;
  underlying: string;
  description: string;
  type: string;
  expiry: string;
  perpetual: boolean;
  expired: boolean;
  enabled: boolean;
  postOnly: boolean;
  imfFactor: number;
  underlyingDescription: string;
  expiryDescription: string;
  moveStart: any;
  positionLimitWeight: number;
  group: string;
}

export interface Trade {
  id: number;
  price: number;
  size: number;
  side: TradeSide;
  liquidation: boolean;
  time: string
}

export interface OrderBook {
  time: number;
  checksum: number;
  bids: [number, number][];
  asks: [number, number][];
  action: OrderBookAction;
}

export class FtxFeeder extends EventEmitter {
  private readonly WEBSOCKET_URL = 'wss://ftx.com/ws/';
  private _ws: WebSocket;
  public marketSymbols = new Map<string, Market[]>();

  constructor() {
    super();
    this.setUp();
  }

  setUp() {
    this._ws = new WebSocket(this.WEBSOCKET_URL);

    this._ws.on('open', (webSocket: WebSocket) => {
      this.onConnected();
    });

    this._ws.on('message', (data: WebSocket.Data) => {
      let response: ResponseFromServer = JSON.parse(data.toString());
      switch (response.channel) {
        case ChannelType.markets:
          if (response.type === ResponseType.partial) {
            this.parseMarkets(response);
          }
          break;
        case ChannelType.ticker:
          if (response.type === ResponseType.update) {
            let tick: Tick = {
              symbol: response.market.split('-')[0].split('/')[0],
              market: response.market,
              bid: response.data.bid,
              ask: response.data.ask,
              bidSize: response.data.bidSize,
              askSize: response.data.askSize,
              time: response.data.time,
            }
            this.emit('tick', tick);
          }

          break;

        default:
          console.log(response);
          break;
      }
    });

    this._ws.on('close', (code: number, reason: string) => {
      console.error(`WebSocket closed: ${code} ${reason}`);
      switch (code) {
        case 1001: //byte array(b'CloudFlare WebSocket proxy restarting')
          this._ws.terminate();
          setTimeout(() => {
            this.setUp();
          }, 1000);
          break;
        case 1006:
          this._ws.terminate();
          setTimeout(() => {
            this.setUp();
          }, 1000);
          break;

        default:
          break;
      }

    })

    this._ws.on('error', (error: Error) => {
      console.error(`WebSocket error: ${error}`);
    })

    this._ws.on('upgrade', (request: IncomingMessage) => {
      console.log(`WebSocket upgrade: ${request.statusMessage}`);
    })

    this._ws.on('ping', (data: Buffer) => {
      console.log(`WebSocket ping: ${data}`);
    })

    this._ws.on('pong', (data: Buffer) => {
      // console.log(`WebSocket pong: ${data}`);
    })

    this._ws.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      console.error(`WebSocket unexpected-response: ${request.protocol} | ${response.statusMessage}`);
    })
  }

  onConnected() {
    console.log(`WebSocket Connected to: ${this.WEBSOCKET_URL}`);
    setInterval(() => {
      this._ws.ping();
    }, 15 * 1000);
    console.log(`Ping Interval Started`);
    this.subscribeToMarkets();
  }

  subscribeToMarkets() {
    let request: RequestToServer = {
      channel: ChannelType.markets,
      op: RequestOp.subscribe,
    };
    this._ws.send(JSON.stringify(request));
  }

  parseMarkets(response: ResponseFromServer) {
    let marketFuture = new Map<string, Market>();
    let marketSpot = new Map<string, Market>();
    for (const symbol in response.data.data) {
      const market: Market = response.data.data[symbol];
      if (market.enabled) {
        if (market.type === MarketType.future) {
          let future: MarketFuture = market.future;
          if (future.enabled && !future.expired) {
            marketFuture.set(symbol, market);
          }
        }
        if (market.type === MarketType.spot) {
          let [baseCurrency, quoteCurrency] = symbol.split('/');
          if (quoteCurrency === 'USD') {
            marketSpot.set(symbol, market);
          }
        }
      }
    }

    marketFuture.forEach((market, symbol) => {
      let [baseCurrency, futureType] = symbol.split('-');
      if (!marketSpot.has(`${baseCurrency}/USD`)) {
        return;
      }
      if (futureType === 'MOVE') {
        return;
      }
      if (this.marketSymbols.has(baseCurrency)) {
        let temp = this.marketSymbols.get(baseCurrency)!;
        temp.push(market);
        this.marketSymbols.set(baseCurrency, temp);
      } else {
        this.marketSymbols.set(baseCurrency, [market]);
      }
    });

    console.log(`${this.marketSymbols.size} symbols available with spot and future pair`);
    this.emit('ready');
  }

  subscribeSymbol(symbol: string) {
    let request: RequestToServer = {
      channel: ChannelType.ticker,
      market: symbol,
      op: RequestOp.subscribe,
      // grouping: 100
    };
    this._ws.send(JSON.stringify(request));
  }

}