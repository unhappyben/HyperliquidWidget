# Hyperliquid iOS Widget
Two iOS Scriptable Widgets that show Hyperliquid positions based on:
- A single token ticker
- Latest two trades 
- Two token tickers

# Requirements 
1. Download Scriptable from the iOS App Store 
2. Wallet address with at least 1 open position on Hyperliquid

# Setup Instructions
1. Install Scriptable from the iOS App Store
2. Create a new script in Scriptable
3. Copy the script code
4. Update the following constants with your information:

For Single Position update the configs here:
```
const CONFIG = {
  WALLET_ADDRESS:  '', //Add your wallet address here
  API_ENDPOINT: 'https://api.hyperliquid.xyz/info',
  COIN_FILTER: '', // Add your desired coin filter here (leave empty for all coins)
  BACKGROUNDS: {
    POSITIVE: 'https://i.ibb.co/6H7LYFy/cash.png',
    NEGATIVE: 'https://i.ibb.co/ggbtZbT/IMG-2685.png'
  }
}
```


For Two Positions update the configs here:
```
const CONFIG = {
  WALLET_ADDRESS: '',  // Add your wallet address here
  API_ENDPOINT: 'https://api.hyperliquid.xyz/info',
  WIDGET_MODE: 'latest', // 'specific' for specific coins, 'latest' for latest trades
  COIN_FILTERS: {
    LEFT: '', // Add coin you have position in here shown on left
    RIGHT: '' // Add coin you have position in here shown on right
  }
```
5. Add the widget to your home screen:

      - Long press your home screen
      - Tap the + button
      - Search for "Scriptable"
      - Choose the widget size (small recommended)
      - Select your script


# Output of Widget 
## Single Token Ticker 
### Single Token Positive PnL
![SinglePositive](https://i.ibb.co/Q63DWcn/IMG-2689.jpg)

### Single Token Negative PnL
![SingleNegative](https://i.ibb.co/q5kfnB4/IMG-2688.jpg)

## Two Token Tickers 
![TwoTokenTickers](https://i.ibb.co/VTjFgnV/IMG-2691.jpg)
