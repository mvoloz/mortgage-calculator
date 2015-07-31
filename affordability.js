//assuming that var app is defined as the app it self.
app.factory('MortageAffordabilityCalculator', function() {

    var defaultValues = {
        maxFrontEndRate: 0.28,
        maxBackEndRate: 0.36,
    };

    var mac = {
        userState: '',
        interestRate: 0,
        income: 0,
        debt: 0,
        termInMonths: 0,
        annualTaxRate: 0,
        hoa: 0,
        insurance: 0,
        debtToIncome: 0,
        payment: 0,
        maxMonthlyPayment: 0,
        calculated: {
            termInYears: 0,
            monthlyIncome: 0,
            monthlyInterestRate: 0,
            monthlyTaxPayment: 0,
            monthlyInsurancePayment: 0,
            monthlyHousingExpenses: 0,
            monthlyTotalExpenses: 0,
            maxFrontEndPayment: 0,
            maxBackEndPayment: 0,
            maxDebtToIncome: 0,
            maxAllowedPayment: 0,
            maxMortgagePayment: 0,
            totalTaxAndInsurance: 0,
            totalPaymentsMade: 0,
            totalInterestPaid: 0,
            maxLoanAmount: 0,
            priceCeiling: 0,
            monthlyPayment: 0,
            totals: {
                combined: 0,
                principal: {
                    total: 0,
                    percent: 0,
                },
                interest: {
                    total: 0,
                    percent: 0,
                },
                tax: {
                    total: 0,
                    percent: 0
                }
            },
            monthlyBudget: {
                left: {
                    total: 0,
                    percent: 0,
                },
                payment: {
                    total: 0,
                    percent: 0,
                },
                debt: {
                    total: 0,
                    percent: 0,
                },
            }
        },
        totalTaxes: 0,
    };
    var Calculated = mac.calculated;

    mac.calculateRange = function(obj) {

        mac.userState = obj.state;
        mac.interestRate = parseFloat(obj.rate) / 100 || 0;
        mac.termInMonths = parseFloat(obj.term.months) || 0;
        mac.income = parseFloat(obj.income) || 0;
        mac.debt = parseFloat(obj.debt) || 0;
        mac.annualTaxRate = parseFloat(obj.tax) || 0;
        mac.debtToIncome = parseFloat(obj.debtToIncome) / 100 || 0;
        mac.insurance = parseFloat(obj.insurance) || 0;
        mac.hoa = parseFloat(obj.hoa) || 0;
        mac.payment = parseFloat(obj.payment) || 0;
        mac.maxMonthlyPayment = parseFloat(obj.maxMonthlyPayment) || 0;

        Calculated.termInYears = annualToMonthly(mac.termInMonths);
        Calculated.monthlyInterestRate = annualToMonthly(mac.interestRate);
        Calculated.monthlyIncome = annualToMonthly(mac.income);
        Calculated.monthlyTaxPayment = annualToMonthly(mac.annualTaxRate);
        Calculated.monthlyInsurancePayment = annualToMonthly(mac.insurance);
        Calculated.monthlyHousingExpenses = calcMonthlyHousingExpenses(Calculated.monthlyInsurancePayment, Calculated.monthlyTaxPayment, mac.hoa);
        Calculated.monthlyTotalExpenses = calcMonthlyTotalExpenses(Calculated.monthlyHousingExpenses, mac.debt);
        Calculated.maxDebtToIncome = calcMaxRatio(Calculated.monthlyIncome, mac.debtToIncome);
        Calculated.maxFrontEndPayment = calcMaxRatio(Calculated.monthlyIncome, defaultValues.maxFrontEndRate);
        Calculated.maxBackEndPayment = calcMaxRatioWithDebt(Calculated.monthlyIncome, mac.debt, defaultValues.maxBackEndRate);
        Calculated.maxDebtToIncome = calcMaxDTIRatio(Calculated.monthlyIncome, mac.debtToIncome);
        Calculated.maxAllowedPayment = calcMaxAllowed(Calculated.maxFrontEndPayment, Calculated.maxBackEndPayment, Calculated.maxDebtToIncome);
        Calculated.maxMortgagePayment = calcMaxMortgagePayment(Calculated.maxAllowedPayment, Calculated.monthlyHousingExpenses);
        Calculated.totalTaxAndInsurance = calculateTaxAndInsurance(mac.annualTaxRate, mac.insurance, Calculated.termInYears);
        Calculated.maxLoanAmount = calcMaxLoanAmount(Calculated.monthlyInterestRate, mac.termInMonths, Calculated.maxMortgagePayment);
        Calculated.maxPermittedPayment = Calculated.maxAllowedPayment;
        Calculated.monthlyPayment = Calculated.maxAllowedPayment;
    };

    mac.calculateDetails = function(monthlyPayment) {
        Calculated.maxMortgagePayment = calcMaxMortgagePayment(monthlyPayment, Calculated.monthlyHousingExpenses);
        Calculated.totalTaxAndInsurance = calculateTaxAndInsurance(mac.annualTaxRate, 
            mac.insurance, Calculated.termInYears);
        Calculated.maxLoanAmount = calcMaxLoanAmount(Calculated.monthlyInterestRate,
            mac.termInMonths, Calculated.maxMortgagePayment);

        Calculated.totalPaymentsMade = calculateTotalPaymentsMade(monthlyPayment, mac.termInMonths);
        Calculated.totalInterestPaid = calculateAmortizedPayments(Calculated.maxLoanAmount,
            Calculated.monthlyInterestRate, mac.termInMonths, Calculated.maxMortgagePayment);

        Calculated.priceCeiling = calculatePriceCeiling(Calculated.maxLoanAmount, mac.payment);
        Calculated.totals = calculateAmortizedTotals(
            Calculated.totalPaymentsMade,
            Calculated.maxLoanAmount,
            Calculated.totalInterestPaid,
            Calculated.totalTaxAndInsurance,
            mac.hoa * mac.termInMonths);

        Calculated.monthlyBudget = calcMonthlyBudget(Calculated.monthlyIncome, monthlyPayment, mac.debt);
        validateTotals();
    };

    function annualToMonthly(annual) {
        return annual / 12;
    }

    function calcMaxRatio(monthlyIncome, ratio) {
        return monthlyIncome * ratio;
    }

    function calcMaxDTIRatio(monthlyIncome, ratio){
        return (monthlyIncome * ratio);
    }
    function calcMaxRatioWithDebt(monthlyIncome, monthlyDebt, ratio) {
        return (monthlyIncome * ratio) - monthlyDebt;
    }

    function calcMonthlyHousingExpenses(insurancePayment, taxPayment, hoaPayment) {
        return insurancePayment + taxPayment + hoaPayment;
    }

    function calcMonthlyTotalExpenses(monthlyHousingExpenses, debt) {
        return monthlyHousingExpenses + debt;
    }

    function calcMaxAllowed(maxFrontEnd, maxBackEnd, maxDebtToIncome) {
        if (maxDebtToIncome > 0) {
            return maxDebtToIncome;
        }
        return Math.min(maxFrontEnd, maxBackEnd);
    }

    function calcMaxMortgagePayment(maxPayment, monthlyHousingExpenses) {
        return maxPayment - monthlyHousingExpenses;
    }

    function calculateTaxAndInsurance(annualTaxRate, annualInsurance, termInYears) {
        return (annualTaxRate + annualInsurance) * termInYears;
    }

    function calculateTotalPaymentsMade(monthlyPayment, termInMonths) {
        return monthlyPayment * termInMonths;
    }

    function calcMaxLoanAmount(monthlyInterestRate, termInMonths, maxMortgagePayment) {
        var _interestExponent = 1 + monthlyInterestRate;
        var _maxLoanAmount = maxMortgagePayment *
            (Math.pow(_interestExponent, termInMonths) - 1) /
            (monthlyInterestRate * Math.pow(_interestExponent, termInMonths));
        return _maxLoanAmount;
    }

    function calculatePriceCeiling(maxLoanAmount, downPayment) {
        return maxLoanAmount + downPayment;
    }

    function calculateAmortizedPayments(maxLoanAmount, monthlyInterestRate, termInMonths, maxMortgagePayment) {
        var _oldBalance = maxLoanAmount;
        var _newBalance = maxLoanAmount;
        var _totalInterestPaid = 0;
        var _owedInterest = 0;
        var _monthly;

        for (var i = 1; i <= termInMonths; i++) {
            _owedInterest = _newBalance * monthlyInterestRate;
            _totalInterestPaid = _totalInterestPaid + _owedInterest;
            if (i < termInMonths) {
                _monthly = maxMortgagePayment - _owedInterest;
                _oldBalance = _newBalance;
                _newBalance = _oldBalance - _monthly;
            } else {
                _monthly = (_oldBalance - _monthly) + _owedInterest;
                _oldBalance = _newBalance;
                _newBalance = 0;
            }
        }
        return _totalInterestPaid;
    }

    function calculateAmortizedTotals(totalPaymentsMade, maxLoanAmount, totalInterestPaid, totalTaxAndInsurance, totalHOA) {
        var distributedPercent;
        var _paymentsMultiplier = 100 / (totalPaymentsMade - totalHOA);
        var _totals = {
            principal: {
                total: maxLoanAmount,
                fullPercent: maxLoanAmount * _paymentsMultiplier,
                percent: Math.round(maxLoanAmount * _paymentsMultiplier),
            },
            interest: {
                total: totalInterestPaid,
                fullPercent: totalInterestPaid * _paymentsMultiplier,
                percent: Math.round(totalInterestPaid * _paymentsMultiplier),
            },
            tax: {
                total: totalTaxAndInsurance,
                fullPercent: totalTaxAndInsurance * _paymentsMultiplier,
                percent: Math.round(totalTaxAndInsurance * _paymentsMultiplier)
            }
        };

        var _totalPercentage = _totals.principal.percent + _totals.interest.percent + _totals.tax.percent;
        if (_totalPercentage > 100) {
            distributedPercent = percentRemainder({
                principal: _totals.principal.fullPercent,
                interest: _totals.interest.fullPercent,
                tax: _totals.tax.fullPercent
            });
            _totals.principal.percent = distributedPercent.principal.value;
            _totals.interest.percent = distributedPercent.interest.value;
            _totals.tax.percent = distributedPercent.tax.value;
        }
        return _totals;
    }

    function calcMonthlyBudget(monthlyIncome, monthlyPayment, monthlyDebt) {
        var distributedPercent;
        var _monthlyBalance = (monthlyIncome - monthlyPayment - monthlyDebt);
        var _incomeMultiplier = 100 / monthlyIncome;
        var _budget = {
            left: {
                total: _monthlyBalance,
                fullPercent: _monthlyBalance * _incomeMultiplier,
                percent: Math.round(_monthlyBalance * _incomeMultiplier),
            },
            payment: {
                total: monthlyPayment,
                fullPercent: monthlyPayment * _incomeMultiplier,
                percent: Math.round(monthlyPayment * _incomeMultiplier),
            },
            debt: {
                total: monthlyDebt,
                fullPercent: monthlyDebt * _incomeMultiplier,
                percent: Math.round(monthlyDebt * _incomeMultiplier)
            }
        };
        var _totalPercentage = _budget.left.percent + _budget.payment.percent + _budget.debt.percent;

        if (_totalPercentage !== 100) {
            distributedPercent = percentRemainder({
                left: _budget.left.fullPercent,
                payment: _budget.payment.fullPercent,
                debt: _budget.debt.fullPercent
            });
            _budget.left.percent = distributedPercent.left.value;
            _budget.payment.percent = distributedPercent.payment.value;
            _budget.debt.percent = distributedPercent.debt.value;
        }
        return _budget;
    }

    function percentRemainder(obj) {
        var remainder = calcRemainder(obj);

        return distributeRemainder(obj, remainder);

        function calcRemainder(obj) {
            var total = 0;
            angular.forEach(obj, function(value, key, obj) {
                total += Math.floor(value);
            });
            return 100 - total;
        }

        function distributeRemainder(obj, remainder) {
            var dict = {};
            var totalsArr = [];
            angular.forEach(obj, function(value, key, obj) {
                var newObj = {};
                newObj.key = key;
                newObj.value = value;
                newObj.decimal = value - Math.floor(value);
                dict[key] = newObj;
                totalsArr.push(newObj);
            });

            var sorted = totalsArr.sort(function(a, b) {
                return a.decimal < b.decimal;
            });
            while (remainder > 0) {
                sorted[0].value++;
                var first = sorted.shift();
                sorted.push(first);
                remainder--;
            }

            angular.forEach(totalsArr, function(value, key, obj) {
                value.value = Math.floor(value.value);
            });
            return dict;

        }


    }

    function calculateZeroPercentOf(percentOf, secondary){
        var _total = percentOf + secondary;
        return Math.round((percentOf / _total ) * 100);
    }
    function validateTotals() {
        var _priceFloor = (Calculated.priceCeiling - mac.payment);
      if ( _priceFloor <= 0) {
          var resetValues = {
              maxMortgagePayment: 0,
              totalTaxAndInsurance: 0,
              maxLoanAmount: 0,
              totalPaymentsMade: 0,
              totalInterestPaid: 0,
              priceCeiling: 0,
              totals: {
                  combined: 0,
                  principal: {
                      total: 0,
                      percent: 0,
                  },
                  interest: {
                      total: 0,
                      percent: 0,
                  },
                  tax: {
                      total: 0,
                      percent: 0
                  }
              },
              monthlyBudget: {
                  left: {
                      total: Calculated.monthlyIncome - mac.debt,
                      percent: calculateZeroPercentOf(Calculated.monthlyIncome, mac.debt),
                  },
                  payment: {
                      total: 0,
                      percent: 0,
                  },
                  debt: {
                      total: mac.debt,
                      percent: calculateZeroPercentOf(mac.debt, Calculated.monthlyIncome),
                  },
              },
          };
          angular.extend(Calculated, resetValues);
          return Calculated;
      }
    }

    return mac;
});
