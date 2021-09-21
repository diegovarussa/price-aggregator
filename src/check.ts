// import tick from './logs/tick.json';
import tick from './logs/2021-09-20.json';
import { CompareTick } from "./index";
import { Tick } from './feeder/FtxFeeder';
let diffResult = new Map<string, number>();
interface TickJson {
    dataType: "Map",
    value: [string, BaseTickJson][]
}
interface BaseTickJson extends Tick {
    compareArray: {
        dataType: "Map",
        value: [string, CompareTick][]
    };
}
let tickJson: TickJson = <TickJson>tick;

tickJson.value.forEach((base): void => {
    let baseTick = base[1];
    baseTick.compareArray.value.forEach((compare) => {
        let compareTick = compare[1];
        if (compareTick.tradeDiffPercentage > 0) {
            diffResult.set(`${base[0]} with ${compare[0]}`, compareTick.tradeDiffPercentage);
        }
    });
});

const sorted = new Map([...diffResult.entries()].sort((a, b) => b[1] - a[1]));
console.log(sorted);
console.log(`Size without repeat: ${sorted.size / 2}`);