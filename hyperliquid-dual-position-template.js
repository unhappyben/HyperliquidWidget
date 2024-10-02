// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;

// Configuration
const CONFIG = {
  WALLET_ADDRESS: '', // Add your wallet address here
  API_ENDPOINT: 'https://api.hyperliquid.xyz/info',
  WIDGET_MODE: 'specific', // 'specific' for specific coins, 'latest' for latest trades
  COIN_FILTERS: {
    LEFT: '', // Add your desired left coin filter here
    RIGHT: '' // Add your desired right coin filter here
  },
  BACKGROUNDS: {
    POSITIVE: 'https://i.ibb.co/6H7LYFy/cash.png',
    NEGATIVE: 'https://i.ibb.co/ggbtZbT/IMG-2685.png'
  },
  COLORS: {
    POSITIVE: new Color("#00FF00"),
    NEGATIVE: new Color("#FF4500"),
    BACKGROUND: new Color("#000000"),
    TEXT: Color.white(),
    SEPARATOR: new Color("#333333")
  },
  FONTS: {
    TITLE: Font.boldSystemFont(16),
    POSITION: Font.boldSystemFont(14),
    DETAILS: Font.systemFont(12)
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
function getPositionDirection(currentPrice, liquidationPrice) {
  return currentPrice > liquidationPrice ? "Long" : "Short"
}

// Create centered text with shadow
function createCenteredText(stack, text, color, font) {
  let textStack = stack.addStack()
  textStack.layoutHorizontally()
  textStack.addSpacer()
  let textElement = textStack.addText(text)
  textElement.textColor = color
  textElement.font = font
  textElement.shadowColor = new Color("000000", 0.5)
  textElement.shadowOffset = new Point(1, 1)
  textElement.shadowRadius = 2
  textStack.addSpacer()
}

// Load image from URL
async function loadImage(url) {
  try {
    const request = new Request(url)
    return await request.loadImage()
  } catch (error) {
    console.error(`Error loading image from URL: ${url}`, error)
    return null
  }
}

// Create position stack with details
async function createPositionStack(stack, position) {
  const { coin, positionValue, szi, liquidationPx, unrealizedPnl, returnOnEquity, entryPx } = position.position
  const currentPrice = parseFloat(positionValue) / parseFloat(szi)
  const direction = getPositionDirection(currentPrice, parseFloat(liquidationPx))

  stack.layoutVertically()
  stack.spacing = 2

  // Set background image based on PnL
  const backgroundImageUrl = parseFloat(unrealizedPnl) >= 0 
    ? CONFIG.BACKGROUNDS.POSITIVE 
    : CONFIG.BACKGROUNDS.NEGATIVE
  const backgroundImage = await loadImage(backgroundImageUrl)

  if (backgroundImage) {
    stack.backgroundImage = backgroundImage
  } else {
    console.warn("Background image failed to load, using default background.")
    stack.backgroundColor = CONFIG.COLORS.BACKGROUND
  }

  // Add overlay for better text visibility
  const overlay = stack.addStack()
  overlay.layoutVertically()
  overlay.size = new Size(stack.size.width, stack.size.height)
  overlay.backgroundColor = new Color("000000", 0.5)

  // Add position details
  createCenteredText(overlay, `${coin} ${direction}`, direction === "Long" ? CONFIG.COLORS.POSITIVE : CONFIG.COLORS.NEGATIVE, CONFIG.FONTS.POSITION)
  createCenteredText(overlay, `PNL: $${parseFloat(unrealizedPnl).toFixed(2)}`, parseFloat(unrealizedPnl) >= 0 ? CONFIG.COLORS.POSITIVE : CONFIG.COLORS.NEGATIVE, CONFIG.FONTS.DETAILS)
  createCenteredText(overlay, `ROE: ${(parseFloat(returnOnEquity) * 100).toFixed(2)}%`, parseFloat(returnOnEquity) >= 0 ? CONFIG.COLORS.POSITIVE : CONFIG.COLORS.NEGATIVE, CONFIG.FONTS.DETAILS)
  createCenteredText(overlay, `Entry: $${parseFloat(entryPx).toFixed(4)}`, CONFIG.COLORS.TEXT, CONFIG.FONTS.DETAILS)
  createCenteredText(overlay, `Current: $${currentPrice.toFixed(4)}`, CONFIG.COLORS.TEXT, CONFIG.FONTS.DETAILS)
  createCenteredText(overlay, `Liq: $${parseFloat(liquidationPx).toFixed(4)}`, CONFIG.COLORS.TEXT, CONFIG.FONTS.DETAILS)
}

// Create widget with position information
async function createWidget(positions) {
  let widget = new ListWidget()
  widget.backgroundColor = CONFIG.COLORS.BACKGROUND

  addWidgetTitle(widget)
  widget.addSpacer(12)
  
  if (positions.length === 0) {
    addNoPositionsText(widget)
    return widget
  }
  
  const table = createTableLayout(widget)
  await populateTableWithPositions(table, positions)

  return widget
}

// Add widget title
function addWidgetTitle(widget) {
  let titleStack = widget.addStack()
  titleStack.addSpacer()
  let title = titleStack.addText("Hyperliquid Positions")
  title.textColor = CONFIG.COLORS.TEXT
  title.font = CONFIG.FONTS.TITLE
  titleStack.addSpacer()
}

// Add text for when no positions are available
function addNoPositionsText(widget) {
  let noPositionsStack = widget.addStack()
  noPositionsStack.addSpacer()
  let noPositionsText = noPositionsStack.addText("No open positions")
  noPositionsText.textColor = CONFIG.COLORS.TEXT
  noPositionsStack.addSpacer()
}

// Create table layout for positions
function createTableLayout(widget) {
  const table = widget.addStack()
  table.layoutHorizontally()
  return table
}

// Populate table with position information
async function populateTableWithPositions(table, positions) {
  let leftPosition, rightPosition

  if (CONFIG.WIDGET_MODE === 'specific') {
    leftPosition = positions.find(p => p.position.coin === CONFIG.COIN_FILTERS.LEFT)
    rightPosition = positions.find(p => p.position.coin === CONFIG.COIN_FILTERS.RIGHT)
  } else if (CONFIG.WIDGET_MODE === 'latest') {
    [leftPosition, rightPosition] = positions
      .sort((a, b) => b.position.timestamp - a.position.timestamp)
      .slice(0, 2)
  }

  await addPositionColumn(table, leftPosition, 'LEFT')
  addSeparator(table)
  await addPositionColumn(table, rightPosition, 'RIGHT')
}

// Add a position column to the table
async function addPositionColumn(table, position, side) {
  const column = table.addStack()
  column.layoutVertically()
  column.centerAlignContent()
  column.size = new Size(0, 0)
  column.flexGrow = 1