
function Transaction(date, coins, cost) {
	this.date = date;
	this.coins = Number(coins.replace(/[^\d.-]/g,''));
	this.cost = Number(cost.replace(/[^\d.-]/g,''));
	this.perCoin = 1.0 * this.cost / this.coins;
}

Transaction.prototype.toString = function () {
	return this.date + ": " + this.coins + " coins for " + this.cost;
}

function calculateGainsAndLosses() {

	clearErrorAndOutput();

	var transactions = document.forms[0].elements['capital-gains-and-losses-input'].value.trim().split("\n");

	var held = [];
	var sold = [];
	
	for (var i = 0; i < transactions.length; i++) {
		var attr = transactions[i].split(/\s+/g);
		var transaction = new Transaction(attr[0], attr[1], attr[2].replace('$','').replace(',',''));

		// buy or incoming gift
		if (transaction.cost > 0 || (transaction.cost == 0 && transaction.coins > 0)) {
			held.push(transaction);
		} else { // sale or outgoing gift
			sold.push(transaction);
		}

	}

	held.sort(compareByDate);
	sold.sort(compareByDate);

	var gains = {};

	for (var i = 0; i < sold.length; i++) {
		var currentSale = sold[i];
		currentSale.coins = -currentSale.coins;
		currentSale.cost = -currentSale.cost;

		if (held.length <= 0) {
			writeError("Stop trying to sell coins you don't have.");
		}

		while (currentSale.coins > 0) {
			if (! (currentSale.date.substring(0,4) in gains)) {
				gains[currentSale.date.substring(0,4)] = 0;
			}
			if (currentSale.coins <= held[0].coins) {
				var heldCost = (held[0].perCoin * currentSale.coins);
				held[0].coins -= currentSale.coins;
				held[0].cost -= heldCost;

				gains[currentSale.date.substring(0,4)] += (currentSale.cost - heldCost);

				currentSale.coins = 0;
			} else { 
				var soldRevenue = (currentSale.perCoin * held[0].coins);
				currentSale.coins -= held[0].coins;
				currentSale.cost -= soldRevenue;
				
				gains[currentSale.date.substring(0,4)] += (soldRevenue - held[0].cost);

				held.shift();
			}
		}
	}

	writeOutput(gains);


}

function compareByDate(a, b) {
	return a.date.localeCompare(b.date);
}

function clearErrorAndOutput() {
	document.getElementById("capital-gains-and-losses-error").innerHTML = '';
	document.getElementById("capital-gains-and-losses-output").innerHTML = '';
}

function writeError(error) {
    document.getElementById("capital-gains-and-losses-error").innerHTML = error;
}
function writeOutput(gains) {
	var startTable ="<table><tr><td><strong>Year</strong></td><td><strong>Gains</strong></td></tr>";
	var row = '';

	for (year in gains) {
		row += "<tr><td>"+year+"</td><td>"+ Math.round( gains[year] * 100 ) / 100+"</td></tr>\n";
	}
	
	var endTable="</table>";

    document.getElementById("capital-gains-and-losses-output").innerHTML = startTable + row + endTable;
}