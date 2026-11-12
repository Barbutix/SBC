const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({setTimeout, clearTimeout});
vm.runInContext(fs.readFileSync('site/product-carousel.js','utf8'),context);
vm.runInContext(fs.readFileSync('site/products.js','utf8'),context);
const {createController, delay} = context.SBCProductCarousel;
const shops = vm.runInContext('equipmentShops',context);
assert.equal(delay,5000);
assert.equal(shops.length,3);
for (const shop of shops) {
  assert.equal(shop.products.length,10);
  assert.equal(new Set(shop.products.map(p=>p.url)).size,10);
  for (const p of shop.products) {
    assert.equal(new URL(p.url).hostname,new URL(shop.url).hostname);
    assert.equal(new URL(p.image).protocol,'https:');
    assert.ok(p.name && p.kind);
  }
}
function clock() {
  let time = 0, sequence = 0;
  const tasks = new Map();
  return {
    set(callback,ms) {const id=++sequence;tasks.set(id,{at:time+ms,callback});return id;},
    clear(id) {tasks.delete(id);},
    tick(ms) {
      const end=time+ms;
      while(true) {
        const next=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];
        if(!next || next[1].at>end)break;
        tasks.delete(next[0]);time=next[1].at;next[1].callback();
      }
      time=end;
    },
    size:()=>tasks.size
  };
}
const timer=clock();
const carousel=createController({count:10,onChange(){},setTimer:timer.set,clearTimer:timer.clear});
timer.tick(4999);assert.equal(carousel.state().index,0);
timer.tick(1);assert.equal(carousel.state().index,1);
timer.tick(45000);assert.equal(carousel.state().index,0);
carousel.previous();assert.equal(carousel.state().index,9);
timer.tick(4999);assert.equal(carousel.state().index,9);
timer.tick(1);assert.equal(carousel.state().index,0);
carousel.hold('hover',true);timer.tick(20000);assert.equal(carousel.state().index,0);
carousel.hold('focus',true);carousel.hold('hover',false);timer.tick(10000);assert.equal(carousel.state().index,0);
carousel.hold('focus',false);timer.tick(4999);assert.equal(carousel.state().index,0);
timer.tick(1);assert.equal(carousel.state().index,1);
carousel.toggle();timer.tick(20000);assert.equal(carousel.state().index,1);
carousel.hold('viewport',true);carousel.hold('viewport',false);
assert.equal(carousel.state().userPaused,true);
assert.equal(timer.size(),0);
carousel.toggle();timer.tick(5000);assert.equal(carousel.state().index,2);
carousel.destroy();assert.equal(timer.size(),0);
carousel.next();timer.tick(10000);assert.equal(carousel.state().index,2);
const reduced=createController({count:10,onChange(){},paused:true,setTimer:timer.set,clearTimer:timer.clear});
assert.equal(timer.size(),0);reduced.toggle();timer.tick(5000);assert.equal(reduced.state().index,1);reduced.destroy();
console.log('Carrousels : 30 articles, délai de 5 s, boucle, navigation, pauses et arrêt vérifiés.');
