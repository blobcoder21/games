// 			Options

		// Automatic trading when true
		var stockerAutoTrading = true

		// Stock market is running when true
		var stockerMarketOn = true;

		// Minimum number of brokers required for automatic trading
		var stockerMinBrokers = 72				// Default of 72 results in 0.5% commission

		// Fraction of banked cookies allowed for automatic trading
		var stockerCookiesThreshold = 0.05;

		// Buy all necessary brokers as soon as we can afford them
		var stockerAutoBuyMinimumBrokers = true
		
		// Buy additional brokers as soon as we can afford them
		var stockerAutoBuyAdditionalBrokers = true
		
		// Increases number of warehouses in sync with the highest raw CPS during this session
		var stockerExponential = true;

		// The ratio of the highest raw CPS to the original raw CPS is raised to this power when Exponential Warehouses is on
		var stockerExponentialPower = 1.0;

		// Announce transactions in game notifications
		var stockerTransactionNotifications = true;

		// Make regular profit reports
		var stockerActivityReport = false
			// How often to make regular reports in ms (one hour by default)
			var stockerActivityReportFrequency = 1000 * 60 * 60

		// Make game notifications fade away on their own
		var stockerFastNotifications = false

		// Use console.log for more detailed info on prices and trends
		var stockerConsoleAnnouncements = false

		// Display warning message when broker numbers or bank cookies are insufficient to run automatic trading.
		var stockerResourcesWarning = true

		// Display more detailed trading info near the top of the stock market display
		var stockerAdditionalTradingStats = true

		// Logic loop frequency; do not touch it unless you are cheating
		var stockerLoopFrequency = 1000 * 30
		
		// The cheat itself. Rolls the cycle every time logic loop triggers
		var stockerForceLoopUpdates = false

		var stockerGreeting = 'click clack you will soon be in debt'



// ===================================================================================

const CS_TEN_YEARS = 86400 * 365.25 * 10;		// seconds
const CS_GASEOUS_PROFITS = 31536000;			// $31,536,000
const CS_PLASMIC_PROFITS = 100000000;			// $100,000,000
const CS_BOSE_EINSTEIN_PROFITS = 500000000;		// $500,000,000

if (typeof CCSE === 'undefined')
	Game.LoadMod('https://klattmose.github.io/CookieClicker/SteamMods/CCSE/main.js')

if (typeof CookiStocker === 'undefined') var CookiStocker = {};

CookiStocker.name = 'CookiStocker';
CookiStocker.version = '3.0.2';
CookiStocker.GameVersion = '2.053';
CookiStocker.build = 'Tuesday 2025-10-14 09:55:45 PM';

// One place to hold the interval handle + the current period (ms)
CookiStocker.reportTimer = 0;
CookiStocker._reportEveryMs = 0;
CookiStocker._cfgReady = false;		// set true at the end of CookiStocker.load()
CookiStocker._loopTimer	= 0;

CookiStocker.Bank = 0;

if (typeof CookiStocker.stockList === 'undefined') {
	CookiStocker.stockList = (typeof stockList === 'object' && stockList) || {};
}
var stockList = CookiStocker.stockList;

stockList = {
	Check: 'dump eet',
	Goods: [],
	Start: Date.now() + 500,
	lastTime: Date.now() + 500,
	startingProfits: 0,
	Profits: 0,
	netProfits: 0,
	grossProfits: 0,
	grossLosses: 0,
	totalStocks: 0,
	totalShares: 0,
	totalValue: 0,
	unrealizedProfits: 0,
	profitableStocks: 0,
	unprofitableStocks: 0,
	profitableTrades: 0,
	unprofitableTrades: 0,
	Purchases: 0,
	Sales: 0,
	Uptime: 0,
	hourlyProfits: 0,
	dailyProfits: 0,
	minCookies: Number.MAX_VALUE,
	maxCookies: 0,
	noModActions: false,
	origCookiesPsRawHighest: 0,
	Amount: 0,
	canBuy: true,
	shadowGone: false,
}

let stockerModeProfits = [
	[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
];

var modeDecoder = ['stable','slowly rising','slowly falling','rapidly rising','rapidly falling','chaotic'] // meanings of each market trend (good.mode)
var goodIcons = [[2,33],[3,33],[4,33],[15,33],[16,33],[17,33],[5,33],[6,33],[7,33],[8,33],[13,33],[14,33],[19,33],[20,33],[32,33],[33,33],[34,33],[35,33]];

CookiStocker.launch = function() {
	try {
		if (Game && Game.Objects && Game.Objects['Bank'] && Game.Objects['Bank'].minigame) {
			CookiStocker.Bank = Game.Objects['Bank'].minigame;
			// If we re-entered after Ascension, ensure no stale cycle is queued
			if (CookiStocker._tickTimeout)   { clearTimeout(CookiStocker._tickTimeout);   CookiStocker._tickTimeout = 0; }
			if (CookiStocker._reportTimeout) { clearTimeout(CookiStocker._reportTimeout); CookiStocker._reportTimeout = 0; }
			this.isLoaded = 1;
		}
	} catch (e) {}
};

if (!CookiStocker.isLoaded) {
	// If CCSE exists, ask it to call us later; do NOT create a fake CCSE.
	if (typeof CCSE !== 'undefined' && CCSE) {
		if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
		CCSE.postLoadHooks.push(function() {
			try { CookiStocker.launch(); } catch (e) {}
		});
	}
}

function ensureStockerStyles() {
	if (document.getElementById('stocker-styles')) return; // avoid duplicates
	const css = `
		.stocker-stats{
			display:flex;
			flex-wrap:wrap;		/* allow wrapping onto a new line */
			justify-content:center;	/* center each line */
			align-items:baseline;
			gap:0 3px;		/* horizontal spacing between fields */
			white-space:normal;	/* permit wrapping */
		}
		.stocker-stats .stat{
			white-space:nowrap;	/* keep each field intact */
			font-size:10px;
			color:rgba(255,255,255,0.8);
			padding:1px 3px;
		}
		/* Force a manual break after a chosen field on narrow panes */
		.stocker-stats .break{ flex-basis:100%; height:0; }
		@media (min-width: 950px){ .stocker-stats .break{ display:none; } }
	`;
	const style = document.createElement('style');
	style.id = 'stocker-styles';
	style.textContent = css;
	document.head.appendChild(style);
}
ensureStockerStyles();

// Optional stats container id
CookiStocker.extraStatsId = 'stockerExtra';

// Rebuilds the 2nd/3rd/4th lines exactly as before
CookiStocker.buildExtraStatsHTML = function(){
	// These are the same strings you already use (datStr2/datStr3/datStr4)
	// Keeping markup identical; wrapped by our container.
	let html = '';
	html += `
		<div class="stocker-stats">
			<span class="stat">Net cookies won: <span id="netCookies">0</span>.</span>
			<span class="stat">Cookies per hour: <span id="cookiesHour">0</span>.</span>
			<span class="stat">Cookies per day: <span id="cookiesDay">0</span>.</span>
			<span class="stat">Purchases: <span id="Purchases">0</span>.</span>
			<span class="stat">Sales: <span id="Sales">0</span>.</span>
		</div>
	`;
	html += `
		<div class="stocker-stats">
			<span class="stat">CPS multiple: <span id="cpsMultiple">0</span>.</span>
			<span class="stat">Stocks held: <span id="stocksHeld">${stockList.totalStocks}</span>.</span>
			<span class="stat">Total shares: <span id="totalShares">${Beautify(stockList.totalShares, 0)}</span>.</span>
			<span class="stat">Total value: <span id="totalValue">${Beautify(stockList.totalValue, 2)}</span>.</span>
			<span class="stat">Unrealized profits: <span id="unrealizedProfits">${Beautify(stockList.unrealizedProfits, 0)}</span>.</span>
		</div>
	`;
	html += `
		<div class="stocker-stats">
			<span class="stat">Profitable stocks: <span id="profitableStocks">0</span>.</span>
			<span class="stat">Unprofitable stocks: <span id="unprofitableStocks">0</span>.</span>
			<span class="stat">Profitable trades: <span id="profitableTrades">0</span>.</span>
			<span class="stat">Unprofitable trades: <span id="unprofitableTrades">0</span>.</span>
			<span class="break"></span>
			<span class="stat">Average profit per trade: <span id="averageProfit">$0</span>.</span>
			<span class="stat">Average loss per trade: <span id="averageLoss">$0</span>.</span>
		</div>
	`;
	return html;
};

// Shows or hides the optional block immediately when the option changes.
// If enabling and the container doesn't exist yet, we create and populate it.
CookiStocker.updateAdditionalStatsVisibility = function(){
	const header = l('bankHeader');
	const host = header && header.firstChild ? header.firstChild : null;
	if (!host) return;

	let extra = l(CookiStocker.extraStatsId);

	if (stockerAdditionalTradingStats){
		// Ensure container exists and is visible
		if (!extra){
			extra = document.createElement('div');
			extra.id = CookiStocker.extraStatsId;
			extra.innerHTML = CookiStocker.buildExtraStatsHTML();
			host.appendChild(extra);
		}
		extra.style.display = '';
	} else {
		// Hide; we could also removeChild if you prefer to tear it down
		if (extra){
			extra.style.display = 'none';
		}
	}
};


function stockerTimeBeautifier(duration) {
	var milliseconds = Math.floor(duration % 1000),
	  seconds = Math.floor((duration / 1000) % 60),
	  minutes = Math.floor((duration / (1000 * 60)) % 60),
	  hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
	  days = Math.floor(duration / (1000 * 60 * 60 * 24));
	if (seconds && (minutes || hours || days) && !stockerForceLoopUpdates)
		seconds = 0;						// Don't display
	var strSeconds = seconds + ' second' + (seconds != 1 ? 's' : '');
	var strMinutes = minutes ? minutes + ' minute' + (minutes != 1 ? 's' : '') + (seconds ? (hours || days ? ', and ' : ' and ') : '') : '';
	var strHours = hours ? hours + ' hour' + (hours != 1 ? 's' : '') + (minutes && seconds ? ', ' : ((minutes ? !seconds : seconds) ? ' and ' : '')) : '';
	var strDays = days ? days + ' day' + (days != 1 ? 's' : '') + (hours && minutes || hours && seconds || minutes && seconds ? ', ' : (((hours ? !minutes : minutes) ? !seconds : seconds) ? ' and ' : '')) : '';
	var strTime = strDays + strHours + strMinutes;
	if (stockerForceLoopUpdates && seconds)
		strTime += strSeconds; 
	if (minutes || hours || days) {
		return (strTime);
	} else
		return (strSeconds);
}

// --- Anchored scheduling on each market tick ------------------------------
CookiStocker._tickHookInstalled	= 0;
CookiStocker._tickTimeout = 0;
CookiStocker._reportTimeout = 0;

CookiStocker._onMarketTick = function() {
	if (Game.OnAscend) return;
	if (CookiStocker._tickTimeout) { clearTimeout(CookiStocker._tickTimeout); CookiStocker._tickTimeout = 0; }
	if (CookiStocker._reportTimeout) { clearTimeout(CookiStocker._reportTimeout); CookiStocker._reportTimeout = 0; }

	CookiStocker._tickTimeout = setTimeout(function() {
		try {
			if (typeof stockerLoop === 'function') stockerLoop();
			else if (CookiStocker && typeof CookiStocker.stockerLoop === 'function') CookiStocker.stockerLoop();
		} catch (e) {}

		var delay = stockerForceLoopUpdates ? 0 : 30000;	// 0 ms when forcing; else 30 s
		CookiStocker._reportTimeout = setTimeout(function() {
			try { CookiStocker.Reports(); } catch (e) {}
		}, delay);
	}, 500);	// let the minigame finish its own recompute
};

CookiStocker.installBankTickHook = function() {
	if (CookiStocker._tickHookInstalled) return;

	var M = Game && Game.Objects && Game.Objects['Bank'] && Game.Objects['Bank'].minigame;
	if (!M || typeof M.tick !== 'function') return;

	CookiStocker._tickHookInstalled = 1;
	var _origTick = M.tick;
	M.tick = function() {
		var ret = _origTick.apply(this, arguments);
		if (typeof stockerMarketOn === 'undefined' || stockerMarketOn) {
			CookiStocker._onMarketTick();
		}
		return ret;
	};
};

// One place to hold the interval handle + the current period (ms)
CookiStocker.reportTimer = 0;
CookiStocker._reportEveryMs = 0;

// Arm/disarm the periodic reporter so there is exactly one timer when needed
CookiStocker.ensureReportTimer = function() {
	if (Game.OnAscend || CookiStocker.reportTimer) {
		clearInterval(CookiStocker.reportTimer);
		CookiStocker.reportTimer = 0;
	}

	// Do we need a periodic timer at all right now?
	const need = stockerMarketOn && (stockerActivityReport || stockerConsoleAnnouncements);
	const next = need ? Math.max(1000, (+stockerActivityReportFrequency || 3600000)) : 0;

	// If we don't need it, tear down anything that exists and reset bookkeeping
	if (!need) {
		if(CookiStocker.reportTimer) {
			clearInterval(CookiStocker.reportTimer);
			CookiStocker.reportTimer = 0;
		}
		CookiStocker._reportEveryMs = 0;
		return;
	}

	// If we need it and the period hasn't changed and it's already running, do nothing
	if (CookiStocker.reportTimer && CookiStocker._reportEveryMs === next) return;

	// (Re)arm with the new period
	if (CookiStocker.reportTimer) {
		clearInterval(CookiStocker.reportTimer);
		CookiStocker.reportTimer = 0;
	}
	CookiStocker._reportEveryMs = next;
	CookiStocker.reportTimer = setInterval(function(){ CookiStocker.Reports(); }, next);
};

CookiStocker.ensureAchievements = function(){
	if (Game.Achievements['Plasmic assets'] && Game.Achievements['Bose-Einstein Condensed Assets']) 
		return;	// already created
	CookiStocker.AchPlasmic = CCSE.NewAchievement(
		'Plasmic assets',
		'Have your stock market profits surpass <b>$100 million</b>.<q>This will get you charged up!</q><q>Your warehouse companies double their space.</q>',
		[10,13]
	);
	CookiStocker.AchPlasmic.order = 1003100;
	CookiStocker.AchBoseEinstein = CCSE.NewAchievement(
		'Bose-Einstein Condensed Assets',
		'Have your stock market profits surpass <b>$500 million</b>.<q>You have so many assets, we need to condense them!</q><q>Your warehouse companies double their space.</q>',
		[9,19]
	);
	CookiStocker.AchBoseEinstein.pool = 'shadow';
	CookiStocker.AchBoseEinstein.order = 1003101;
};

Game.registerMod('CookiStocker',{
	init: function () {
		Game.registerHook('reset', function (hard) {
			CookiStocker.reset(hard);
		});

		// Defer menu wiring until CCSE is available (prevents load-time crash)
		(function waitCCSE(tries) {
			if (typeof CCSE !== 'undefined'
				&& typeof CCSE.AppendCollapsibleOptionsMenu === 'function'
				&& typeof CCSE.AppendStatsVersionNumber === 'function') {
				try {
					CookiStocker.ReplaceGameMenu();
				} catch (e) {
					console.warn('[CookiStocker] ReplaceGameMenu failed; will retry shortly:', e);
					setTimeout(function(){ waitCCSE(tries - 1); }, 250);
					return;
				}
			} else if (tries > 0) {
				setTimeout(function(){ waitCCSE(tries - 1); }, 250);
			} else {
				console.warn('[CookiStocker] CCSE not detected; Options/Stats menu will not be installed.');
			}
		})(120);	// up to ~30s

		Game.Notify('CookiStocker is loaded', stockerGreeting, [1, 33], false);

		// Your loop bootstrap already self-defers until the Bank minigame is ready
		this.startStocking();
	},

	save: function () {
		return CookiStocker.save();
	},

	// The game will pass the string we returned from save() back into load(str).
	// We defer until the Bank minigame is present so CookiStocker.load can safely touch its state.
	load: function (str) {
		var tries = 0;
		(function tryLoad() {
			var bankReady =
				typeof Game === 'object' && Game.ready &&
				Game.Objects && Game.Objects['Bank'] &&
				Game.Objects['Bank'].minigame && stockList.Goods[0];

			if (bankReady) {
				try {
					// Ensure CookiStocker sees the Bank minigame
					if (typeof CookiStocker.Bank === 'undefined' || !CookiStocker.Bank) {
						CookiStocker.Bank = Game.Objects['Bank'].minigame;
					}
					CookiStocker.load(str || '');
				} catch (e) {
					console.warn('[CookiStocker] load failed:', e);
				}
			} else {
				// Try again a few times while the game finishes loading UI/minigames.
				if (tries++ < 120) setTimeout(tryLoad, 250); // up to ~30s
				else console.warn('[CookiStocker] load skipped (Bank minigame never became ready).');
			}
		})();
	},

	startStocking: function () {
		if (!(CookiStocker.Bank = Game.Objects['Bank'].minigame)) {
//			console.log('=====$$$=== Stock Market minigame has not initialised yet! Will try again in 500 ms.');
			setTimeout(() => {
				this.startStocking();
			}, 500);
			return
		}
		else {
			console.log('=====$$$=== CookiStocker logic loop initialised at ' + new Date());
			console.log('=====$$$=== With main options as follows:')
			console.log('=====$$$=== Logic loop frequency: ' + stockerTimeBeautifier(stockerLoopFrequency))
			console.log('=====$$$=== Report frequency: ' + stockerTimeBeautifier(stockerActivityReportFrequency))
			console.log('=====$$$=== Cheating: ' + stockerForceLoopUpdates)
			console.log(stockList.Check);
		}
		CookiStocker.Bank = Game.Objects['Bank'].minigame;
		CookiStocker.patchedMaxStock || (function(){ /* the override above */ })();
		if (!CookiStocker.patchedMaxStock) {
			var M = Game.Objects['Bank'].minigame;
			var oldGet = M.getGoodMaxStock;
			M.getGoodMaxStock = function(good){
				var base = oldGet.call(this, good);
				if (CookiStocker.Bank.officeLevel < 3 || stockList.Profits < CS_PLASMIC_PROFITS)
					return base;

				var mult = 1;

				if (!stockList.shadowGone && stockList.Profits >= CS_GASEOUS_PROFITS) {
					if (Game.Achievements['Gaseous assets'] && Game.Achievements['Gaseous assets'].won) {
						Game.Achievements['Gaseous assets'].pool = '';
						stockList.shadowGone = true;
					} else
						return;
				}
				if (Game.Objects['Bank'].level >= 12) {
					if (stockerExponential && stockList.origCookiesPsRawHighest)
						mult *= Game.cookiesPsRawHighest ** (stockerExponentialPower / stockList.origCookiesPsRawHighest);
					if (Game.Achievements['Plasmic assets'] && Game.Achievements['Plasmic assets'].won && stockList.Profits >= CS_PLASMIC_PROFITS * mult)
						mult *= 2;
					if (Game.Achievements['Bose-Einstein Condensed Assets'] && Game.Achievements['Bose-Einstein Condensed Assets'].won && stockList.Profits >= CS_BOSE_EINSTEIN_PROFITS * mult)
						mult *= 2;
				}
				return Math.ceil(base * mult);
			};
			CookiStocker.patchedMaxStock = true;
		}
		CookiStocker.installBankTickHook();
		
		let datStr = `
			<div class="stocker-stats">
				<span class="stat">Net profits: <span id="Profits">$0</span>.</span>
				<span class="stat">Profits per hour: <span id="profitsHour">$0</span>.</span>
				<span class="stat">Profits per day: <span id="profitsDay">$0</span>.</span>
				<span class="stat">Gross profits: <span id="grossProfits">$0</span>.</span>
				<span class="stat">Gross losses: <span id="grossLosses">$0</span>.</span>
				<span class="stat">Runtime: <span id="runTime">${stockerForceLoopUpdates ? "0:00:00" : "0:00"}</span></span>
			</div>
		`;

		let datStrWarn = `
			<div class="stocker-stats" id="stockerWarnLine" style="display:none;">
				<span class="stat" style="font-size:12px;color:#ff3b3b;font-weight:bold;">
				THERE ARE INSUFFICENT RESOURCES TO RUN AUTOMATIC TRADING. PLEASE SEE THE FOLLOWING LINE AND READ THE STEAM GUIDE.
				</span>
			</div>
		`;

		let datStrWarn2 = `
			<div class="stocker-stats" id="stockerWarnLine2" style="display:none;">
				<span class="stat" style="font-size:12px;color:#ff3b3b;font-weight:bold;">
				AUTO TRADING IS TURNED OFF IN THE OPTIONS.
				</span>
			</div>
		`;

		let datStrWarn3 = `
			<div class="stocker-stats" id="stockerWarnLine3" style="display:none;">
				<span class="stat" style="font-size:12px;color:#ff3b3b;font-weight:bold;">
				THE STOCK MARKET IS TURNED OFF IN THE OPTIONS.
				</span>
			</div>
		`;
		l('bankHeader').firstChild.insertAdjacentHTML('beforeend', datStr);

		let datStr1 = `
			<div class="stocker-stats">
				<span class="stat">Brokers: <span id="Brokers">0</span>.</span>
				<span class="stat">Brokers Needed: <span id="brokersNeeded">0</span>.</span>
				<span class="stat">Banked cookies: <span id="bankedCookies">0</span>.</span>
				<span class="stat">Required cookie minimum: <span id="minCookies">0</span>.</span>
				<span class="stat">Maximum: <span id="maxCookies">0</span>.</span>
			</div>
		`;

		l('bankHeader').firstChild.insertAdjacentHTML('beforeend', datStrWarn);
		l('bankHeader').firstChild.insertAdjacentHTML('beforeend', datStrWarn2);
		l('bankHeader').firstChild.insertAdjacentHTML('beforeend', datStrWarn3);
		l('bankHeader').firstChild.insertAdjacentHTML('beforeend', datStr1);
		// optional lines now live in a single container we control
		let extra = l(CookiStocker.extraStatsId);
		if (!extra){
			extra = document.createElement('div');
			extra.id = CookiStocker.extraStatsId;
			l('bankHeader').firstChild.appendChild(extra);
		}
		// initial visibility / content
		if (stockerAdditionalTradingStats) {
			extra.innerHTML = CookiStocker.buildExtraStatsHTML();
			extra.style.display = '';
		} else {
			extra.innerHTML = '';	// keep empty and hidden initially
			extra.style.display = 'none';
		}

		let market = CookiStocker.Bank.goodsById;	// read market
		console.log('Reading the market:');
		stockList.startingProfits = CookiStocker.Bank.profit;
		for (let i = 0; i < market.length; i++){
			stockList.Goods.push({
		 		name: market[i].name,
		 		stock: market[i].stock,
		 		currentPrice: market[i].val,
				mode: market[i].mode,
				lastMode: market[i].mode,
				lastDur: market[i].dur,
				unchangedDur: 0,
				dropCount: 0,
				riseCount: 0,
				profit: 0,
				someSold: false,
				someBought: false,
			});
			console.log('Stock: ' + market[i].name.replace('%1', Game.bakeryName) + ' Status: ' + modeDecoder[market[i].mode] + ' at $' + market[i].val + (market[i].stock ? ' (own)' : ''));
		}
		CookiStocker.ensureAchievements();
		CookiStocker.ensureReportTimer();
		CookiStocker.TradingStats();
		// restart the loop cleanly
		if (CookiStocker._loopTimer) { clearInterval(CookiStocker._loopTimer); CookiStocker._loopTimer = 0; }
		CookiStocker._loopTimer = setInterval(function() {
			// Skip all actions during ascension countdown / reincarnation transition
			if (Game.OnAscend || (typeof Game.AscendTimer !== 'undefined' && Game.AscendTimer > 0) || l("Brokers") == null)
				return;
			if (stockerMarketOn) {
				if (stockList.noModActions) {
					stockList.noModActions = false;
					CookiStocker.TradingStats();
				}
				if (stockerForceLoopUpdates)
					CookiStocker.Bank.secondsPerTick = Math.max(0.001, stockerLoopFrequency / 1000);
				else
					CookiStocker.Bank.secondsPerTick = 60;
			} else {
				if (stockList.noModActions)
					return;
				CookiStocker.Bank.secondsPerTick = CS_TEN_YEARS;
			}

			let doUpdate = false;
			
			// setting stockerForceLoopUpdates to true will make the logic loop force the market to tick every time it triggers,
			// making this an obvious cheat, and i will personally resent you.  
			//
			// but
			// if you backup your save and set stockerLoopFrequency to like 10 milliseconds it looks very fun and effective.
			// yes, this is how i made the gif on the steam guide page.  [Comments by Gingerguy.]
			if (!stockerForceLoopUpdates && stockerMarketOn)
				stockerLoopFrequency = CookiStocker.Bank.secondsPerTick * 500;		// Keep up to date
			if (CookiStocker.Bank.profit >= 100000000 && !Game.Achievements['Plasmic assets'].won)
				Game.Win('Plasmic assets');
			if (CookiStocker.Bank.profit >= 500000000 && !Game.Achievements['Bose-Einstein Condensed Assets'].won)
				Game.Win('Bose-Einstein Condensed Assets');

			const smallDelta = 3;
			const largeDelta = 4;
			const alwaysBuyBelow = 2;
			const neverSellBelow = 11;
			let amount = 0;

			if (!Game.OnAscend && (stockerAutoBuyMinimumBrokers || stockerAutoBuyAdditionalBrokers)) {
				let buyBrokers, buyMoreBrokers;
				let tradingStats = false;
				let cost;

				buyBrokers = stockerMinBrokers - CookiStocker.Bank.brokers;
				if (stockerAutoBuyMinimumBrokers && buyBrokers > 0 && stockerMinBrokers <= CookiStocker.Bank.getMaxBrokers() && buyBrokers * CookiStocker.Bank.getBrokerPrice() < Game.cookies * 0.1) {
					Game.Spend(CookiStocker.Bank.getBrokerPrice() * buyBrokers);
					CookiStocker.Bank.brokers = stockerMinBrokers;
					tradingStats = true;
				}
				buyMoreBrokers = CookiStocker.Bank.getMaxBrokers() - CookiStocker.Bank.brokers;
				if (stockerAutoBuyAdditionalBrokers && buyMoreBrokers > 0 && (cost = CookiStocker.Bank.getBrokerPrice() * buyMoreBrokers) < Game.cookies * 0.1) {
					Game.Spend(cost);
					CookiStocker.Bank.brokers += buyMoreBrokers;
					tradingStats = true;
				}
				if (tradingStats)
					CookiStocker.TradingStats();
			}
			market = CookiStocker.Bank.goodsById;	// update market
			stockList.canBuy = stockerAutoTrading && CookiStocker.Bank.brokers >= stockerMinBrokers;
			for (let i = 0; i < market.length; i++) {
				if (stockList.canBuy && !((CookiStocker.Bank.getGoodMaxStock(market[i]) - market[i].stock) * Game.cookiesPsRawHighest * market[i].val < Game.cookies * stockerCookiesThreshold)) {
					let now = Date.now();
					let remainder;

					stockList.Start += now - stockList.lastTime;
					stockList.Uptime = Math.floor((now - stockList.Start) / 1000) * 1000;
					if (remainder = stockList.Uptime % stockerLoopFrequency) {
						stockList.Start += CookiStocker.Bank.secondsPerTick * 1000 + remainder;
						stockList.Uptime -= CookiStocker.Bank.secondsPerTick * 1000 + remainder;
					}
					stockList.lastTime = now;
					CookiStocker.TradingStats();
					stockList.canBuy = false;
					if (!stockerAutoTrading) {
						stockList.noModActions = true;
						if (CookiStocker.reportTimer) {
							clearInterval(CookiStocker.reportTimer);
							CookiStocker.reportTimer = null;
						}
					}
				}
				amount += Game.ObjectsById[i+2].amount;
			}
			if (!(stockList.Amount = amount))			// No stocks active
				return;
			CookiStocker.TradingStats();
			CookiStocker.ensureReportTimer();
			if (stockList.canBuy && !stockList.origCookiesPsRawHighest)
				stockList.origCookiesPsRawHighest = Game.cookiesPsRawHighest;
			for (let i = 0; i < market.length; i++) {
				
				let stockerNotificationTime = stockerFastNotifications * 6;
				let lastPrice = stockList.Goods[i].currentPrice;
				let currentPrice = market[i].val;

				// update stockList
				stockList.Goods[i].stock = market[i].stock;
				stockList.Goods[i].currentPrice = market[i].val;
				stockList.Goods[i].mode = market[i].mode;

				let md = stockList.Goods[i].mode;
				let lmd = stockList.Goods[i].lastMode;
				let lastStock = market[i].stock;
				let deltaPrice = largeDelta;
				let stockName = market[i].name.replace('%1', Game.bakeryName);
				
				// Our ceilingPrice is the maximum of the bank ceiling and the (deprecated but still useful) stock ceiling
				let ceilingPrice = Math.max(10*(i+1) + Game.Objects['Bank'].level + 49, 97 + Game.Objects['Bank'].level * 3);

				if (stockList.Goods[i].lastDur != market[i].dur || ++stockList.Goods[i].unchangedDur > 1) {
					stockList.Goods[i].unchangedDur = 0;
					doUpdate = true;
				}
				if (Game.ObjectsById[i+2].amount == 0 && stockerConsoleAnnouncements && doUpdate && stockList.canBuy) {
					console.log(`${stockName} stock is inactive`);
					continue;
				}
				if (lmd == md && (stockList.Goods[i].stock && (md == 2 || md == 4) ||	// Make selling into a downturn easier
				!stockList.Goods[i].stock && (md == 1 || md == 3)))			// Make buying into an upturn easier
					deltaPrice = smallDelta;
				if (md != lmd && (md == 3 && lmd != 1 || md == 4 && lmd != 2 || md == 1 && lmd != 3 || md == 2 && lmd != 4)) {
					stockList.Goods[i].dropCount = 0;
					stockList.Goods[i].riseCount = 0;
				} else if (currentPrice > lastPrice) {
					stockList.Goods[i].dropCount = 0;
					stockList.Goods[i].riseCount++;
				} else if (currentPrice < lastPrice) {
					stockList.Goods[i].riseCount = 0;
					stockList.Goods[i].dropCount++;
				}
				if (stockerConsoleAnnouncements && doUpdate && stockList.canBuy) {			// Tick tick
					if (md == lmd)
						console.log(`${stockName} mode is unchanged at ${lmd} [${modeDecoder[lmd]}] at $${Beautify(currentPrice, 2)}`);
					else
						console.log(`MODE CHANGE ${stockName} old mode was ${lmd} [${modeDecoder[lmd]}] and new mode is ${md} [${modeDecoder[md]}] at $${Beautify(currentPrice, 2)}`);
				}
				stockList.Goods[i].lastDur = market[i].dur;
				if (	// buy conditions
					(
						currentPrice < alwaysBuyBelow || md != 4 && ((currentPrice > lastPrice &&
						stockList.Goods[i].riseCount >= deltaPrice || (md == 1 || md == 3) && md != lmd || 
						md == 0 && !stockList.Goods[i].someSold && stockList.Goods[i].dropCount < deltaPrice &&
						currentPrice >= 10) && (currentPrice < ceilingPrice || md == 1 || md == 3))
					)
					&& stockList.canBuy && ((CookiStocker.Bank.getGoodMaxStock(market[i]) - market[i].stock) * Game.cookiesPsRawHighest * market[i].val < Game.cookies * stockerCookiesThreshold && CookiStocker.Bank.brokers >= stockerMinBrokers)
					&& CookiStocker.Bank.buyGood(i,10000) 	// actual buy attempt
				)
				{
					// buying
					let mode = (lmd != md) ? 'is no longer in ' + modeDecoder[lmd] + ' mode' : 'is ';
					let units = market[i].stock - lastStock;

					stockList.Goods[i].someBought = true;
					stockList.Goods[i].stock = market[i].stock;
					if (typeof market[i].prevBuyMode1 !== 'undefined')
					{
						market[i].prevBuyMode1 = lmd;
						market[i].prevBuyMode2 = md;
					}
					market[i].buyTime = Date.now();
					if (typeof StockAssistant !== 'undefined')
					{
						StockAssistant.stockData.goods[i].boughtVal = market[i].prev;
						StockAssistant.buyGood(i);
					}
					stockList.Purchases++;
					if (stockerTransactionNotifications)
						if (currentPrice >= 2) Game.Notify(`Buying ${stockName} ${new Date().toLocaleTimeString([], {hourCycle: 'h23', hour: '2-digit', minute: '2-digit'})}`,`Buying ${units} unit${(units > 1 ? 's' : '')}. The stock ${mode} at $${Beautify(market[i].prev, 2)} per unit (your buying price) and is in ${modeDecoder[md]} mode now.`,goodIcons[i],stockerNotificationTime);
						else Game.Notify(`Buying ${stockName} ${new Date().toLocaleTimeString([], {hourCycle: 'h23', hour: '2-digit', minute: '2-digit'})}`, `Buying ${units} unit${(units > 1 ? 's' : '')}. The price has dropped below $2 per unit, and your buying price is $${Beautify(market[i].prev, 2)}.`,goodIcons[i],stockerNotificationTime);
					if (stockerConsoleAnnouncements) console.log('=====$$$=== Buying '+ stockName + ' at $' + Beautify(market[i].prev, 2));
				} else if (	// sell conditions
					stockList.Goods[i].stock > 0 && (currentPrice < lastPrice &&
					stockList.Goods[i].dropCount >= deltaPrice ||
					(md == 2 || md == 4) && md != lmd) && currentPrice >= neverSellBelow	// not near the bottom
				)
				{
					let profit = 0;
					let strProfit = 'profit '
					let mode = (lmd != md) ? 'is no longer in ' + modeDecoder[lmd] + ' mode and ' : '';

					if (!CookiStocker.Bank.sellGood(i,stockList.Goods[i].stock)) {
						stockList.Goods[i].lastMode = stockList.Goods[i].mode;
						continue;
					}
					stockList.Goods[i].someSold = true;
					market[i].prevSale = market[i].val;
					market[i].prevSellMode1 = lmd;
					market[i].prevSellMode2 = md;
					market[i].sellTime = Date.now();
					if (typeof StockAssistant !== 'undefined')
						StockAssistant.sellGood(i);
					stockList.Sales++;
					profit = (market[i].val - market[i].prev) * stockList.Goods[i].stock;
					stockList.Goods[i].profit += profit;
					if (profit > 0) {
						stockList.grossProfits += profit;
						stockList.profitableTrades++;
					} else {
						stockList.grossLosses += -profit;
						stockList.unprofitableTrades++;
					}
					stockList.netProfits += profit;
					stockerModeProfits[lmd][md][0] += profit;
					stockerModeProfits[lmd][md][1] += profit;
					stockerModeProfits[lmd][md][2]++;
					if (profit < 0)
					{
						strProfit = 'loss ';
						profit = -profit;
					}
					if (stockerTransactionNotifications) Game.Notify(`Selling ${stockName} ${new Date().toLocaleTimeString([], {hourCycle: 'h23', hour: '2-digit', minute: '2-digit'})}`,`Selling ${stockList.Goods[i].stock} unit${(stockList.Goods[i].stock > 1 ? 's' : '')} at a price of $${Beautify(market[i].val, 2)} per unit for a ${strProfit} of $${Beautify(profit, 2)} and total revenue of $${Beautify(market[i].val*stockList.Goods[i].stock, 2)}, which is added to the total market profits. The stock ${mode} is in ${modeDecoder[md]} mode now. Bought at a price of $${Beautify(market[i].prev, 2)} per unit.`,goodIcons[i],stockerNotificationTime);
					if (stockerConsoleAnnouncements) console.log(`=====$$$=== Selling ${stockName} at $${Beautify(market[i].val, 2)} for a ${strProfit}of $${Beautify(profit, 2)} and total revenue of $${Beautify(market[i].val*stockList.Goods[i].stock, 2)}. Last bought at $${Beautify(market[i].prev, 2)}.`);
				}
				stockList.Profits = CookiStocker.Bank.profit - stockList.startingProfits;
				stockList.Goods[i].lastMode = stockList.Goods[i].mode;
			}
			stockList.profitableStocks = stockList.unprofitableStocks = 0;
			for (let i = 0; i < market.length; i++) {			// Must recalculate the whole list on every pass
				if (stockList.Goods[i].profit > 0)
					stockList.profitableStocks++;
				else if (stockList.Goods[i].profit < 0)
					stockList.unprofitableStocks++;
			}
			CookiStocker.TradingStats();
			if (!stockerMarketOn) {
				if (CookiStocker.reportTimer) { clearInterval(CookiStocker.reportTimer); CookiStocker.reportTimer = null; }
				CookiStocker.Reports();		// one last summary
				stockList.noModActions = true;	// freeze until ON
				return;
			}
		},stockerLoopFrequency);
	},
})

CookiStocker.Reports = function() {
	if (l("Brokers") == null || !stockList.Amount || !stockList.canBuy)
		return;				// Stock market went away
	CookiStocker.TradingStats();
	if (stockList.noModActions || !stockerActivityReport && !stockerConsoleAnnouncements)
		return;
	let stockerNotificationTime = stockerFastNotifications * 6;

	if (stockerActivityReport)
		if ((stockList.Purchases + stockList.Sales) == 0) {
			Game.Notify(
				`CookiStocker report ${new Date().toLocaleTimeString([], {hourCycle: 'h23', hour: '2-digit', minute: '2-digit'})}`,
				`This session has been running for ${stockerTimeBeautifier(stockList.Uptime)}, but no good investment opportunities were detected! Luck is not on our side, yet.`
				,[1, 33],stockerNotificationTime
			);
		} else {
			Game.Notify(
				`CookiStocker report ${new Date().toLocaleTimeString([], {hourCycle: 'h23', hour: '2-digit', minute: '2-digit'})}`,
				`This session has been running for ${stockerTimeBeautifier(stockList.Uptime)} and has made $${Beautify(stockList.netProfits, 0)} in net profits and $${Beautify(stockList.Profits, 0)} in revenue (displayed profits) in ${Beautify(stockList.Purchases, 0)} purchases and ${Beautify(stockList.Sales, 0)} sales.`,[1, 33],stockerNotificationTime
			);
		}
	if (stockerConsoleAnnouncements) {
		let totalProfits = 0;
		let subtotalProfits = 0;
		let deltaTotalProfits = 0;
		let deltaSubtotalProfits = 0;
		let totalTrades = 0;
		let subtotalTrades = 0;
		let profit = 0;
		let lastProfit = 0;
		let trades = 0;
		let strProfit = '';
		let strDeltaModeProfits = '';
		let strTrades = '';
		let j, k;

		console.log(`Running for ${stockerTimeBeautifier(stockList.Uptime)} and made $${Beautify(stockList.netProfits, 0)}\n  in net profits and $${Beautify(stockList.Profits, 0)} in revenue (displayed profits)\n  in ${Beautify(stockList.Purchases, 0)} purchases and ${Beautify(stockList.Sales, 0)} sales.\nTotal number of stocks held: ${stockList.totalStocks}.  Total shares: ${Beautify(stockList.totalShares, 0)}.\nTotal value: $${Beautify(stockList.totalValue)}.  Unrealized profits: $${Beautify(stockList.unrealizedProfits, 2)}.\nTotal gross profits:  $${Beautify(stockList.grossProfits, 0)}.  Profitable stocks:  ${stockList.profitableStocks}.\nProfitable trades:  ${stockList.profitableTrades}.  Average profit per trade:  $${stockList.grossProfits ? Beautify(stockList.grossProfits / stockList.profitableTrades, 2) : 0}.\nTotal gross losses:  $${Beautify(stockList.grossLosses, 0)}.  Unprofitable stocks:  ${stockList.unprofitableStocks}.\nUnprofitable trades:  ${stockList.unprofitableTrades}.  Average loss per trade:  $${stockList.grossLosses ? Beautify(stockList.grossLosses / stockList.unprofitableTrades, 2) : 0}.`);
		
		// Stats for individual modes
		for (j = 0; j < 6; j++)
			for (k = 0; k < 6; k++)
				totalProfits += stockerModeProfits[j][k][0];
		for (j = 0; j < 6; j++)
			for (k = 0; k < 6; k++) {
				profit = stockerModeProfits[j][k][0];
				lastProfit = stockerModeProfits[j][k][1];
				trades = stockerModeProfits[j][k][2];
				strProfit = profit ? ((100 * profit/totalProfits).toFixed(2) + '%').padStart(8) : '';
				strDeltaModeProfits = (lastProfit ? '$' + Beautify(lastProfit, 2) : '').padStart(14);
				strTrades = trades ? (' ' + trades + ' trade' + (trades > 1 ? 's' : ' ')).padStart(13) : '';
				
				console.log(`Profits[${j}][${k}] = $${Beautify(profit, 2).padEnd(14)} ${strProfit}${strDeltaModeProfits}${strTrades}`);
				subtotalProfits += profit;
				deltaSubtotalProfits += lastProfit;
				deltaTotalProfits += lastProfit;
				subtotalTrades += trades;
				totalTrades += trades;
			}
			
		// Stats for subtotals
		for (j = 0; j < 6; j++) {
			subtotalProfits = 0;
			deltaSubtotalProfits = 0;
			subtotalTrades = 0;
			for (k = 0; k < 6; k++) {
				subtotalProfits += stockerModeProfits[j][k][0];
				deltaSubtotalProfits += stockerModeProfits[j][k][1];
				subtotalTrades += stockerModeProfits[j][k][2];
				stockerModeProfits[j][k][1] = 0;
			}
			strProfit = subtotalProfits ? ((100 * subtotalProfits/totalProfits).toFixed(2) + '%').padStart(8) : '';
			strDeltaModeProfits = (deltaSubtotalProfits ? '$' + Beautify(deltaSubtotalProfits, 2) : '').padStart(14);
			strTrades = subtotalTrades ? (' ' + subtotalTrades + ' trade' + (subtotalTrades > 1 ? 's' : ' ')).padStart(13) : '';
			
			console.log(`Subtotal[${j}]`.padEnd(14) + `= $${Beautify(subtotalProfits, 2).padEnd(14)} ${strProfit}${strDeltaModeProfits}${strTrades}`);
			subtotalProfits = 0;
			deltaSubtotalProfits = 0;
			subtotalTrades = 0;
		}
		
		// Stats for totals
		stockList.hourlyProfits = totalProfits * (stockerLoopFrequency / 60_000) * 3600_000 / (stockList.Uptime + 1);
		stockList.dailyProfits = totalProfits * (stockerLoopFrequency / 60_000) * 86_400_000 / (stockList.Uptime + 1);

		if (!stockerForceLoopUpdates) {
			stockList.hourlyProfits *= 2;
			stockList.dailyProfits *= 2;
		}
		console.log(`Total profits = $${Beautify(totalProfits, 2).padEnd(22)}${(deltaTotalProfits ? '$' + Beautify(deltaTotalProfits, 2) : '').padStart(15)}${totalTrades ? (' ' + totalTrades + ' trade' + (totalTrades > 1 ? 's' : ' ')).padStart(13) : ''}`);
		console.log(`Profit per hour = $${Beautify(stockList.hourlyProfits, 2)}; profit per day = $${Beautify(stockList.dailyProfits, 2)}`);
		console.log(`That's ${Beautify(stockList.hourlyProfits * Game.cookiesPsRawHighest, 2)} cookies and ${Beautify(stockList.dailyProfits * Game.cookiesPsRawHighest, 2)} cookies, respectively. It's also ${Beautify((stockList.hourlyProfits / 3600), 0)} times your highest raw cookie production rate.`);
		if (stockerForceLoopUpdates) {
			console.log('In unadjusted, true numbers:');
			stockList.hourlyProfits *= 60_000 / stockerLoopFrequency;
			stockList.dailyProfits *= 60_000 / stockerLoopFrequency;
			console.log(`Profit per hour = $${Beautify(stockList.hourlyProfits, 2)}; profit per diem = $${Beautify(stockList.dailyProfits, 2)}`);
			console.log(`That's ${Beautify(stockList.hourlyProfits * Game.cookiesPsRawHighest, 2)} cookies and ${Beautify(stockList.dailyProfits * Game.cookiesPsRawHighest, 2)} cookies, respectively. It's also ${Beautify((stockList.hourlyProfits / 3600), 0)} times your highest raw cookie production rate.`);
		}
		console.log('------------------------------------------------------------------');
	}
};

CookiStocker.DataStats = function(id, value, dollars) {
	let it = l(id);
	it.innerHTML = (value < 0 ? "-" : "") + (dollars ? '$' : '') + Beautify(Math.abs(value), 0);
	if (id === "Brokers" && CookiStocker.Bank.brokers < stockerMinBrokers)			
		value = -1;
	else if (id === "bankedCookies") {
		if (Game.cookies > stockList.minCookies && Game.cookies < stockList.maxCookies) {
			it.classList.remove("green");
			it.style.color = 'yellow';
			return;
		}
		else if (Game.cookies < stockList.minCookies)
			value = -1;
	}
	if (value > 0) {
		it.classList.add("green");
		it.style.color = '';
	} else if (value < 0) {
		it.classList.remove("green");
		it.classList.remove("yellow");
		it.style.color = '#ff3b3b';
	}
}

CookiStocker.TradingStats = function()
{
	if (typeof CookiStocker.Bank === 'undefined')
		return;

	let i, shares, cookies;
	let now = Date.now();
	let market = CookiStocker.Bank.goodsById;

	if (now > stockList.lastTime + stockerActivityReportFrequency + 500) {		// Were we sleeping?
		stockList.Start += now - stockList.lastTime - stockerActivityReportFrequency;
	}

	stockList.totalStocks = 0;
	stockList.totalShares = 0;
	stockList.totalValue = 0;
	stockList.unrealizedProfits = 0;
	for (i = 0; i < market.length; i++) {
		if (stockList.Goods[i].stock) {
			stockList.totalStocks++;
			stockList.totalShares += stockList.Goods[i].stock;
			stockList.totalValue += stockList.Goods[i].stock * stockList.Goods[i].currentPrice;
			stockList.unrealizedProfits += (market[i].val - market[i].prev) * stockList.Goods[i].stock;
		}
	}
	stockList.minCookies = Number.MAX_VALUE;
	stockList.maxCookies = 0;
	for (i = 0; i < market.length; i++) {
		shares = CookiStocker.Bank.getGoodMaxStock(market[i]) - market[i].stock;
		cookies = shares * Game.cookiesPsRawHighest * market[i].val / stockerCookiesThreshold;
		if (!stockList.minCookies || shares && cookies < stockList.minCookies)
			stockList.minCookies = cookies;
		if (shares && cookies > stockList.maxCookies)
			stockList.maxCookies = cookies;
	}
	CookiStocker.DataStats("Brokers", CookiStocker.Bank.brokers, 0);
	CookiStocker.DataStats("brokersNeeded", stockerMinBrokers, 0);
	CookiStocker.DataStats("bankedCookies", Game.cookies, 0);
	CookiStocker.DataStats("minCookies", stockList.minCookies, 0);
	CookiStocker.DataStats("maxCookies", stockList.maxCookies, 0);
	CookiStocker.DataStats("Profits", stockList.netProfits, 1);
	CookiStocker.DataStats("profitsHour", stockList.hourlyProfits, 1);
	CookiStocker.DataStats("profitsDay", stockList.dailyProfits, 1);
	CookiStocker.DataStats("grossProfits", stockList.grossProfits, 1);
	CookiStocker.DataStats("grossLosses", -stockList.grossLosses, 1);
	stockList.lastTime = now;
	stockList.Uptime = Math.floor((now - stockList.Start) / 1000) * 1000;
	stockList.Uptime -= stockList.Uptime % stockerLoopFrequency;
	let uptimeHours = Math.floor(stockList.Uptime / 3600000);
	let uptimeDays = Math.floor(uptimeHours / 24);
	if (uptimeDays >= 1) {
		uptimeDays += ':';
		uptimeHours %= 24;
		if (uptimeHours < 10)
			uptimeHours = '0' + uptimeHours;
	} else
		uptimeDays = '';
	let it = l("runTime");
	it.innerHTML = uptimeDays + uptimeHours + ':';
	if (stockerForceLoopUpdates) {
		it.innerHTML += new Date(stockList.Uptime).toLocaleTimeString([], {minute: '2-digit', second: '2-digit'});
	} else {
		let uptimeMinutes = (Math.floor(stockList.Uptime / 60000)) % 60;
		it.innerHTML += (uptimeMinutes < 10 ? '0' : '') + uptimeMinutes;
	}
	if (stockerAdditionalTradingStats) {
		CookiStocker.DataStats("netCookies", stockList.netProfits * Game.cookiesPsRawHighest, 0);
		CookiStocker.DataStats("cookiesHour", stockList.hourlyProfits * Game.cookiesPsRawHighest, 0);
		CookiStocker.DataStats("cookiesDay", stockList.dailyProfits * Game.cookiesPsRawHighest, 0);
		l("Purchases").innerHTML = stockList.Purchases;
		l("Sales").innerHTML = stockList.Sales;
		l("cpsMultiple").innerHTML = stockList.hourlyProfits >= 0 ? Beautify(stockList.hourlyProfits / 3600, 3) : -Beautify(-stockList.hourlyProfits / 3600, 3);
		l("stocksHeld").innerHTML = stockList.totalStocks;
		l("totalShares").innerHTML = Beautify(stockList.totalShares);
		CookiStocker.DataStats("totalValue", stockList.totalValue, 1); 
		CookiStocker.DataStats("unrealizedProfits", stockList.unrealizedProfits, 1);
		l("profitableStocks").innerHTML = stockList.profitableStocks;
		l("unprofitableStocks").innerHTML = stockList.unprofitableStocks
		l("profitableTrades").innerHTML = stockList.profitableTrades;
		l("unprofitableTrades").innerHTML = stockList.unprofitableTrades;
		CookiStocker.DataStats("averageProfit", stockList.profitableTrades ? stockList.grossProfits / stockList.profitableTrades : 0, 1);
		CookiStocker.DataStats("averageLoss", stockList.unprofitableTrades ? -stockList.grossLosses / stockList.unprofitableTrades : 0, 1);
	}
	if (it.innerHTML == '')			
		it.innerHTML = "0:00";
	CookiStocker.updateWarn();
}

CookiStocker.updateWarn = function() {
	let warn = l('stockerWarnLine');
	let warn2 = l('stockerWarnLine2');
	let warn3 = l('stockerWarnLine3');

	// Hide all first
	if (warn) warn.style.display = 'none';
	if (warn2) warn2.style.display = 'none';
	if (warn3) warn3.style.display = 'none';
	if (!stockerResourcesWarning) {
		return;
	}
	warn3= l('stockerWarnLine3');
	if (warn3 && !stockerMarketOn) {
		warn3.style.display = '';
		return;
	}
	warn2 = l('stockerWarnLine2');
	if (warn2 && !stockerAutoTrading) {
		warn2.style.display = '';
		return;
	}
	warn = l('stockerWarnLine');
	if (!warn) return;

	// Insufficient if we’re short on brokers or short on banked cookies for a full lot
	if (CookiStocker.Bank.brokers < stockerMinBrokers) {
		warn.style.display = '';
		return;
	}
	let market = CookiStocker.Bank.goodsById;	// update market
	for (let i = 0; i < market.length; i++)
		if ((CookiStocker.Bank.getGoodMaxStock(market[i]) - market[i].stock) * Game.cookiesPsRawHighest * market[i].val >= Game.cookies * stockerCookiesThreshold) {
			warn.style.display = '';
			return;
		}
	warn.style.display = 'none';
};

// ===== CookiStocker options UI & persistence =====

/** Mirror of boolean prefs for CCSE.ToggleButton to read/write.
    We keep the *real* vars exactly where they are (top of file); we just sync them here. */
CookiStocker.state = {
	stockerAutoTrading:		+!!stockerAutoTrading,
	stockerMarketOn:		+!!stockerMarketOn,
	stockerAutoBuyMinimumBrokers:	+!!stockerAutoBuyMinimumBrokers,
	stockerResourcesWarning:	+!!stockerResourcesWarning,
	stockerExponential:		+!!stockerExponential,
	stockerTransactionNotifications:+!!stockerTransactionNotifications,
	stockerActivityReport:		+!!stockerActivityReport,
	stockerFastNotifications:	+!!stockerFastNotifications,
	stockerConsoleAnnouncements:	+!!stockerConsoleAnnouncements,
	stockerAdditionalTradingStats:	+!!stockerAdditionalTradingStats,
	stockerForceLoopUpdates:	+!!stockerForceLoopUpdates,
	stockerAutoBuyAdditionalBrokers:+!!stockerAutoBuyAdditionalBrokers,
};

// Toggle handler (signature matches CCSE.MenuHelper.ToggleButton)
CookiStocker.Toggle = function(prefName, button, on, off, invert) {
	// Flip state bit
	CookiStocker.state[prefName] = CookiStocker.state[prefName] ? 0 : 1;

	// Update button text/class
	l(button).innerHTML = CookiStocker.state[prefName] ? on : off;
	l(button).className = 'smallFancyButton prefButton option' + ((CookiStocker.state[prefName]^invert) ? '' : ' off');

	// Write through to the *real* globals
	switch (prefName) {
		case 'stockerAutoTrading':			stockerAutoTrading = !!CookiStocker.state[prefName]; CookiStocker.updateWarn(); break;
		case 'stockerMarketOn':				stockerMarketOn = !!CookiStocker.state[prefName];
			CookiStocker.updateWarn();		
			CookiStocker.ensureReportTimer();
			break;
		case 'stockerAutoBuyMinimumBrokers':		stockerAutoBuyMinimumBrokers = !!CookiStocker.state[prefName]; CookiStocker.TradingStats(); break;
		case 'stockerAutoBuyAdditionalBrokers':		stockerAutoBuyAdditionalBrokers = !!CookiStocker.state[prefName]; CookiStocker.TradingStats(); break;
		case 'stockerResourcesWarning':			stockerResourcesWarning = !!CookiStocker.state[prefName]; CookiStocker.updateWarn(); break;
		case 'stockerExponential':			stockerExponential = !!CookiStocker.state[prefName]; break;
		case 'stockerTransactionNotifications':		stockerTransactionNotifications = !!CookiStocker.state[prefName]; break;
		case 'stockerActivityReport':			stockerActivityReport = !!CookiStocker.state[prefName]; CookiStocker.ensureReportTimer(); break;
		case 'stockerFastNotifications':		stockerFastNotifications = !!CookiStocker.state[prefName]; break;
		case 'stockerConsoleAnnouncements':		stockerConsoleAnnouncements = !!CookiStocker.state[prefName]; CookiStocker.ensureReportTimer(); break;
		case 'stockerAdditionalTradingStats':		stockerAdditionalTradingStats = !!CookiStocker.state[prefName];
			CookiStocker.updateAdditionalStatsVisibility();
			break;
		case 'stockerForceLoopUpdates':			stockerForceLoopUpdates = !!CookiStocker.state[prefName]; break;
	}
	PlaySound('snd/tick.mp3');
	Game.UpdateMenu();
};

// Commission = 20% * 0.95^brokers
CookiStocker.calcCommission = function(n) {
	const rate = 0.20 * Math.pow(0.95, Math.max(0, Math.min(162, +n || 0)));
	return (rate * 100).toFixed(3) + "%";
};

// Minutes:seconds → ms writer for the two time prefs
CookiStocker.ChangeTime = function(prefName, minId, secId) {
	let mins = Math.max(0, Math.floor(+l(minId).value || 0));
	let secs = Math.max(0, Math.min(59, Math.floor(+l(secId).value || 0)));
	let ms = (mins * 60 + secs) * 1000;

	switch (prefName) {
		case 'stockerActivityReportFrequency':
			stockerActivityReportFrequency = ms;
			if (CookiStocker.reportTimer) {
				clearInterval(CookiStocker.reportTimer);
				CookiStocker.reportTimer = null;
			}
			CookiStocker.ensureReportTimer();
			break;
		case 'stockerLoopFrequency':
			stockerLoopFrequency = ms;
			if (stockerForceLoopUpdates && CookiStocker.Bank && CookiStocker.Bank.secondsPerTick) {
				CookiStocker.Bank.secondsPerTick = Math.max(0.001, stockerLoopFrequency / 1000);
			}
			break;
	}
	PlaySound('snd/tick.mp3');
};

CookiStocker.ChangeNumber = function(prefName, val) {
	let v = Math.max(0, Math.floor(+val || 0));
	switch (prefName) {
		case 'stockerMinBrokers':
			stockerMinBrokers = v;
			break;

		case 'stockerActivityReportFrequency':
			stockerActivityReportFrequency = v;
			if (CookiStocker.reportTimer) {
				clearInterval(CookiStocker.reportTimer);
				CookiStocker.reportTimer = null;
			}
			CookiStocker.ensureReportTimer();
			break;

		case 'stockerLoopFrequency':
			stockerLoopFrequency = v;
			if (stockerForceLoopUpdates && CookiStocker.Bank && CookiStocker.Bank.secondsPerTick) {
				CookiStocker.Bank.secondsPerTick = Math.max(0.001, stockerLoopFrequency / 1000);
			}
			break;
	}
	PlaySound('snd/tick.mp3');
};

// Build the Options menu body (uses CCSE.MenuHelper like Cookie Assistant)
CookiStocker.getMenuString = function() {
	const minutes = (stockerActivityReportFrequency || 0) / 60000;	// may be fractional
	const loopSeconds = Math.floor((stockerLoopFrequency || 0) / 1000);
	var m = CCSE.MenuHelper;
	let str = '';

	str += '<div id="csRoot">';

	// ---------- Automation ----------
	str += m.Header('Automation');

	// Auto trading
	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerAutoTrading','CS_autoTrading','Auto Trading ON','Auto Trading OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerAutoTrading', false)
		+ '</div>';

	// Turns the entire stock market on or off.
	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerMarketOn','CS_market','Stock Market ON','Stock Market OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerMarketOn', false)
		+ '</div>';

	// Auto-buy minimum brokers
	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerAutoBuyMinimumBrokers','CS_autoBuyMinimumBrokers','Auto-buy Minimum Brokers ON','Auto-buy Minimum Brokers OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerAutoBuyMinimumBrokers', false)
		+ '</div>';

	// Auto-buy additional brokers
	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerAutoBuyAdditionalBrokers','CS_autoBuyAdditionalBrokers','Auto-buy Additional Brokers ON','Auto-buy Additional Brokers OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerAutoBuyAdditionalBrokers', false)
		+ '</div>';

	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerResourcesWarning','CS_resourcesWarning','Resources Warning ON','Resources Warning OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerResourcesWarning', false)
		+ '</div>';

	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerExponential','CS_Exponential','Exponential Warehouses ON','Exponential Warehouses OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerExponential', false)
		+ '</div>';

	// ---Exponential multiplier slider (CCSE helper, right-hand live value)
	var cbWarehouseExponent = "stockerExponentialPower = (l('exponentSlider').value);"
		+ " l('exponentSliderRightText').textContent = stockerExponentialPower;"
		+ " CookiStocker.TradingStats();";

	str += '<div class="listing">'
		+ CCSE.MenuHelper.Slider(
			'exponentSlider', 'Warehouse Exponent', '<span id="exponentSliderRightText">'+stockerExponentialPower+'</span>', () => stockerExponentialPower, cbWarehouseExponent, 0.1, 3.0, 0.1
		)
		+ ' ' + CookiStocker.note('stockerExponentialPower', false)
		+ '</div>';

	// --- Min brokers slider (CCSE helper, right-hand live value)
	var cbMinBrokers = "stockerMinBrokers = Math.round(l('minBrokersSlider').value);"
		+ " l('minBrokersSliderRightText').textContent = stockerMinBrokers;"
		+ " l('CS_commissionVal').textContent = CookiStocker.calcCommission(stockerMinBrokers);"
		+ " CookiStocker.TradingStats();";

	str += '<div class="listing">'
		+ CCSE.MenuHelper.Slider(
			'minBrokersSlider', 'Minimum Brokers', '<span id="minBrokersSliderRightText">'+stockerMinBrokers+'</span>', () => stockerMinBrokers, cbMinBrokers, 0, 162, 1
		)
		+ ' <span class="smallLabel">(Commission: <span id="CS_commissionVal">'
		+ CookiStocker.calcCommission(stockerMinBrokers)
		+ '</span>)</span>'
		+ CookiStocker.note('stockerMinBrokers', false)
		+ '</div>';

	// --- Bank percentage allowed per purchase (CCSE helper; shows %; stores fraction)
	var stockerCookiesPercent = Math.round((stockerCookiesThreshold || 0) * 100);
	var cbCookies = "var v = Math.round(l('cookiesPercentSlider').value);"
		+ " stockerCookiesPercent = v;"
		+ " stockerCookiesThreshold = v / 100;"
		+ " l('cookiesPercentSliderRightText').textContent = v + '%';"
		+ " CookiStocker.TradingStats();";

	str += '<div class="listing">'
		+ CCSE.MenuHelper.Slider('cookiesPercentSlider', 'Max Bank % per Purchase', '<span id="cookiesPercentSliderRightText">' + stockerCookiesPercent+'%</span>', () => stockerCookiesPercent, cbCookies, 1, 100, 1)
		+ ' ' + CookiStocker.note('stockerCookiesThreshold', false)
		+ '</div>';


	// ---------- Reporting & Notifications ----------
	str += m.Header('Reporting & Notifications');

	// Transaction notifs
	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerTransactionNotifications','CS_txNotifs','TX Notifications ON','TX Notifications OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerTransactionNotifications', false)
		+ '</div>';

	// Fast notifs
	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerFastNotifications','CS_fastNotifs','Fast Notifications ON','Fast Notifications OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerFastNotifications', false)
		+ '</div>';

	// Console announcements
	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerConsoleAnnouncements','CS_console','Console Announce ON','Console Announce OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerConsoleAnnouncements', false)
		+ '</div>';

	// --- Activity report interval: mm:ss
	var _arMin = Math.floor(stockerActivityReportFrequency / 60000);
	var _arSec = Math.floor((stockerActivityReportFrequency % 60000) / 1000);
	str += '<div class="listing">'
		+ '<label>Report interval:</label> '
		+ '<input id="CS_activityMin" class="smallInput" type="text" size="5" min="0" value="' + _arMin + '"'
		+ ' style="text-align:right !important; width:3ch !important; min-width:3ch !important; max-width:3ch !important;" '
		+ ' inputmode="numeric" '
		+ ' oninput="CookiStocker.ChangeTime(\'stockerActivityReportFrequency\',\'CS_activityMin\',\'CS_activitySec\');"> : '
		+ '<input id="CS_activitySec" class="smallInput" type="text" size="5" min="0" max="59" value="' + _arSec + '"'
		+ ' style="text-align:right !important; width:3ch !important; min-width:3ch !important; max-width:3ch !important;" '
		+ ' inputmode="numeric" '
		+ ' oninput="CookiStocker.ChangeTime(\'stockerActivityReportFrequency\',\'CS_activityMin\',\'CS_activitySec\');"> '
		+ '<span class="smallLabel">mm:ss</span>'
		+ '</div>';

	// Extra stats
	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerAdditionalTradingStats','CS_moreStats','Extra Trading Stats ON','Extra Trading Stats OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerAdditionalTradingStats', false)
		+ '</div>';

	// ---------- Timing (Advanced) ----------
	str += m.Header('Timing (Advanced)');

	// Loop frequency (UI shows SECONDS; integers; right-justified ~5 digits)
	str += '<div class="listing">'
		+ '<label>Loop (seconds): </label>'
		+ '<input id="CS_loopFreq" type="text" size="5" '
		+ ' value="' + loopSeconds + '" '
		+ ' style="text-align:right !important; width:5ch !important; min-width:5ch !important; max-width:5ch !important;" '
		+ ' inputmode="numeric" '
		+ ' oninput="CookiStocker.ChangeNumber(\'stockerLoopFrequency\', this.value);" />'
		+ CookiStocker.note('stockerLoopFrequency', true)
		+ '</div>';

	// Force loop (cheat)
	str += '<div class="listing">'
		+ m.ToggleButton(CookiStocker.state,'stockerForceLoopUpdates','CS_forceLoop','Force Loop (cheat) ON','Force Loop (cheat) OFF',"CookiStocker.Toggle")
		+ CookiStocker.note('stockerForceLoopUpdates', true)
		+ '</div>';
	
	str += '</div>';
	return str;
};

// ---------- Inline option comments (no tooltips) ----------
CookiStocker.esc = function(s){
	return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
		.replace(/'/g,'&#39;').replace(/"/g,'&quot;');
};

// Texts copied from the comments above your variable defs
CookiStocker.docs = {
	stockerAutoTrading:			"Automatic trading when on",
	stockerMarketOn:			"Stock market is running when on",
	stockerMinBrokers:			"Minimum number of brokers required for automatic trading",
	stockerCookiesThreshold:		"Percentage of banked cookies allowed for a single automatic trade",
	stockerAutoBuyMinimumBrokers:		"Buy all necessary brokers as soon as you can afford them",
	stockerResourcesWarning:		"Display warning when market conditions and/or options do not permit auto trading",
	stockerExponential:			"Increases number of warehouses in sync with the highest raw CPS during this session",
	stockerExponentialPower:		"The ratio of the highest raw CPS to the original raw CPS is raised to this power when Exponential Warehouses is on",
	stockerTransactionNotifications:	"Announce transactions in game notifications",
	stockerActivityReport:			"Make regular profit reports",
	stockerActivityReportFrequency:		"How often to make regular reports (minutes and seconds)",
	stockerFastNotifications:		"Make game notifications fade away on their own after 6 seconds",
	stockerConsoleAnnouncements:		"Use console.log for more detailed info on prices and trends",
	stockerAdditionalTradingStats:		"Display more detailed trading info near the top of the stock market display",
	stockerLoopFrequency:			"Logic loop frequency (seconds) — CHEAT",
	stockerForceLoopUpdates:		"The cheat itself. Rolls the cycle every time logic loop triggers — CHEAT",
	stockerAutoBuyAdditionalBrokers:	"Buy additional brokers as soon as you can afford them",
};

// Render end-of-line text (red if cheat)
CookiStocker.note = function(key, cheat){
	const t = CookiStocker.esc(CookiStocker.docs[key] || "");
	return t ? (' <span class="smallLabel" style="color:'+(cheat?'#ff3705':'rgba(255,255,255,0.65)')+'">'+t+'</span>') : '';
};

// Commission = 20% * 0.95^brokers → show as percentage
CookiStocker.calcCommission = function(n){
	const rate = 0.20 * Math.pow(0.95, Math.max(0, Math.min(162, +n||0)));
	return (rate*100).toFixed(3) + "%";
};

CookiStocker.ReplaceGameMenu = function()
{
	Game.customOptionsMenu.push(function()
	{
		// Build a real node from the HTML string
		const content = document.createElement('div');
		content.innerHTML = CookiStocker.getMenuString();

		// CCSE expects a Node here, not a string
		CCSE.AppendCollapsibleOptionsMenu(CookiStocker.name, content);
	});
	
	Game.customStatsMenu.push(function() {
		CCSE.AppendStatsVersionNumber(CookiStocker.name, CookiStocker.version);
		if (!CookiStocker.Bank || !CookiStocker.Bank.goodsById) return;
		
		// example rollup; adjust to taste
		var p = CookiStocker.Bank.profit;
		var held = CookiStocker.Bank.goodsById.reduce((a,g)=>a+g.stock,0);
		var worth = CookiStocker.Bank.goodsById.reduce((a,g)=>a+g.stock * g.val * Game.cookiesPsRawHighest,0);
		
		CCSE.AppendStatsGeneral('<div class="listing"><b>Stock Market has earned you :</b><div class="price plain"> $' + Beautify(p) + ' (' + Game.tinyCookie() + Beautify(p * Game.cookiesPsRawHighest) + ' cookies)</div></div>');
/*		CCSE.AppendStatsGeneral(
			'<div class="listing"><b>CookiStocker</b></div>'
			+ '<div class="listing">Net profits: <b>$' + Beautify(p, 2) + '</b></div>'
			+ '<div class="listing">Total shares held: <b>' + Beautify(held) + '</b></div>'
			+ '<div class="listing">Portfolio (at current prices): <b>$' + Beautify(worth,2) + '</b></div>'
		);
*/	});
}

/*
function sleepSync(ms) {
	const end = Date.now() + ms;
	while (Date.now() < end) {}	// busy-wait
}
*/

CookiStocker.save = function() {
	var str = '';

	if (typeof CookiStocker.Bank === 'undefined')
		return '';
	let market = CookiStocker.Bank.goodsById;
	str += Number(stockList.Check);
	for (let i = 0; i < market.length; i++) {
		str += '_' + encodeURIComponent(stockList.Goods[i].name);
		str += '_' + Number(stockList.Goods[i].stock);
		str += '_' + Number(stockList.Goods[i].val);
		str += '_' + Number(stockList.Goods[i].currentPrice);
		str += '_' + Number(stockList.Goods[i].mode);
		str += '_' + Number(stockList.Goods[i].lastMode);
		str += '_' + Number(stockList.Goods[i].lastDur);
		str += '_' + Number(stockList.Goods[i].unchangedDur);
		str += '_' + Number(stockList.Goods[i].dropCount);
		str += '_' + Number(stockList.Goods[i].riseCount);
		str += '_' + Number(stockList.Goods[i].profit);
		str += '_' + (+!!stockList.Goods[i].someSold);
		str += '_' + (+!!stockList.Goods[i].someBought);
	}
	str += '_' + Number(stockList.Start);
	str += '_' + Number(stockList.lastTime);
	str += '_' + Number(stockList.startingProfits);
	str += '_' + Number(stockList.Profits);
	str += '_' + Number(stockList.netProfits);
	str += '_' + Number(stockList.grossProfits);
	str += '_' + Number(stockList.grossLosses);
	str += '_' + Number(stockList.totalStocks);
	str += '_' + Number(stockList.totalShares);
	str += '_' + Number(stockList.totalValue);
	str += '_' + Number(stockList.unrealizedProfits);
	str += '_' + Number(stockList.profitableStocks);
	str += '_' + Number(stockList.unprofitableStocks);
	str += '_' + Number(stockList.profitableTrades);
	str += '_' + Number(stockList.unprofitableTrades);
	str += '_' + Number(stockList.Purchases);
	str += '_' + Number(stockList.Sales);
	str += '_' + Number(stockList.Uptime);
	str += '_' + Number(stockList.hourlyProfits);
	str += '_' + Number(stockList.dailyProfits);
	str += '_' + Number(stockList.minCookies);
	str += '_' + Number(stockList.maxCookies);
	str += '_' + (+!!stockList.noModActions);
	str += '_' + Number(stockList.origCookiesPsRawHighest);
	for (i = 0; i < stockerModeProfits.length; i++)
		for (j = 0; j < stockerModeProfits[i].length; j++)
			for (k = 0; k < stockerModeProfits[i][j].length; k++)
				str += '_' + Number(stockerModeProfits[i][j][k]);
	str += '_' + Number(Game.Achievements['Plasmic assets'].won);
	str += '_' + Number(Game.Achievements['Bose-Einstein Condensed Assets'].won);
// Append options tail (backward‑compatible)
	const cfg = {
		stockerAutoTrading,
		stockerMinBrokers,
		stockerAutoBuyMinimumBrokers,
		stockerTransactionNotifications,
		stockerActivityReport,
		stockerActivityReportFrequency,
		stockerFastNotifications,
		stockerConsoleAnnouncements,
		stockerAdditionalTradingStats,
		stockerLoopFrequency,
		stockerForceLoopUpdates,
		stockerCookiesThreshold,
		stockerResourcesWarning,
		stockerMarketOn,
		stockerExponential,
		stockerExponentialPower,
		stockerAutoBuyAdditionalBrokers,
	};
	str += '|CFG:' + JSON.stringify(cfg);
	return str;
}

CookiStocker.load = function(str) {
	let i = 0;
	let j, k, m;

	if (typeof CookiStocker.Bank === 'undefined' || !str || !(stockList.Goods[0].name.length > 0))
		return false;

	// --- strip optional config tail BEFORE underscore parsing (prevents token contamination) ---
	let cfg = null;
	let cfgIdx = (str || '').indexOf('|CFG:');
	if (cfgIdx > -1) {
		try { cfg = JSON.parse(str.slice(cfgIdx + 5)); } catch (e) { cfg = null; }
		str = str.slice(0, cfgIdx);
	}

	// Now split clean payload
	let spl = str.split('_');

	let market = CookiStocker.Bank.goodsById;

	// Legacy sharesThreshold captured (used as a fallback for threshold migration)
	let __legacyShares = NaN;

	stockList.Check = Number(spl[i++] || 0);

	// Goods block
	for (j = 0; j < market.length; j++) {
		// Older saves wrote NaN for names; if so, fall back to live name
		var tok = (spl[i++] || '');
		var nm;
		try { nm = decodeURIComponent(tok); } catch (e) { nm = tok; }
		if (!nm || nm === 'NaN') nm = market[j].name;
		stockList.Goods[j].name = nm;

		stockList.Goods[j].stock = Number(spl[i++] || 0);
		stockList.Goods[j].val = Number(spl[i++] || 0);
		stockList.Goods[j].currentPrice = Number(spl[i++] || 0);
		stockList.Goods[j].mode = Number(spl[i++] || 0);
		stockList.Goods[j].lastMode = Number(spl[i++] || 0);
		stockList.Goods[j].lastDur = Number(spl[i++] || 0);
		stockList.Goods[j].unchangedDur = Number(spl[i++] || 0);
		stockList.Goods[j].dropCount = Number(spl[i++] || 0);
		stockList.Goods[j].riseCount = Number(spl[i++] || 0);
		stockList.Goods[j].profit = Number(spl[i++] || 0);
		stockList.Goods[j].someSold = !!(+spl[i++] || 0);
		stockList.Goods[j].someBought = !!(+spl[i++] || 0);
	}

	// Core counters
	stockList.Start = Number(spl[i++] || 0);
	stockList.lastTime = Number(spl[i++] || 0);
	stockList.startingProfits = Number(spl[i++] || 0);
	stockList.Profits = Number(spl[i++] || 0);
	stockList.netProfits = Number(spl[i++] || 0);
	stockList.grossProfits = Number(spl[i++] || 0);
	stockList.grossLosses = Number(spl[i++] || 0);
	stockList.totalStocks = Number(spl[i++] || 0);
	stockList.totalShares = Number(spl[i++] || 0);
	stockList.totalValue = Number(spl[i++] || 0);
	stockList.unrealizedProfits = Number(spl[i++] || 0);
	stockList.profitableStocks = Number(spl[i++] || 0);
	stockList.unprofitableStocks = Number(spl[i++] || 0);
	stockList.profitableTrades = Number(spl[i++] || 0);
	stockList.unprofitableTrades = Number(spl[i++] || 0);
	stockList.Purchases = Number(spl[i++] || 0);
	stockList.Sales = Number(spl[i++] || 0);
	stockList.Uptime = Number(spl[i++] || 0);
	stockList.hourlyProfits = Number(spl[i++] || 0);
	stockList.dailyProfits = Number(spl[i++] || 0);

	// ---- Tail autodetect (back-compat with 2.3) ----
	// OLD (2.3):   [sharesThreshold, minCookies, maxCookies]
	// NEW:         [minCookies, maxCookies, noModActions, origCookiesPsRawHighest, ...modeProfits..., plasmicWon, boseWon]
	var looksLikeOldTail = false;
	if (i < spl.length) {
		var probe = spl[i];
		var num = Number(probe);
		// sharesThreshold was a fraction 0 < x < 1 ; minCookies is a large integer → this distinguishes tails
		if (isFinite(num) && num > 0 && num < 1 && probe.indexOf('.') !== -1) looksLikeOldTail = true;
	}

	if (looksLikeOldTail) {
		// Consume old tail: sharesThreshold (legacy), minCookies, maxCookies
		var _sharesThreshold = Number(spl[i++] || 0);
		__legacyShares = _sharesThreshold;

		stockList.minCookies = Number(spl[i++] || 0);
		stockList.maxCookies = Number(spl[i++] || 0);

		// Fields that didn't exist in 2.3
		stockList.noModActions = 0;
		stockList.origCookiesPsRawHighest = 0;

		// Mode profit grid did not exist → zero it
		for (j = 0; j < stockerModeProfits.length; j++)
			for (k = 0; k < stockerModeProfits[j].length; k++)
				for (m = 0; m < stockerModeProfits[j][k].length; m++)
					stockerModeProfits[j][k][m] = 0;

		// Achievements were not serialized → treat as not won
		CookiStocker.ensureAchievements && CookiStocker.ensureAchievements();
		if (Game.Achievements['Plasmic assets']) Game.Achievements['Plasmic assets'].won = 0;
		if (Game.Achievements['Bose-Einstein Condensed Assets']) Game.Achievements['Bose-Einstein Condensed Assets'].won = 0;
	} else {
		// NEW tail parsing (current format)
		stockList.minCookies = Number(spl[i++] || 0);
		stockList.maxCookies = Number(spl[i++] || 0);
		stockList.noModActions = !!(+spl[i++] || 0);
		stockList.origCookiesPsRawHighest = Number(spl[i++] || 0);

		// Mode profit grid
		for (j = 0; j < stockerModeProfits.length; j++)
			for (k = 0; k < stockerModeProfits[j].length; k++)
				for (m = 0; m < stockerModeProfits[j][k].length; m++)
					stockerModeProfits[j][k][m] = Number(spl[i++] || 0);

		// Achievements (defensive 0/1 only)
		CookiStocker.ensureAchievements && CookiStocker.ensureAchievements();
		var t = +spl[i++];	if (Game.Achievements['Plasmic assets']) Game.Achievements['Plasmic assets'].won						= (t === 1 ? 1 : 0);
		    t = +spl[i++];	if (Game.Achievements['Bose-Einstein Condensed Assets']) Game.Achievements['Bose-Einstein Condensed Assets'].won	= (t === 1 ? 1 : 0);
	}

	// --- apply cfg tail (if present) ---
	if (cfg) {
		if ('stockerAutoTrading' in cfg)			stockerAutoTrading = !!cfg.stockerAutoTrading;
		if ('stockerMarketOn' in cfg)				stockerMarketOn = !!cfg.stockerMarketOn;
		if ('stockerMinBrokers' in cfg)				stockerMinBrokers = +cfg.stockerMinBrokers | 0;
		if ('stockerCookiesThreshold' in cfg)			stockerCookiesThreshold = +cfg.stockerCookiesThreshold;
		if ('stockerAutoBuyMinimumBrokers' in cfg)		stockerAutoBuyMinimumBrokers = !!cfg.stockerAutoBuyMinimumBrokers;
		if ('stockerAutoBuyAdditionalBrokers' in cfg)		stockerAutoBuyAdditionalBrokers = !!cfg.stockerAutoBuyAdditionalBrokers;
		if ('stockerResourcesWarning' in cfg)			stockerResourcesWarning = !!cfg.stockerResourcesWarning;
		if ('stockerExponential' in cfg)			stockerExponential = !!cfg.stockerExponential;
		if ('stockerExponentialPower' in cfg)			stockerExponentialPower = +cfg.stockerExponentialPower | 0;
		if ('stockerTransactionNotifications' in cfg)		stockerTransactionNotifications = !!cfg.stockerTransactionNotifications;
		if ('stockerActivityReport' in cfg)			stockerActivityReport = !!cfg.stockerActivityReport;
		if ('stockerActivityReportFrequency' in cfg)		stockerActivityReportFrequency = +cfg.stockerActivityReportFrequency | 0;
		if ('stockerFastNotifications' in cfg)			stockerFastNotifications = !!cfg.stockerFastNotifications;
		if ('stockerConsoleAnnouncements' in cfg)		stockerConsoleAnnouncements = !!cfg.stockerConsoleAnnouncements;
		if ('stockerAdditionalTradingStats' in cfg)		stockerAdditionalTradingStats = !!cfg.stockerAdditionalTradingStats;
		if ('stockerLoopFrequency' in cfg)			stockerLoopFrequency = +cfg.stockerLoopFrequency | 0;
		if ('stockerForceLoopUpdates' in cfg)			stockerForceLoopUpdates = !!cfg.stockerForceLoopUpdates;

		// --- normalize cookies threshold with legacy fallback (fixes “negative bank” on old saves) ---
		var __th = stockerCookiesThreshold;
		var __legacyCfg = (('sharesThreshold' in cfg) ? +cfg.sharesThreshold : NaN);
		if (!(+__th > 0 && +__th <= 1 && isFinite(+__th))) {
			if (+__legacyCfg > 0 && +__legacyCfg <= 1 && isFinite(+__legacyCfg))	__th = +__legacyCfg;
			else if (typeof __legacyShares === 'number' && __legacyShares > 0 && __legacyShares <= 1) __th = __legacyShares;
			else __th = 0.05;
		}
		stockerCookiesThreshold = Math.min(1, Math.max(0.000001, +__th));	// never 0/NaN

		// Clamp a couple of user-entered intervals to sane ranges
		if (!(stockerLoopFrequency > 0))			stockerLoopFrequency = 30000;
		if (stockerLoopFrequency < 1000)			stockerLoopFrequency = 1000;
		if (!(stockerActivityReportFrequency > 0))		stockerActivityReportFrequency = 60000;
		if (stockerActivityReportFrequency < 1000)		stockerActivityReportFrequency = 1000;

		// Clamp brokers to slider bounds
		if (stockerMinBrokers < 0)				stockerMinBrokers = 0;
		if (stockerMinBrokers > 162)				stockerMinBrokers = 162;

		// Sync the menu state mirror (aligned block)
		CookiStocker.state.stockerAutoTrading			= +!!stockerAutoTrading;
		CookiStocker.state.stockerMarketOn			= +!!stockerMarketOn;
		CookiStocker.state.stockerAutoBuyMinimumBrokers		= +!!stockerAutoBuyMinimumBrokers;
		CookiStocker.state.stockerAutoBuyAdditionalBrokers	= +!!stockerAutoBuyAdditionalBrokers;
		CookiStocker.state.stockerResourcesWarning		= +!!stockerResourcesWarning;
		CookiStocker.state.stockerExponential			= +!!stockerExponential;
		CookiStocker.state.stockerTransactionNotifications	= +!!stockerTransactionNotifications;
		CookiStocker.state.stockerActivityReport		= +!!stockerActivityReport;
		CookiStocker.state.stockerFastNotifications		= +!!stockerFastNotifications;
		CookiStocker.state.stockerConsoleAnnouncements		= +!!stockerConsoleAnnouncements;
		CookiStocker.state.stockerAdditionalTradingStats	= +!!stockerAdditionalTradingStats;
		CookiStocker.state.stockerForceLoopUpdates		= +!!stockerForceLoopUpdates;

		// Honor report timer if needed
		CookiStocker.ensureReportTimer();

		// visibility for optional extra stats
		CookiStocker.state.stockerAdditionalTradingStats = +!!stockerAdditionalTradingStats;

		// honor current setting immediately (post-load)
		CookiStocker.updateAdditionalStatsVisibility();
	}

	// First paint with restored settings (also recomputes min/max and calls updateWarn)
	if (l('bankHeader'))
		CookiStocker.TradingStats();

	return true;
};

CookiStocker.reset = function(hard) {
	if (typeof CookiStocker.Bank === 'undefined')
		return;				// Nothing to reset
	// Stop the running loop during ascension / reset
	if (CookiStocker._loopTimer) { clearInterval(CookiStocker._loopTimer); CookiStocker._loopTimer = 0; }

	let i, j, k;
	let market = CookiStocker.Bank.goodsById;

	stockList.Goods = [];
	for (let i = 0; i < market.length; i++) {
		stockList.Goods.push({
			name: market[i].name,
			stock: market[i].stock,
			currentPrice: market[i].val,
			mode: market[i].mode,
			lastMode: market[i].mode,
			lastDur: market[i].dur,
			unchangedDur: 0,
			dropCount: 0,
			riseCount: 0,
			profit: 0,
			someSold: false,
			someBought: false,
		});
	}
	stockList.Start = Date.now() + 500;
	stockList.lastTime = Date.now() + 500;
	stockList.startingProfits = 0;
	stockList.Profits = 0;
	stockList.netProfits = 0;
	stockList.grossProfits = 0;
	stockList.grossLosses = 0;
	stockList.totalStocks = 0;
	stockList.totalShares = 0;
	stockList.totalValue = 0;
	stockList.unrealizedProfits = 0;
	stockList.profitableStocks = 0;
	stockList.unprofitableStocks = 0;
	stockList.profitableTrades = 0;
	stockList.unprofitableTrades = 0;
	stockList.Purchases = 0;
	stockList.Sales = 0;
	stockList.Uptime = 0;
	stockList.hourlyProfits = 0;
	stockList.dailyProfits = 0;
	stockList.minCookies = Number.MAX_VALUE;
	stockList.maxCookies = 0;
	stockList.noModActions = true;
	stockList.Amount = 0;
	for (i = 0; i < stockerModeProfits.length; i++)
		for (j = 0; j < stockerModeProfits[i].length; j++)
			for (k = 0; k < stockerModeProfits[i][j].length; k++)
				stockerModeProfits[i][j][k] = 0;
	if (CookiStocker._tickTimeout)   { clearTimeout(CookiStocker._tickTimeout); CookiStocker._tickTimeout = 0; }
	if (CookiStocker._reportTimeout) { clearTimeout(CookiStocker._reportTimeout); CookiStocker._reportTimeout = 0; }
	if (hard) {
		stockerMarketOn = true;
		stockList.origCookiesPsRawHighest = 0;
		Game.Achievements['Plasmic assets'].won = 0;
		Game.Achievements['Bose-Einstein Condensed Assets'].won = 0;
	}
}
