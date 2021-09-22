import WebSocket from 'ws';
import { ClientRequest, IncomingMessage } from 'http';
import EventEmitter from 'events';
import axios from 'axios';
import { IFeeder, MarketMode, Tick } from './IFeeder';

export class BinanceFeeder extends EventEmitter implements IFeeder {
  private _apiUrl = 'https://api.binance.com/api/v3';
  private _webSocketUrl = 'wss://stream.binance.com:9443/ws';
  private _ws: WebSocket;

  public mode: MarketMode = MarketMode.spot;
  public marketSymbols: string[] = [];

  constructor(mode: string = 'spot') {
    super();

    if (mode === 'future') {
      this._apiUrl = 'https://fapi.binance.com/fapi/v1';
      this._webSocketUrl = 'wss://fstream.binance.com/ws';
      this.mode = MarketMode.future;
    }
  }

  async initMarketInfo() {
    let responseSpot = await axios.get(`${this._apiUrl}/exchangeInfo`);
    for (let i = 0; i < responseSpot.data.symbols.length; i++) {
      this.marketSymbols.push(responseSpot.data.symbols[i].symbol);
    }
    console.log(`[${this.constructor.name}] (${this.mode}) Symbols Available: ${this.marketSymbols.length}`);
  }

  startWebSocket() {
    this._ws = new WebSocket(this._webSocketUrl);

    this._ws.on('open', (webSocket: WebSocket) => {
      console.log(`[${this.constructor.name}] (${this.mode}) WebSocket Connected to: ${this._webSocketUrl}`);
      this.emit('ready');
    });

    this._ws.on('message', (data: WebSocket.Data) => {
      let json = JSON.parse(data.toString());

      if (json.s !== undefined) {
        let tick: Tick = {
          broker: this.constructor.name,
          mode: this.mode,
          symbol: json.s,
          bid: json.b,
          bidSize: json.B,
          ask: json.a,
          askSize: json.A
        }
        this.emit('tick', tick)
      };
    });

    this._ws.on('close', (code: number, reason: string) => {
      console.log(`[${this.constructor.name}] (${this.mode}) WebSocket closed: ${code} ${reason}`);
      // switch (code) {
      //   case 1001: //byte array(b'CloudFlare WebSocket proxy restarting')
      //     this._ws.terminate();
      //     setTimeout(() => {
      //       this.setUp();
      //     }, 1000);
      //     break;
      //   case 1006:
      //     this._ws.terminate();
      //     setTimeout(() => {
      //       this.setUp();
      //     }, 1000);
      //     break;

      //   default:
      //     break;
      // }
      this.emit('closed');
    })

    this._ws.on('error', (error: Error) => {
      console.error(`[${this.constructor.name}] (${this.mode}) WebSocket error: ${error}`);
    })

    this._ws.on('upgrade', (request: IncomingMessage) => {
      console.log(`[${this.constructor.name}] (${this.mode}) WebSocket upgrade: ${request.statusMessage}`);
    })

    this._ws.on('ping', (data: Buffer) => {
      console.log(`[${this.constructor.name}] (${this.mode}) WebSocket ping: ${data}`);
      this._ws.pong();
    })

    this._ws.on('pong', (data: Buffer) => {
      console.log(`[${this.constructor.name}] (${this.mode}) WebSocket pong: ${data}`);
    })

    this._ws.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      console.error(`[${this.constructor.name}] (${this.mode}) WebSocket unexpected-response: ${request.protocol} | ${response.statusMessage}`);
    })
  }

  stopWebSocket() {
    this._ws.terminate();
  }

  subscribeSymbol(symbol: string) {
    symbol = symbol.toLowerCase();

    this._ws.send(JSON.stringify({
      "method": "SUBSCRIBE",
      "params":
        [
          `${symbol}@bookTicker`
          // `!bookTicker`
        ],
      "id": Date.now()
    }));

    console.log(`[${this.constructor.name}] (${this.mode}) Subscribed to: ${symbol}`);
  }

}