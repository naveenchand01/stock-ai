import YahooFinanceClass from 'yahoo-finance2';

async function main() {
    const yf = new YahooFinanceClass({
        fetch: async (url: any, init?: any) => {
            const headers = { ...init?.headers, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
            return fetch(url, { ...init, headers });
        }
    });

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 4); // Fetch 4 days

        const res = await yf.chart('AAPL', {
            period1: startDate,
            period2: endDate,
            interval: '5m'
        });

        let quotes = res.quotes || [];
        console.log('Total points:', quotes.length);

        if (quotes.length > 0) {
            // Find the latest day string
            const latestDayStr = new Date(quotes[quotes.length - 1].date).toDateString();
            console.log("Latest Day:", latestDayStr);

            // Filter
            quotes = quotes.filter(q => new Date(q.date).toDateString() === latestDayStr);
            console.log('Filtered 1-Day points:', quotes.length);
            console.log('first:', quotes[0].date);
            console.log('last:', quotes[quotes.length - 1].date);
        }
    } catch (err: any) {
        console.error("ERROR NAME:", err.name);
        console.error("ERROR MESSAGE:", err.message);
    }
}

main().catch(console.error);
