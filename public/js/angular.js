let app = angular.module('app', []);
app.controller('ctrl', function($scope) {
	$scope.prices = {
		tf2SellPrice: tf2SellPrice,
		vgoSellPrice: vgoSellPrice,
		tf2BuyPrice: tf2BuyPrice,
		vgoBuyPrice: vgoBuyPrice
	};
  socket.on('clearAmountInputs', function() {
		$scope.tf2SellAmount = null;
		$scope.vgoSellAmount = null;
		$scope.tf2BuyAmount = null;
		$scope.vgoBuyAmount = null;
		M.updateTextFields();
		$scope.$apply();
	});
});