
function Transaction(date, coins, cost, mined) {
	this.date = date;
	this.datetime = new Date(date.replace('_', ' '))
	this.coins = Number(coins.replace(/[^\d.-]/g,''));
	this.cost = Number(cost.replace(/[^\d.-]/g,''));
	this.perCoin = 1.0 * this.cost / this.coins;
	this.mined = !!mined;
}

Transaction.prototype.toString = function () {
	return this.date + ": " + this.coins + " coins for " + this.cost;
}

function calculateGainsAndLosses() {

	clearErrorAndOutput();

	var transactions = document.forms[0].elements['capital-gains-and-losses-input'].value.trim().split("\n");

	var held = [];
	var sold = [];
	var mined = [];
	
	for (var i = 0; i < transactions.length; i++) {
		var attr = transactions[i].split(/\s+/g);
		var transaction = new Transaction(attr[0], attr[1], attr[2].replace('$','').replace(',',''), attr.length > 3 ? attr[3] : null);

		if(transaction.mined) 
			mined.push(transaction); 

		// buy or incoming gift or mined
		if (transaction.cost > 0 || (transaction.cost == 0 && transaction.coins > 0)) {
			held.push(transaction);
		} else { // sale or outgoing gift
			sold.push(transaction);
		}

	}

	held.sort(compareByDate);
	sold.sort(compareByDate);

	var gains = {longterm: {}, shortterm: {}};
	var f8949_items = [];

	// Calculate gains from selling coin
	for (var i = 0; i < sold.length; i++) {
		var currentSale = sold[i];
		currentSale.coins = -currentSale.coins;
		currentSale.cost = -currentSale.cost;

		if (held.length <= 0) {
			writeError("Stop trying to sell coins you don't have.");
		}

		// might need to draw from multiple "held" accounts to account for the current sale 
		// for calculating basis
		while (currentSale.coins > 0) {
			var currentHold = held[0], year = currentSale.date.substring(0,4);
			var soldRevenue, heldCost, transactedCoins = Math.min(currentSale.coins, currentHold.coins);

			// A short term gain if sold within a year; otherwise long term capital gain
			short_term =  currentSale.datetime.getTime() - currentHold.datetime.getTime() < 365 * 24 * 60 * 60 * 1000

			gain_type = short_term ? 'shortterm' : 'longterm'
			if (! (year in gains[gain_type])) {
				gains[gain_type][year] = 0;
			}

			// if the remainder of this sale can be handled by the current held amount
			if (currentSale.coins <= currentHold.coins) {
				heldCost = (currentHold.perCoin * currentSale.coins);
				soldRevenue = currentSale.cost

				currentHold.coins -= currentSale.coins;
				currentHold.cost -= heldCost;

				currentSale.coins = 0;

			// if the sale cannot be completely handled by the current held amount. 
			// we'll partially handle the sale and move onto the next held amount
			} else { 
				soldRevenue = (currentSale.perCoin * currentHold.coins);
				heldCost = currentHold.cost
				currentSale.coins -= currentHold.coins;
				currentSale.cost -= soldRevenue;
				
				held.shift();
			}

			gain = soldRevenue - heldCost;
			gains[gain_type][year] += gain;

			// for 8949 reporting
			// each line requires:
			// description | date acquired | date sold | proceeds | cost/basis | adjustments (N/A) | gain / loss
			f8949_items.push([transactedCoins.toFixed(5) + " bitcoin", currentHold.date, currentSale.date, outputAsCurrency(soldRevenue), outputAsCurrency(heldCost), outputAsCurrency(gain)]);

		}
	}

	// calculate gains from mining coin
	for (idx in mined) {
		transaction = mined[idx]
		year = transaction.date.substring(0,4)
		if (! (year in gains.shortterm)) {
			gains.shortterm[year] = 0;
		}
		gains.shortterm[year] += transaction.cost
	}

	writeOutput(gains, f8949_items);


}

function compareByDate(a, b) {
	return a.date.localeCompare(b.date);
}

function clearErrorAndOutput() {
	document.getElementById("capital-gains-and-losses-error").innerHTML = '';
	document.getElementById("capital-gains-and-losses-output").innerHTML = '';
	document.getElementById("capital-gains-and-losses-output-8949").innerHTML = '';	
}

function writeError(error) {
    document.getElementById("capital-gains-and-losses-error").innerHTML = error;
}
function outputAsCurrency(amt) { 
  return '$' + amt.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function writeOutput(gains, f8949_items) {
	var startTable ="<table><tr><td><strong>Year</strong></td><td><strong>Short-term Gains</strong></td><td><strong>Long-term Gains</strong></td></tr>";
	var row = '';

	years_set = new Set(Object.keys(gains.shortterm).concat(Object.keys(gains.longterm)))
	years = []
	for (year of years_set) years.push(year)
	years.sort()

	for (year of years) {
		shortterm = (year in gains.shortterm) ? gains.shortterm[year] * 100 : 0
		longterm = (year in gains.longterm) ? gains.longterm[year] * 100 : 0
		row += "<tr><td>"+year+"</td><td>"+ Math.round( shortterm ) / 100+"</td><td>"+ Math.round( longterm ) / 100+"</td></tr>\n";
	}
	
	var endTable="</table>";

  document.getElementById("capital-gains-and-losses-output").innerHTML = startTable + row + endTable;


  var input = document.querySelector('input[name="8949_output"]');
	if (input.checked) {
		header = "<div><strong>Itemized transactions for Form 8949</strong></div>"
		startTable ="<table><tr><td><strong>Description</strong></td><td><strong>acquired</strong></td><td><strong>sold</strong></td><td><strong>proceeds</strong></td><td><strong>cost/basis</strong></td><td><strong>gains/losses</strong></td></tr>";
		row = '';


		f8949_items.forEach(function(transaction, idx){
			row += "<tr>";
			transaction.forEach(function(cell, idx){
				row += "<td style='text-align:right'>" + cell + "</td>";
			});
			row += "</tr>";
		});
  	document.getElementById("capital-gains-and-losses-output-8949").innerHTML = header + startTable + row + endTable;

	}

}