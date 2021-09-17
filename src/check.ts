// import tick from './logs/tick.json';
import tick from './logs/2021-09-17.json';
import { BaseTick, CompareTick } from "./index";
let diffResult = new Map<string, number>();

tick.value.forEach((base, baseIndex) => {
    // console.log('------------------------------');
    // console.log(base[0]);
    let baseTick = base[1] as unknown as BaseTick;
    let compareTicks = baseTick.compareArray.value as unknown as CompareTick[];
    compareTicks.forEach((compare, compareIndex) => {
        // console.log('======');
        // console.log(compare[0]);
        let compareTick = compare[1] as unknown as CompareTick;
        // console.log(compareTick.tradeDiffPercentage);
        if (compareTick.tradeDiffPercentage > 0) {
            diffResult.set(`${base[0]} with ${compare[0]}`, compareTick.tradeDiffPercentage);
        }
    });
    //   console.log(base);
    //   base.compareArray.forEach(compare => {
    //     console.log(compare);
    //     compare.diffArray.forEach(diff => {
    //       console.log(diff);
    //     });
    //   });
});
// let sorted = new Map([...diffResult.entries()].sort());
const sorted = new Map([...diffResult.entries()].sort((a, b) => b[1] - a[1]));
console.log(sorted);
console.log(sorted.size);
// console.log(diffResult);