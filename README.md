Mortgage Calculator
====================
AngularJS Factory for calculating mortgage affordability.

###Setup

The factory doesn't have any outside dependencies.
Was originally built to work with rangeSlider directive.

**Make sure that the file is loaded on your index.html**

```
<script type="text/javascript" src="path_to_factory/affordability.js"></script>`
```

**Include it in the controller**

```
App.controller('SomeController', ['$scope', 'MortageAffordabilityCalculator', function($scope, MortageAffordabilityCalculator) {

  $scope.calculator = MortageAffordabilityCalculator;

}])

```
#### Required Fields

The minimum required fields for calculator to work are:
  * Term in Months
  * APR/Interest rate
  * Gross annual income

The rest are optional and give a much more accurate result

Declare a model object in order to pass the parameters to the factor,
```
$scope.someModel = {
  termInMonths: 360,
  interestRate: 5,
  income: 50000
}
```
Factory takes a single object argument and splits it up internally.

```
$scope.calculator.calculateAffordability($scope.someModel)

$scope.calculateAffordability = function(){
  $scope.calculator.calculateRange($scope.someModel);
  $scope.calculator.calculateDetails($scope.calculator.calculated.monthlyPayment);
}
```

**Mark Up**
```
<form>
  <input type="text" ng-model="someModel.termInMonths" />
  <input type="text" ng-model="someModel.interestRate" />
  <input type="text" ng-model="someModel.income" />
  <button ng-click="calculateAffordability()"></button>
</form>


<div>
  <h4>Maximum you can afford</h4>
  <span>{{calculator.calculated.priceCeiling}}</span>
</div>
<div>
  <h4>Monthly Payment</h4>
  <span>{{calculator.calculated.monthlyPayment}}</span>
</div>
```


###TO DO

* Fix README
* Package as a module
