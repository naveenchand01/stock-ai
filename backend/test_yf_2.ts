
import yahooFinance from 'yahoo-finance2';

const instance = new yahooFinance();
console.log('Instance keys:', Object.keys(instance));
console.log('Instance functions:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
console.log('Has setGlobalConfig on instance?', typeof instance.setGlobalConfig === 'function');
console.log('Has suppressNotices on instance?', typeof instance.suppressNotices === 'function');
console.log('Has _setGlobalConfig on instance?', typeof instance._setGlobalConfig === 'function');
