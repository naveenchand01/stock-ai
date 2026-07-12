
import yahooFinance from 'yahoo-finance2';

console.log('Type of default export:', typeof yahooFinance);
console.log('Is constructor?', typeof yahooFinance === 'function' && !!yahooFinance.prototype && !!yahooFinance.prototype.constructor.name);
console.log('Has setGlobalConfig?', typeof yahooFinance.setGlobalConfig === 'function');
console.log('Keys:', Object.keys(yahooFinance));

try {
    const instance = new yahooFinance();
    console.log('Successfully new-ed default export');
} catch (e) {
    console.log('Could not new default export:', e.message);
}
