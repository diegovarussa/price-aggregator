import WebSocket from 'ws';
import { ClientRequest, IncomingMessage } from 'http';

enum ChannelType {
  orderbook = 'orderbook',
  orderbookGrouped = 'orderbookGrouped',
  trades = 'trades',
  ticker = 'ticker',
  markets = 'markets',
  ftxpay = 'ftxpay',
  fills = 'fills',
  orders = 'orders',
}

enum RequestOp {
  subscribe = 'subscribe',
  unsubscribe = 'unsubscribe',
}

enum ResponseType {
  error = 'error',
  subscribed = 'subscribed',
  unsubscribed = 'unsubscribed',
  info = 'info',
  partial = 'partial',
  update = 'update',
}

enum MarketType {
  spot = 'spot',
  futures = 'futures',
}

enum TradeSide {
  buy = 'buy',
  sell = 'sell',
}

enum OrderBookAction {
  partial = 'partial',
  update = 'update',
}
interface RequestToServer {
  channel: ChannelType;
  market: string;
  op: RequestOp;
  grouping?: number;
}
interface ResponseFromServer {
  channel: string;
  market: string;
  type: ResponseType;
  code?: any;
  msg?: any;
  data?: any;
}

interface Ticker {
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  last: number | null;
  time: number | null;
}

interface Market {
  name: string;
  enabled: boolean;
  priceIncrement: number;
  sizeIncrement: number;
  type: MarketType;
  baseCurrency: string | null;
  quoteCurrency: string | null;
  underlying: string | null;
  restricted: boolean;
  future: any | null;
}

interface Trade {
  id: number;
  price: number;
  size: number;
  side: TradeSide;
  liquidation: boolean;
  time: string
}

interface OrderBook {
  time: number;
  checksum: number;
  bids: [number, number][];
  asks: [number, number][];
  action: OrderBookAction;
}

const ws = new WebSocket('wss://ftx.com/ws/');

ws.on('open', (webSocket: WebSocket) => {
  let request: RequestToServer = {
    channel: ChannelType.ticker,
    market: 'SOL-PERP',
    op: RequestOp.subscribe,
    // grouping: 100
  };
  ws.send(JSON.stringify(request));

  setInterval(() => {
    ws.ping();
  }, 15 * 1000);
});

ws.on('message', (data: WebSocket.Data) => {
  let response: ResponseFromServer = JSON.parse(data.toString());
  console.log(response);
  // console.log(response.data);
});

ws.on('close', (code: number, reason: string) => {
  console.info(`WebSocket closed: ${code} ${reason}`);
})

ws.on('error', (error: Error) => {
  console.error(`WebSocket error: ${error}`);
})

ws.on('upgrade', (request: IncomingMessage) => {
  console.log(`WebSocket upgrade: ${request}`);
})

ws.on('ping', (data: Buffer) => {
  console.log(`WebSocket ping: ${data}`);
})

ws.on('pong', (data: Buffer) => {
  console.log(`WebSocket pong: ${data}`);
})

ws.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
  console.error(`WebSocket unexpected-response: ${request} ${response}`);
})