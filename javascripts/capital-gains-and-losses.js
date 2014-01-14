
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
		var attr = transactions[i].split(",");
		var transaction = new Transaction(attr[0], attr[1], attr[2]);

		// buy or incoming gift
		if (transaction.cost > 0 || (transaction.cost == 0 && transaction.coins > 0)) {
			held.push(transaction);
		} else { // sale or outgoing gift
			sold.push(transaction);
		}

	}

	var gains = 0;

	for (var i = 0; i < sold.length; i++) {
		var currentSale = sold[i];
		currentSale.coins = -currentSale.coins;
		currentSale.cost = -currentSale.cost;

		if (held.length <= 0) {
			writeError("Stop trying to sell coins you don't have.");
		}

		while (currentSale.coins > 0) {
			if (currentSale.coins <= held[0].coins) {
				var heldCost = (held[0].perCoin * currentSale.coins);
				held[0].coins -= currentSale.coins;
				held[0].cost -= heldCost;

				gains += (currentSale.cost - heldCost)

				currentSale.coins = 0;
			} else { 
				var soldRevenue = (currentSale.perCoin * held[0].coins);
				currentSale.coins -= held[0].coins;
				currentSale.cost -= soldRevenue;
				
				gains += (soldRevenue - held[0].cost);

				held.shift();
			}
		}
	}

	roundedGains = Math.round( gains * 100 ) / 100
	writeOutput(roundedGains);


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
function writeOutput(output) {
	var startTable ="<table><tr><td><strong>Year</strong></td><td><strong>Short term</strong></td><td><strong>Long term</strong></th></tr>";
	var row = "<tr><td>2013</td><td>"+output+"</td><td>"+output+"</th></tr>";
	var endTable="</table>";

    document.getElementById("capital-gains-and-losses-output").innerHTML = startTable + row + endTable;
}