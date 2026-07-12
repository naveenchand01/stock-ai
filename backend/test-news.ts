import yahooFinance from 'yahoo-finance2';

async function test() {
    const results = await yahooFinance.search('RELIANCE.NS', { newsCount: 5 });
    console.log(JSON.stringify(results.news, null, 2));
}

test().catch(console.error);
