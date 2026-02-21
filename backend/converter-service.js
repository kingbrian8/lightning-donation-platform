import axios from 'axios';

class ConverterService {
    constructor() {
        this.priceApiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,zar';
        this.cache = null;
        this.lastFetch = 0;
        this.cacheDuration = 60 * 1000; // 1 minute
    }

    async getRates() {
        const now = Date.now();
        if (this.cache && (now - this.lastFetch < this.cacheDuration)) {
            return this.cache;
        }

        try {
            const response = await axios.get(this.priceApiUrl);
            this.cache = response.data.bitcoin;
            this.lastFetch = now;
            return this.cache;
        } catch (error) {
            console.error('Coingecko API Error:', error.message);
            // Fallback rates if API is down
            return this.cache || { usd: 50000, zar: 950000 };
        }
    }

    async convertSatsToFiat(sats, currency = 'usd') {
        const rates = await this.getRates();
        const btc = sats / 100000000;
        const rate = rates[currency.toLowerCase()];
        return (btc * rate).toFixed(2);
    }

    async convertFiatToSats(amount, currency = 'usd') {
        const rates = await this.getRates();
        const rate = rates[currency.toLowerCase()];
        const btc = amount / rate;
        return Math.round(btc * 100000000);
    }
}

export default ConverterService;
