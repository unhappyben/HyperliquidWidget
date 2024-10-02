// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: chart-line;

// Configuration
const CONFIG = {
  WALLET_ADDRESS:  '', //Add your wallet address here
  API_ENDPOINT: 'https://api.hyperliquid.xyz/info',
  COIN_FILTER: '', // Add your desired coin filter here (leave empty for all coins)
  BACKGROUNDS: {
    POSITIVE: 'https://i.ibb.co/6H7LYFy/cash.png',
    NEGATIVE: 'https://i.ibb.co/ggbtZbT/IMG-2685.png'
  }
}

// Fetch open positions from Hyperliquid API
async function fetchOpenPositions() {
  const request = new Request(CONFIG.API_ENDPOINT)
  request.method = "POST"
  request.headers = { "Content-Type": "application/json" }
  request.body = JSON.stringify({
    type: "clearinghouseState",
    user: CONFIG.WALLET_ADDRESS
  })

  const response = await request.loadJSON()
  return response.assetPositions || []
}

// Determine if a position is long or short
function getPositionDirection(unrealizedPnl, entryPrice, currentPrice) {
  const pnl = parseFloat(unrealizedPnl)
  const entry = parseFloat(entryPrice)
  const current = parseFloat(currentPrice)

  if (pnl > 0 && entry < current) return "Long"
  if (pnl < 0 && entry > current) return "Long"
  if (pnl > 0 && entry > current) return "Short"
  if (pnl < 0 && entry < current) return "Short"
  return "" // Return empty string for neutral or undefined cases
}

// Create widget with position information
async function createWidget(positions) {
  let widget = new ListWidget()
  
  const filteredPositions = CONFIG.COIN_FILTER 
    ? positions.filter(p => p.position.coin === CONFIG.COIN_FILTER)
    : positions

  if (filteredPositions.length === 0) {
    await setDefaultWidgetBackground(widget)
    addNoPositionsText(widget)
  } else {
    await addPositionDetails(widget, filteredPositions[0])
  }
  
  return widget
}

// Set default background for widget when no positions match
async function setDefaultWidgetBackground(widget) {
  const defaultBackground = await loadImage(CONFIG.BACKGROUNDS.POSITIVE)
  widget.backgroundImage = defaultBackground
}

// Add text for when no positions match the filter
function addNoPositionsText(widget) {
  let noPositionsText = widget.addText("No matching positions")
  noPositionsText.textColor = Color.gray()
  noPositionsText.font = Font.systemFont(12)
}

// Add position details to the widget
async function addPositionDetails(widget, position) {
  const p = position.position
  const currentPrice = parseFloat(p.positionValue) / parseFloat(p.szi)
  const direction = getPositionDirection(p.unrealizedPnl, p.entryPx, currentPrice)

  await setWidgetBackground(widget, p.unrealizedPnl)
  addWidgetTitle(widget)
  widget.addSpacer(8)
  
  addPositionInfo(widget, p, direction, currentPrice)
  
  widget.addSpacer(8)
}

// Set widget background based on PnL
async function setWidgetBackground(widget, unrealizedPnl) {
  const backgroundImageUrl = parseFloat(unrealizedPnl) >= 0 
    ? CONFIG.BACKGROUNDS.POSITIVE 
    : CONFIG.BACKGROUNDS.NEGATIVE
  widget.backgroundImage = await loadImage(backgroundImageUrl)
  
  // Add semi-transparent overlay for better text readability
  widget.backgroundGradient = createOverlayGradient()
}

// Create a semi-transparent overlay gradient
function createOverlayGradient() {
  let gradient = new LinearGradient()
  gradient.locations = [0, 1]
  gradient.colors = [
    new Color("#1A1A1A", 0.7),
    new Color("#1A1A1A", 0.7)
  ]
  return gradient
}

// Add widget title
function addWidgetTitle(widget) {
  let title = widget.addText("Hyperliquid Positions")
  title.textColor = Color.white()
  title.font = Font.boldSystemFont(10)
}

// Add position information to the widget
function addPositionInfo(widget, p, direction, currentPrice) {
  addCoinInfo(widget, p.coin, direction)
  addPnLInfo(widget, p.unrealizedPnl, p.returnOnEquity)
  addPriceInfo(widget, p.entryPx, currentPrice, p.liquidationPx)
}

// Add coin and direction information
function addCoinInfo(widget, coin, direction) {
  let coinText = widget.addText(`${coin}${direction ? ' ' + direction : ''}`)
  coinText.textColor = direction === "Long" ? new Color("#90EE90") : 
                       direction === "Short" ? new Color("#FF6961") : 
                       Color.white() // Default color for neutral/undefined
  coinText.font = Font.boldSystemFont(14)
}

// Add PnL and ROE information
function addPnLInfo(widget, unrealizedPnl, returnOnEquity) {
  const pnlValue = parseFloat(unrealizedPnl)
  const roeValue = parseFloat(returnOnEquity)

  let pnlText = widget.addText(`PNL: $${pnlValue.toFixed(2)}`)
  pnlText.textColor = pnlValue >= 0 ? Color.green() : Color.red()
  pnlText.font = Font.systemFont(12)
  
  let roeText = widget.addText(`ROE: ${(roeValue * 100).toFixed(2)}%`)
  roeText.textColor = roeValue >= 0 ? Color.green() : Color.red()
  roeText.font = Font.systemFont(12)
}

// Add price information (entry, current, liquidation)
function addPriceInfo(widget, entryPrice, currentPrice, liquidationPrice) {
  const priceInfo = [
    { label: "Entry", value: entryPrice },
    { label: "Current", value: currentPrice },
    { label: "Liquidation", value: liquidationPrice }
  ]

  priceInfo.forEach(({ label, value }) => {
    let priceText = widget.addText(`${label}: $${parseFloat(value).toFixed(4)}`)
    priceText.textColor = Color.gray()
    priceText.font = Font.systemFont(12)
  })
}

// Load image from URL
async function loadImage(url) {
  const request = new Request(url)
  return await request.loadImage()
}

// Main function to run the widget
async function run() {
  try {
    let positions = await fetchOpenPositions()
    let widget = await createWidget(positions)
    
    if (config.runsInWidget) {
      Script.setWidget(widget)
    } else {
      widget.presentSmall()
    }
  } catch (error) {
    console.error("Error in main function:", error)
    let errorWidget = new ListWidget()
    errorWidget.addText("Error: " + error.message)
    Script.setWidget(errorWidget)
  }
}

await run()
