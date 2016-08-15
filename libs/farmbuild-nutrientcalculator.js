"use strict";

angular.module("farmbuild.nutrientCalculator", [ "farmbuild.core", "farmbuild.farmdata" ]).factory("nutrientCalculator", function(milkSold, cowsPurchased, cowsCulled, cows, foragesPurchased, fertilizersPurchased, concentratesPurchased, legumes, nutrientCalculatorSession, farmdata, validations, nutrientAggregator, nutrientBalance, nutrientEfficiency, feedBalance, milkProduction, stockingRate, googleAnalyticsCalculator, $log) {
    var nutrientCalculator = {
        farmdata: farmdata
    }, _isPositiveNumber = validations.isPositiveNumber, _isDefined = validations.isDefined;
    nutrientCalculator.milkSold = milkSold;
    nutrientCalculator.cowsPurchased = cowsPurchased;
    nutrientCalculator.cowsCulled = cowsCulled;
    nutrientCalculator.foragesPurchased = foragesPurchased;
    nutrientCalculator.fertilizersPurchased = fertilizersPurchased;
    nutrientCalculator.concentratesPurchased = concentratesPurchased;
    nutrientCalculator.legumes = legumes;
    nutrientCalculator.aggregator = nutrientAggregator;
    nutrientCalculator.balance = nutrientBalance;
    nutrientCalculator.efficiency = nutrientEfficiency;
    nutrientCalculator.version = "0.1.0";
    nutrientCalculator.ga = googleAnalyticsCalculator;
    nutrientCalculator.session = nutrientCalculatorSession;
    $log.info("Welcome to Farm Dairy Nutrient Calculator... ");
    function createDefault() {
        return {
            summary: {
                milkingAreaInHa: 0,
                averageCowWeightInKg: 0,
                numberOfMilkingCows: 0,
                numberOfMilkingDays: 365
            },
            milkSold: milkSold.createDefault(),
            cowsCulled: cows.createDefault(),
            cowsPurchased: cows.createDefault(),
            fertilizersPurchased: fertilizersPurchased.createDefault(),
            foragesPurchased: foragesPurchased.createDefault(),
            legumes: {
                dryMatterConsumedPerHaInKg: 0
            },
            concentratesPurchased: concentratesPurchased.createDefault(),
            balance: {},
            efficiency: {},
            stockingRate: {},
            milkProduction: {},
            feedBalance: {}
        };
    }
    nutrientCalculator.find = function() {
        return nutrientCalculatorSession.find();
    };
    nutrientCalculator.load = function(farmData) {
        var loaded = farmdata.load(farmData);
        if (!_isDefined(loaded)) {
            return undefined;
        }
        if (!loaded.hasOwnProperty("nutrientCalculator")) {
            loaded.nutrientCalculator = createDefault();
            loaded = farmdata.update(loaded);
        }
        return loaded;
    };
    nutrientCalculator.calculate = function(farmData) {
        var nutrientValues = nutrientAggregator.calculate(farmData), milkingArea = farmData.nutrientCalculator.summary.milkingAreaInHa;
        farmData.nutrientCalculator.balance = nutrientBalance.calculate(nutrientValues, milkingArea);
        farmData.nutrientCalculator.efficiency = nutrientEfficiency.calculate(nutrientValues);
        farmData.nutrientCalculator.feedBalance = feedBalance.calculate(farmData.nutrientCalculator);
        farmData.nutrientCalculator.milkProduction = milkProduction.calculate(farmData.nutrientCalculator);
        farmData.nutrientCalculator.stockingRate = stockingRate.calculate(farmData.nutrientCalculator, farmData.area);
        return farmdata.update(farmData);
    };
    nutrientCalculator.export = nutrientCalculatorSession.export;
    if (typeof window.farmbuild === "undefined") {
        window.farmbuild = {
            nutrientcalculator: nutrientCalculator
        };
    } else {
        window.farmbuild.nutrientcalculator = nutrientCalculator;
    }
    return nutrientCalculator;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("concentrateCalculator", function(nutrientMediumCalculator, nutrientMediumValidator, concentrateDefaults, concentrateTypes, $log) {
    var calculator = {}, validator = nutrientMediumValidator;
    function createResult(total) {
        return {
            concentrates: total.incomings,
            weight: total.weight,
            dryMatterWeight: total.dryMatterWeight,
            nitrogenInKg: total.nitrogenInKg,
            nitrogenPercentage: 0,
            phosphorusInKg: total.phosphorusInKg,
            phosphorusPercentage: 0,
            potassiumInKg: total.potassiumInKg,
            potassiumPercentage: 0,
            sulphurInKg: total.sulphurInKg,
            sulphurPercentage: 0,
            metabolisableEnergyInMJ: 0,
            metabolisableEnergyInMJPerKg: 0
        };
    }
    function _calculatePercentage(nutrientWeight, totalWeight) {
        return nutrientWeight / totalWeight * 100;
    }
    function _calculatePercentages(total) {
        var result = createResult(total);
        result.nitrogenPercentage = _calculatePercentage(total.nitrogenInKg, total.dryMatterWeight);
        result.phosphorusPercentage = _calculatePercentage(total.phosphorusInKg, total.dryMatterWeight);
        result.potassiumPercentage = _calculatePercentage(total.potassiumInKg, total.dryMatterWeight);
        result.sulphurPercentage = _calculatePercentage(total.sulphurInKg, total.dryMatterWeight);
        result.metabolisableEnergyInMJ = total.metabolisableEnergyInMJ;
        result.metabolisableEnergyInMJPerKg = total.metabolisableEnergyInMJPerKg;
        return result;
    }
    function _createTotal() {
        return {
            weight: 0,
            dryMatterWeight: 0,
            nitrogenInKg: 0,
            phosphorusInKg: 0,
            potassiumInKg: 0,
            sulphurInKg: 0,
            metabolisableEnergyInMJ: 0,
            metabolisableEnergyInMJPerKg: 0,
            incomings: []
        };
    }
    function _calculateNutrientWeight(weight, percentage) {
        return weight * percentage / 100;
    }
    function calculateDryMatterWeight(weight, dryMatterPercentage, isDry) {
        return isDry ? weight : _calculateNutrientWeight(weight, dryMatterPercentage);
    }
    calculator.calculateDryMatterWeight = calculateDryMatterWeight;
    function updateTotal(concentrate, total) {
        var type = concentrate.type, weight = concentrate.weight, dryMatterWeight = calculateDryMatterWeight(weight, type.dryMatterPercentage, concentrate.isDry);
        total.weight += weight;
        total.dryMatterWeight += dryMatterWeight;
        total.nitrogenInKg += _calculateNutrientWeight(dryMatterWeight, type.nitrogenPercentage);
        total.phosphorusInKg += _calculateNutrientWeight(dryMatterWeight, type.phosphorusPercentage);
        total.potassiumInKg += _calculateNutrientWeight(dryMatterWeight, type.potassiumPercentage);
        total.sulphurInKg += _calculateNutrientWeight(dryMatterWeight, type.sulphurPercentage);
        total.metabolisableEnergyInMJ += dryMatterWeight * type.metabolisableEnergyInMJPerKg;
        total.metabolisableEnergyInMJPerKg = type.metabolisableEnergyInMJPerKg;
        total.incomings.push({
            type: concentrate.type,
            weight: concentrate.weight,
            isDry: concentrate.isDry
        });
        return total;
    }
    function calculateAll(concentrates) {
        $log.info("calculator.calculateAll...");
        var i = 0, total = _createTotal();
        for (i; i < concentrates.length; i++) {
            var concentrate = concentrates[i];
            if (!validator.validate(concentrate)) {
                $log.error("calculator.calculateAll invalid concentrate at %s: %j", i, concentrate);
                return undefined;
            }
            total = updateTotal(concentrate, total);
        }
        return total;
    }
    calculator.calculate = function(concentrates) {
        var itemsTotal = calculateAll(concentrates);
        return _calculatePercentages(itemsTotal);
    };
    return calculator;
});

angular.module("farmbuild.nutrientCalculator").constant("concentrateDefaults", {
    types: [ {
        name: "Average concentrate",
        nitrogenPercentage: 3.88,
        phosphorusPercentage: .64,
        potassiumPercentage: .74,
        sulphurPercentage: .32,
        dryMatterPercentage: 76,
        metabolisableEnergyInMJPerKg: 12.62
    }, {
        name: "Average grain",
        nitrogenPercentage: 2.42,
        phosphorusPercentage: .52,
        potassiumPercentage: 1.29,
        sulphurPercentage: .23,
        dryMatterPercentage: 66.94,
        metabolisableEnergyInMJPerKg: 11.78
    }, {
        name: "Barley grain",
        nitrogenPercentage: 2.05,
        phosphorusPercentage: .37,
        potassiumPercentage: .54,
        sulphurPercentage: .15,
        dryMatterPercentage: 89.75,
        metabolisableEnergyInMJPerKg: 12.33
    }, {
        name: "Bread",
        nitrogenPercentage: 2.74,
        phosphorusPercentage: .28,
        potassiumPercentage: .31,
        sulphurPercentage: .17,
        dryMatterPercentage: 52.64,
        metabolisableEnergyInMJPerKg: 13.19
    }, {
        name: "Brewers grain",
        nitrogenPercentage: 4.33,
        phosphorusPercentage: .75,
        potassiumPercentage: .75,
        sulphurPercentage: .27,
        dryMatterPercentage: 71.57,
        metabolisableEnergyInMJPerKg: 11.72
    }, {
        name: "Canola meal",
        nitrogenPercentage: 6.39,
        phosphorusPercentage: 1.16,
        potassiumPercentage: 1.37,
        sulphurPercentage: .68,
        dryMatterPercentage: 90.03,
        metabolisableEnergyInMJPerKg: 13.25
    }, {
        name: "Citrus pulp",
        nitrogenPercentage: 1.38,
        phosphorusPercentage: .23,
        potassiumPercentage: 1.19,
        sulphurPercentage: .1,
        dryMatterPercentage: 15.83,
        metabolisableEnergyInMJPerKg: 10.06
    }, {
        name: "Corn grain",
        nitrogenPercentage: 1.62,
        phosphorusPercentage: .33,
        potassiumPercentage: .37,
        sulphurPercentage: .14,
        dryMatterPercentage: 90.78,
        metabolisableEnergyInMJPerKg: 12.87
    }, {
        name: "Cotton seed meal",
        nitrogenPercentage: 4.36,
        phosphorusPercentage: 1.25,
        potassiumPercentage: 1.54,
        sulphurPercentage: .48,
        dryMatterPercentage: 88.52,
        metabolisableEnergyInMJPerKg: 11.44
    }, {
        name: "Fruit",
        nitrogenPercentage: 2.74,
        phosphorusPercentage: .5,
        potassiumPercentage: 3.66,
        sulphurPercentage: .21,
        dryMatterPercentage: 3.85,
        metabolisableEnergyInMJPerKg: 11.6
    }, {
        name: "Linseed meal",
        nitrogenPercentage: .15,
        phosphorusPercentage: .54,
        potassiumPercentage: .85,
        sulphurPercentage: .29,
        dryMatterPercentage: 90.97,
        metabolisableEnergyInMJPerKg: 10.75
    }, {
        name: "Lupins grain",
        nitrogenPercentage: 4.08,
        phosphorusPercentage: .36,
        potassiumPercentage: .77,
        sulphurPercentage: .18,
        dryMatterPercentage: 89.49,
        metabolisableEnergyInMJPerKg: 13.26
    }, {
        name: "Mixed grain",
        nitrogenPercentage: 2.63,
        phosphorusPercentage: .43,
        potassiumPercentage: .66,
        sulphurPercentage: .19,
        dryMatterPercentage: 89.14,
        metabolisableEnergyInMJPerKg: 12.46
    }, {
        name: "Molasses",
        nitrogenPercentage: .64,
        phosphorusPercentage: .23,
        potassiumPercentage: 4.68,
        sulphurPercentage: .5,
        dryMatterPercentage: 72,
        metabolisableEnergyInMJPerKg: 12.7
    }, {
        name: "Palm kernels",
        nitrogenPercentage: 2.63,
        phosphorusPercentage: .61,
        potassiumPercentage: .67,
        sulphurPercentage: .2,
        dryMatterPercentage: 87.66,
        metabolisableEnergyInMJPerKg: 8.17
    }, {
        name: "Pea pollard",
        nitrogenPercentage: 2.11,
        phosphorusPercentage: .25,
        potassiumPercentage: .96,
        sulphurPercentage: .1,
        dryMatterPercentage: 89.9,
        metabolisableEnergyInMJPerKg: 9.87
    }, {
        name: "Pellets Calf",
        nitrogenPercentage: 3.14,
        phosphorusPercentage: .67,
        potassiumPercentage: .84,
        sulphurPercentage: .28,
        dryMatterPercentage: 88.78,
        metabolisableEnergyInMJPerKg: 12.72
    }, {
        name: "Pellets Dairy",
        nitrogenPercentage: 2.37,
        phosphorusPercentage: .72,
        potassiumPercentage: .7,
        sulphurPercentage: .24,
        dryMatterPercentage: 89.64,
        metabolisableEnergyInMJPerKg: 12.54
    }, {
        name: "Pellets Springer",
        nitrogenPercentage: 2.5,
        phosphorusPercentage: .57,
        potassiumPercentage: .59,
        sulphurPercentage: 1.06,
        dryMatterPercentage: 86.67,
        metabolisableEnergyInMJPerKg: 12.62
    }, {
        name: "Pellets Weaner",
        nitrogenPercentage: 2.73,
        phosphorusPercentage: .74,
        potassiumPercentage: .79,
        sulphurPercentage: .5,
        dryMatterPercentage: 88.83,
        metabolisableEnergyInMJPerKg: 13.1
    }, {
        name: "Safflower grain",
        nitrogenPercentage: 2.69,
        phosphorusPercentage: .47,
        potassiumPercentage: .69,
        sulphurPercentage: .15,
        dryMatterPercentage: 90.85,
        metabolisableEnergyInMJPerKg: 9
    }, {
        name: "Soybean meal",
        nitrogenPercentage: 7.56,
        phosphorusPercentage: .75,
        potassiumPercentage: 2.32,
        sulphurPercentage: .38,
        dryMatterPercentage: 92.51,
        metabolisableEnergyInMJPerKg: 14.65
    }, {
        name: "Sugar by product",
        nitrogenPercentage: 2.62,
        phosphorusPercentage: .27,
        potassiumPercentage: 2.28,
        sulphurPercentage: .54,
        dryMatterPercentage: 68.04,
        metabolisableEnergyInMJPerKg: 13.04
    }, {
        name: "Triticale grain",
        nitrogenPercentage: 2.05,
        phosphorusPercentage: .29,
        potassiumPercentage: .45,
        sulphurPercentage: .16,
        dryMatterPercentage: 90.68,
        metabolisableEnergyInMJPerKg: 12.66
    }, {
        name: "Wheat grain",
        nitrogenPercentage: 2.25,
        phosphorusPercentage: .36,
        potassiumPercentage: .46,
        sulphurPercentage: .16,
        dryMatterPercentage: 90.04,
        metabolisableEnergyInMJPerKg: 12.82
    } ]
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("concentratesPurchased", function(validations, nutrientMedium, concentrateDefaults, concentrateTypes, nutrientMediumValidator, concentrateCalculator, collections, nutrientCalculatorSession, $log) {
    var concentratesPurchased = {
        types: concentrateTypes,
        calculator: concentrateCalculator
    }, _concentrates = [], calculator = concentrateCalculator, validator = nutrientMediumValidator;
    function createDefault() {
        return {
            types: concentrateTypes.toArray(),
            concentrates: [],
            dryMatterWeight: 0
        };
    }
    concentratesPurchased.createDefault = createDefault;
    function _removeAt(index) {
        $log.info("removing concentrate at index " + index);
        nutrientMedium.removeAt(_concentrates, index);
        return concentratesPurchased;
    }
    concentratesPurchased.removeAt = _removeAt;
    concentratesPurchased.concentrates = function() {
        return _concentrates;
    };
    function validateNew(type, weight, isDry) {
        var concentrate = nutrientMedium.create(type, weight, isDry);
        return validator.validate(concentrate);
    }
    concentratesPurchased.validateNew = validateNew;
    concentratesPurchased.validateAll = validator.validateAll;
    function _add(type, weight, isDry) {
        _concentrates = nutrientMedium.add(_concentrates, type, weight, isDry);
        return concentratesPurchased;
    }
    concentratesPurchased.add = _add;
    concentratesPurchased.asArray = function() {
        return _concentrates;
    };
    concentratesPurchased.calculate = function(concentrates) {
        $log.info("concentratesPurchased.calculate...");
        if (!validator.validateAll(concentrates)) {
            $log.error("concentratesPurchased.calculate invalid concentrates, see the error above and fix based on API...");
            return undefined;
        }
        var result = calculator.calculate(concentrates);
        result.types = concentrateTypes.toArray();
        nutrientCalculatorSession.saveSection("concentratesPurchased", result);
        return result;
    };
    concentratesPurchased.load = function(concentratesPurchasedSection) {
        if (!validator.validateAll(concentratesPurchasedSection.concentrates)) {
            return undefined;
        }
        _concentrates = concentratesPurchasedSection.concentrates;
        concentrateTypes.load(concentratesPurchasedSection);
        return concentratesPurchased;
    };
    return concentratesPurchased;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("concentrateTypes", function(collections, validations, nutrientMediumTypes, concentrateDefaults, $log) {
    var concentrateTypes, _types = angular.copy(concentrateDefaults.types), _validate = nutrientMediumTypes.validate;
    function _add(name, dryMatterPercentage, sulphurPercentage, potassiumPercentage, phosphorusPercentage, nitrogenPercentage, metabolisableEnergyInMJPerKg) {
        return nutrientMediumTypes.add(_types, name, dryMatterPercentage, sulphurPercentage, potassiumPercentage, phosphorusPercentage, nitrogenPercentage, metabolisableEnergyInMJPerKg);
    }
    concentrateTypes = {
        add: _add,
        at: function(index) {
            return collections.at(_types, index);
        },
        size: function() {
            return collections.size(_types);
        },
        byName: function(name) {
            return collections.byProperty(_types, "name", name);
        },
        defaultTypes: function() {
            return angular.copy(concentrateDefaults.types);
        },
        toArray: function() {
            return angular.copy(_types);
        },
        removeAt: function(index) {
            return collections.removeAt(_types, index);
        },
        last: function() {
            return collections.last(_types);
        },
        validate: _validate,
        load: function(concentratesPurchasedSection) {
            _types = concentratesPurchasedSection.types;
        }
    };
    return concentrateTypes;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("cowsCulled", function(validations, cowTypeDefaults, cowValidator, cowTypes, cows, nutrientCalculatorSession) {
    var cowsCulled = {}, _isPositiveNumber = validations.isPositiveNumber, _isAlphanumeric = validations.isAlphanumeric, _types = angular.copy(cowTypeDefaults), _cows = [], validator = cowValidator;
    cowsCulled.validateNew = cows.validateNew;
    cowsCulled.calculate = function(cows) {
        var numberOfCows = 0, weight = 0, nitrogenInKg = 0, phosphorusInKg = 0, potassiumInKg = 0, sulphurInKg = 0, nitrogenPercentage = 2.8, phosphorusPercentage = .72, potassiumPercentage = .2, sulphurPercentage = .8, incomings = [], i = 0;
        if (!cows || cows.length === 0) {
            return undefined;
        }
        for (i; i < cows.length; i++) {
            var cowWeight, cowCount, cow = cows[i];
            if (!cow.name || !cow.weight) {
                return undefined;
            }
            cowWeight = cow.weight;
            cowCount = cow.numberOfCows;
            if (!_isPositiveNumber(cowCount)) {
                return undefined;
            }
            weight += cowWeight * cowCount;
            numberOfCows += cowCount;
            nitrogenInKg += nitrogenPercentage * cowWeight * cowCount / 100;
            phosphorusInKg += phosphorusPercentage * cowWeight * cowCount / 100;
            potassiumInKg += potassiumPercentage * cowWeight * cowCount / 100;
            sulphurInKg += sulphurPercentage * cowWeight * cowCount / 100;
            incomings.push({
                name: cow.name,
                numberOfCows: cowCount,
                weight: cow.weight
            });
        }
        var result = {
            cows: incomings,
            numberOfCows: numberOfCows,
            weight: weight,
            nitrogenInKg: nitrogenInKg,
            phosphorusInKg: phosphorusInKg,
            potassiumInKg: potassiumInKg,
            sulphurInKg: sulphurInKg
        };
        result.types = _types;
        nutrientCalculatorSession.saveSection("cowsCulled", result);
        return result;
    };
    cowsCulled.addType = function(name, weight) {
        if (!_isPositiveNumber(weight)) {
            return undefined;
        }
        if (!name || !_isAlphanumeric(name)) {
            return undefined;
        }
        weight = parseFloat(weight);
        _types.push({
            name: name,
            weight: weight
        });
        return cowsCulled;
    };
    cowsCulled.removeTypeByName = function(name) {
        if (!name) {
            return undefined;
        }
        angular.forEach(_types, function(type, i) {
            if (type.name === name) {
                _types.splice(i, 1);
            }
        });
        return _types;
    };
    cowsCulled.removeTypeByIndex = function(index) {
        if (!index || index < 0 || index > _types.length - 1) {
            return undefined;
        }
        _types.splice(index, 1);
        return _types;
    };
    cowsCulled.types = function() {
        return _types;
    };
    cowsCulled.validateType = function(type) {
        return cowTypes.validate(type);
    };
    cowsCulled.cows = function() {
        return _cows;
    };
    cowsCulled.load = function(cowsCulledSection) {
        if (!validator.validateAll(cowsCulledSection.cows)) {
            return undefined;
        }
        _cows = cowsCulledSection.cows;
        _types = cowsCulledSection.types;
        return cowsCulled;
    };
    return cowsCulled;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("cowsPurchased", function(validations, cowTypeDefaults, cowValidator, cowTypes, cows, nutrientCalculatorSession) {
    var cowsPurchased = {}, _isPositiveNumber = validations.isPositiveNumber, _isAlphanumeric = validations.isAlphanumeric, _isDefined = validations.isDefined, _types = angular.copy(cowTypeDefaults), _cows = [], validator = cowValidator;
    cowsPurchased.validateNew = cows.validateNew;
    cowsPurchased.calculate = function(cows) {
        var numberOfCows = 0, weight = 0, nitrogenInKg = 0, phosphorusInKg = 0, potassiumInKg = 0, sulphurInKg = 0, nitrogenPercentage = 2.8, phosphorusPercentage = .72, potassiumPercentage = .2, sulphurPercentage = .8, incomings = [], i = 0;
        if (!cows || cows.length === 0) {
            return undefined;
        }
        for (i; i < cows.length; i++) {
            var cowWeight, cowCount, cow = cows[i];
            if (!cow.name || !cow.weight) {
                return undefined;
            }
            cowWeight = cow.weight;
            cowCount = cow.numberOfCows;
            if (!_isPositiveNumber(cowCount)) {
                return undefined;
            }
            weight += cowWeight * cowCount;
            numberOfCows += cowCount;
            nitrogenInKg += nitrogenPercentage * cowWeight * cowCount / 100;
            phosphorusInKg += phosphorusPercentage * cowWeight * cowCount / 100;
            potassiumInKg += potassiumPercentage * cowWeight * cowCount / 100;
            sulphurInKg += sulphurPercentage * cowWeight * cowCount / 100;
            incomings.push({
                name: cow.name,
                numberOfCows: cowCount,
                weight: cow.weight
            });
        }
        var result = {
            cows: incomings,
            numberOfCows: numberOfCows,
            weight: weight,
            nitrogenInKg: nitrogenInKg,
            phosphorusInKg: phosphorusInKg,
            potassiumInKg: potassiumInKg,
            sulphurInKg: sulphurInKg
        };
        result.types = _types;
        nutrientCalculatorSession.saveSection("cowsPurchased", result);
        return result;
    };
    cowsPurchased.addType = function(name, weight) {
        if (!_isPositiveNumber(weight)) {
            return undefined;
        }
        if (!name || !_isAlphanumeric(name)) {
            return undefined;
        }
        weight = parseFloat(weight);
        _types.push({
            name: name,
            weight: weight
        });
        return cowsPurchased;
    };
    cowsPurchased.removeTypeByName = function(name) {
        if (!name) {
            return undefined;
        }
        angular.forEach(_types, function(type, i) {
            if (type.name === name) {
                _types.splice(i, 1);
            }
        });
        return _types;
    };
    cowsPurchased.removeTypeByIndex = function(index) {
        if (!_isDefined(index) || index < 0 || index > _types.length - 1) {
            return undefined;
        }
        _types.splice(index, 1);
        return _types;
    };
    cowsPurchased.types = function() {
        return _types;
    };
    cowsPurchased.validateType = function(type) {
        return cowTypes.validate(type);
    };
    cowsPurchased.cows = function() {
        return _cows;
    };
    cowsPurchased.load = function(cowsPurchasedSection) {
        if (!validator.validateAll(cowsPurchasedSection.cows)) {
            return undefined;
        }
        _cows = cowsPurchasedSection.cows;
        _types = cowsPurchasedSection.types;
        return cowsPurchased;
    };
    return cowsPurchased;
});

angular.module("farmbuild.nutrientCalculator").constant("cowTypeDefaults", [ {
    name: "Heavy adult cattle",
    weight: 650
}, {
    name: "Average adult cattle",
    weight: 500
}, {
    name: "Yearling",
    weight: 300
}, {
    name: "Weaned young stock",
    weight: 120
}, {
    name: "Bobby calve",
    weight: 40
} ]);

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("cows", function(validations, cowTypes, cowValidator, collections, cowTypeDefaults, nutrientCalculatorSession, $log) {
    var cows = {
        types: cowTypes
    }, validator = cowValidator;
    function createDefault() {
        return {
            types: angular.copy(cowTypeDefaults),
            cows: [],
            numberOfCows: 0,
            weight: 0,
            nitrogenInKg: 0,
            phosphorusInKg: 0,
            potassiumInKg: 0,
            sulphurInKg: 0
        };
    }
    cows.createDefault = createDefault;
    function _removeAt(items, index) {
        $log.info("removing item at index " + index);
        return collections.removeAt(items, index);
    }
    cows.removeAt = _removeAt;
    function _create(name, weight, numberOfCows) {
        return {
            name: name,
            weight: weight,
            numberOfCows: numberOfCows
        };
    }
    cows.create = _create;
    function _add(items, name, weight, numberOfCows) {
        var item = _create(name, weight, numberOfCows);
        $log.info("cows.add item ...", item);
        if (!validator.validate(item)) {
            $log.error("cows.add unable to add as the validation has been failed, %j", item);
            return undefined;
        }
        return collections.add(items, item);
    }
    cows.add = _add;
    function validateNew(name, weight, numberOfCows) {
        var items = _create(name, weight, numberOfCows);
        return validator.validate(items);
    }
    cows.validate = validator.validate;
    cows.validateNew = validateNew;
    cows.validateAll = validator.validateAll;
    return cows;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("cowTypes", function(cowTypeDefaults, collections, validations, $log) {
    var cowTypes, _isPositiveNumber = validations.isPositiveNumber, _isEmpty = validations.isEmpty, _types = angular.copy(cowTypeDefaults);
    function _create(name, weight) {
        var type = {
            name: name,
            weight: weight
        };
        return type;
    }
    function _validate(type) {
        $log.info("validating type  ...", type);
        var valid = !_isEmpty(type) && !(_isEmpty(type.name) || !_isPositiveNumber(type.weight));
        if (!valid) {
            $log.error("invalid type: %j", type);
        }
        return valid;
    }
    function _add(types, name, weight) {
        var type = _create(name, weight);
        $log.info("adding a type ...", type);
        if (!_validate(type)) {
            return undefined;
        }
        return collections.add(types, type);
    }
    cowTypes = {
        add: _add,
        at: function(index) {
            return collections.at(_types, index);
        },
        size: function() {
            return collections.size(_types);
        },
        byName: function(name) {
            return collections.byProperty(_types, "name", name);
        },
        toArray: function() {
            return angular.copy(_types);
        },
        removeAt: function(index) {
            return collections.removeAt(_types, index);
        },
        last: function() {
            return collections.last(_types);
        },
        validate: _validate,
        create: _create
    };
    return cowTypes;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("cowValidator", function(validations, cowTypes, $log) {
    var cowValidator = {}, _isDefined = validations.isDefined, _isArray = validations.isArray, _isPositiveNumber = validations.isPositiveNumber, _isEmpty = validations.isEmpty;
    function _validate(cow) {
        $log.info("validating cow...", cow);
        if (!_isDefined(cow.name) || !_isDefined(cow.weight) || !_isPositiveNumber(cow.weight) || !_isDefined(cow.numberOfCows) || !_isPositiveNumber(cow.numberOfCows)) {
            $log.error("invalid, must have name, weight (positive number) and numberOfCows: %j", cow);
            return false;
        }
        return true;
    }
    cowValidator.validate = _validate;
    cowValidator.validateAll = function(items) {
        if (!_isArray(items) || _isEmpty(items)) {
            return false;
        }
        var i = 0;
        for (i; i < items.length; i++) {
            var item = items[i];
            if (!_validate(item)) {
                $log.error("validator invalid at %s: %j", i, item);
                return false;
            }
        }
        return true;
    };
    return cowValidator;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("fertilizerCalculator", function(nutrientMediumCalculator, nutrientMediumValidator, fertilizerDefaults, fertilizerTypes, $log) {
    var calculator = {}, validator = nutrientMediumValidator;
    function createResult(total) {
        return {
            fertilizers: total.incomings,
            weight: total.weight,
            dryMatterWeight: total.dryMatterWeight,
            nitrogenInKg: total.nitrogenInKg,
            nitrogenPercentage: 0,
            phosphorusInKg: total.phosphorusInKg,
            phosphorusPercentage: 0,
            potassiumInKg: total.potassiumInKg,
            potassiumPercentage: 0,
            sulphurInKg: total.sulphurInKg,
            sulphurPercentage: 0
        };
    }
    function _calculatePercentage(nutrientWeight, totalWeight) {
        return nutrientWeight / totalWeight * 100;
    }
    function _calculatePercentages(total) {
        var result = createResult(total);
        result.nitrogenPercentage = _calculatePercentage(total.nitrogenInKg, total.dryMatterWeight);
        result.phosphorusPercentage = _calculatePercentage(total.phosphorusInKg, total.dryMatterWeight);
        result.potassiumPercentage = _calculatePercentage(total.potassiumInKg, total.dryMatterWeight);
        result.sulphurPercentage = _calculatePercentage(total.sulphurInKg, total.dryMatterWeight);
        return result;
    }
    function _createTotal() {
        return {
            weight: 0,
            dryMatterWeight: 0,
            nitrogenInKg: 0,
            phosphorusInKg: 0,
            potassiumInKg: 0,
            sulphurInKg: 0,
            incomings: []
        };
    }
    function _calculateNutrientWeight(weight, percentage) {
        return weight * percentage / 100;
    }
    function calculateDryMatterWeight(weight, dryMatterPercentage, isDry) {
        return isDry ? weight : _calculateNutrientWeight(weight, dryMatterPercentage);
    }
    calculator.calculateDryMatterWeight = calculateDryMatterWeight;
    function updateTotal(fertilizer, total) {
        var type = fertilizer.type, weight = fertilizer.weight, dryMatterWeight = calculateDryMatterWeight(weight, type.dryMatterPercentage, fertilizer.isDry);
        total.weight += weight;
        total.dryMatterWeight += dryMatterWeight;
        total.nitrogenInKg += _calculateNutrientWeight(dryMatterWeight, type.nitrogenPercentage);
        total.phosphorusInKg += _calculateNutrientWeight(dryMatterWeight, type.phosphorusPercentage);
        total.potassiumInKg += _calculateNutrientWeight(dryMatterWeight, type.potassiumPercentage);
        total.sulphurInKg += _calculateNutrientWeight(dryMatterWeight, type.sulphurPercentage);
        total.incomings.push({
            type: fertilizer.type,
            weight: fertilizer.weight,
            isDry: fertilizer.isDry
        });
        return total;
    }
    function calculateAll(fertilizers) {
        $log.info("calculator.calculateAll...");
        var i = 0, total = _createTotal();
        for (i; i < fertilizers.length; i++) {
            var fertilizer = fertilizers[i];
            if (!validator.validate(fertilizer)) {
                $log.error("calculator.calculateAll invalid fertilizer at %s: %j", i, fertilizer);
                return undefined;
            }
            total = updateTotal(fertilizer, total);
        }
        return total;
    }
    calculator.calculate = function(fertilizers) {
        var itemsTotal = calculateAll(fertilizers);
        return _calculatePercentages(itemsTotal);
    };
    return calculator;
});

angular.module("farmbuild.nutrientCalculator").constant("fertilizerDefaults", {
    types: [ {
        name: "Dairy manure stockpile",
        nitrogenPercentage: 1.44,
        phosphorusPercentage: .55,
        potassiumPercentage: 1.38,
        sulphurPercentage: .3,
        dryMatterPercentage: 76.83
    }, {
        name: "DAP",
        nitrogenPercentage: 18,
        phosphorusPercentage: 20,
        potassiumPercentage: 0,
        sulphurPercentage: 1.6,
        dryMatterPercentage: 100
    }, {
        name: "Double Super",
        nitrogenPercentage: 0,
        phosphorusPercentage: 16.8,
        potassiumPercentage: 0,
        sulphurPercentage: 4,
        dryMatterPercentage: 100
    }, {
        name: "Effluent solids",
        nitrogenPercentage: 1.65,
        phosphorusPercentage: .3,
        potassiumPercentage: .4,
        sulphurPercentage: .25,
        dryMatterPercentage: 11.3
    }, {
        name: "Fodder Blend",
        nitrogenPercentage: 11.5,
        phosphorusPercentage: 8.1,
        potassiumPercentage: 19.8,
        sulphurPercentage: 5.5,
        dryMatterPercentage: 100
    }, {
        name: "Fodderbooster",
        nitrogenPercentage: 11.6,
        phosphorusPercentage: 7.6,
        potassiumPercentage: 19.6,
        sulphurPercentage: 6,
        dryMatterPercentage: 100
    }, {
        name: "General Compost",
        nitrogenPercentage: 1.2,
        phosphorusPercentage: .8,
        potassiumPercentage: .8,
        sulphurPercentage: .7,
        dryMatterPercentage: 77
    }, {
        name: "Grass Blend",
        nitrogenPercentage: 29.5,
        phosphorusPercentage: 0,
        potassiumPercentage: 0,
        sulphurPercentage: 15.8,
        dryMatterPercentage: 100
    }, {
        name: "Grassbooster",
        nitrogenPercentage: 29.7,
        phosphorusPercentage: 0,
        potassiumPercentage: 0,
        sulphurPercentage: 14.6,
        dryMatterPercentage: 100
    }, {
        name: "Hay Blend",
        nitrogenPercentage: 13.4,
        phosphorusPercentage: 4.5,
        potassiumPercentage: 23.8,
        sulphurPercentage: 4.7,
        dryMatterPercentage: 100
    }, {
        name: "Hayboosta",
        nitrogenPercentage: 11.8,
        phosphorusPercentage: 4.7,
        potassiumPercentage: 23.6,
        sulphurPercentage: 4.6,
        dryMatterPercentage: 100
    }, {
        name: "Legume Gold",
        nitrogenPercentage: 0,
        phosphorusPercentage: 15,
        potassiumPercentage: 0,
        sulphurPercentage: 10,
        dryMatterPercentage: 100
    }, {
        name: "MAP",
        nitrogenPercentage: 10,
        phosphorusPercentage: 21.8,
        potassiumPercentage: 0,
        sulphurPercentage: 1.5,
        dryMatterPercentage: 100
    }, {
        name: "Muriate of Potash",
        nitrogenPercentage: 0,
        phosphorusPercentage: 0,
        potassiumPercentage: 50,
        sulphurPercentage: 0,
        dryMatterPercentage: 100
    }, {
        name: "Pasture Blend",
        nitrogenPercentage: 23.8,
        phosphorusPercentage: 3.6,
        potassiumPercentage: 13,
        sulphurPercentage: 5.3,
        dryMatterPercentage: 100
    }, {
        name: "Pasture Gold",
        nitrogenPercentage: 0,
        phosphorusPercentage: 14,
        potassiumPercentage: 0,
        sulphurPercentage: 17,
        dryMatterPercentage: 100
    }, {
        name: "Potassium Nitate",
        nitrogenPercentage: 13,
        phosphorusPercentage: 0,
        potassiumPercentage: 36.5,
        sulphurPercentage: 0,
        dryMatterPercentage: 100
    }, {
        name: "Poultry Manure (fresh)",
        nitrogenPercentage: 3.9,
        phosphorusPercentage: 1.8,
        potassiumPercentage: 1.9,
        sulphurPercentage: .5,
        dryMatterPercentage: 90
    }, {
        name: "Shed bedding",
        nitrogenPercentage: .21,
        phosphorusPercentage: .06,
        potassiumPercentage: .24,
        sulphurPercentage: .04,
        dryMatterPercentage: 69.05
    }, {
        name: "Sulphate of Ammonia",
        nitrogenPercentage: 20.5,
        phosphorusPercentage: 0,
        potassiumPercentage: 0,
        sulphurPercentage: 23.5,
        dryMatterPercentage: 100
    }, {
        name: "Sulphate of Potash",
        nitrogenPercentage: 0,
        phosphorusPercentage: 0,
        potassiumPercentage: 40.5,
        sulphurPercentage: 17,
        dryMatterPercentage: 100
    }, {
        name: "Superphosphate (Super)",
        nitrogenPercentage: 0,
        phosphorusPercentage: 8.8,
        potassiumPercentage: 0,
        sulphurPercentage: 11,
        dryMatterPercentage: 100
    }, {
        name: "Triple Super",
        nitrogenPercentage: 0,
        phosphorusPercentage: 20.2,
        potassiumPercentage: 0,
        sulphurPercentage: 1,
        dryMatterPercentage: 100
    }, {
        name: "Urea",
        nitrogenPercentage: 46,
        phosphorusPercentage: 0,
        potassiumPercentage: 0,
        sulphurPercentage: 0,
        dryMatterPercentage: 100
    }, {
        name: "Super and Potash 1:1",
        nitrogenPercentage: 0,
        phosphorusPercentage: 4.4,
        potassiumPercentage: 25,
        sulphurPercentage: 5.5,
        dryMatterPercentage: 100
    }, {
        name: "Super and Potash 2:1",
        nitrogenPercentage: 0,
        phosphorusPercentage: 5.9,
        potassiumPercentage: 16.8,
        sulphurPercentage: 7.3,
        dryMatterPercentage: 100
    }, {
        name: "Super and Potash 3:1",
        nitrogenPercentage: 0,
        phosphorusPercentage: 6.6,
        potassiumPercentage: 12.7,
        sulphurPercentage: 8.2,
        dryMatterPercentage: 100
    }, {
        name: "Super and Potash 4:1",
        nitrogenPercentage: 0,
        phosphorusPercentage: 7,
        potassiumPercentage: 10,
        sulphurPercentage: 8.8,
        dryMatterPercentage: 100
    }, {
        name: "Super and Potash 5:1",
        nitrogenPercentage: 0,
        phosphorusPercentage: 7.4,
        potassiumPercentage: 8,
        sulphurPercentage: 9.2,
        dryMatterPercentage: 100
    }, {
        name: "Pasturebooster",
        nitrogenPercentage: 23.8,
        phosphorusPercentage: 3.7,
        potassiumPercentage: 12.8,
        sulphurPercentage: 4,
        dryMatterPercentage: 100
    } ]
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("fertilizersPurchased", function(validations, nutrientMedium, fertilizerDefaults, fertilizerTypes, nutrientMediumValidator, fertilizerCalculator, collections, nutrientCalculatorSession, $log) {
    var fertilizersPurchased = {
        types: fertilizerTypes,
        calculator: fertilizerCalculator
    }, _fertilizers = [], calculator = fertilizerCalculator, validator = nutrientMediumValidator;
    function createDefault() {
        return {
            types: fertilizerTypes.toArray(),
            fertilizers: [],
            dryMatterWeight: 0
        };
    }
    fertilizersPurchased.createDefault = createDefault;
    function _removeAt(index) {
        $log.info("removing fertilizer at index " + index);
        nutrientMedium.removeAt(_fertilizers, index);
        return fertilizersPurchased;
    }
    fertilizersPurchased.removeAt = _removeAt;
    fertilizersPurchased.fertilizers = function() {
        return _fertilizers;
    };
    function _add(type, weight, isDry) {
        _fertilizers = nutrientMedium.add(_fertilizers, type, weight, isDry);
        return fertilizersPurchased;
    }
    fertilizersPurchased.add = _add;
    function validateNew(type, weight, isDry) {
        var fertilizer = nutrientMedium.create(type, weight, isDry);
        return validator.validate(fertilizer);
    }
    fertilizersPurchased.validateNew = validateNew;
    fertilizersPurchased.validateAll = validator.validateAll;
    fertilizersPurchased.asArray = function() {
        return _fertilizers;
    };
    fertilizersPurchased.calculate = function(fertilizers) {
        $log.info("fertilizersPurchased.calculate...");
        if (!validator.validateAll(fertilizers)) {
            $log.error("fertilizersPurchased.calculate invalid fertilizers, see the error above and fix based on API...");
            return undefined;
        }
        var result = calculator.calculate(fertilizers);
        result.types = fertilizerTypes.toArray();
        nutrientCalculatorSession.saveSection("fertilizersPurchased", result);
        return result;
    };
    fertilizersPurchased.load = function(fertilizersPurchasedSection) {
        if (!validator.validateAll(fertilizersPurchasedSection.fertilizers)) {
            return undefined;
        }
        _fertilizers = fertilizersPurchasedSection.fertilizers;
        fertilizerTypes.load(fertilizersPurchasedSection);
        return fertilizersPurchased;
    };
    return fertilizersPurchased;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("fertilizerTypes", function(collections, validations, nutrientMediumTypes, fertilizerDefaults, $log) {
    var fertilizerTypes, _types = angular.copy(fertilizerDefaults.types), _validate = nutrientMediumTypes.validate;
    function _add(name, dryMatterPercentage, sulphurPercentage, potassiumPercentage, phosphorusPercentage, nitrogenPercentage) {
        return nutrientMediumTypes.add(_types, name, dryMatterPercentage, sulphurPercentage, potassiumPercentage, phosphorusPercentage, nitrogenPercentage);
    }
    fertilizerTypes = {
        add: _add,
        at: function(index) {
            return collections.at(_types, index);
        },
        size: function() {
            return collections.size(_types);
        },
        byName: function(name) {
            return collections.byProperty(_types, "name", name);
        },
        defaultTypes: function() {
            return angular.copy(fertilizerDefaults.types);
        },
        toArray: function() {
            return angular.copy(_types);
        },
        removeAt: function(index) {
            return collections.removeAt(_types, index);
        },
        last: function() {
            return collections.last(_types);
        },
        validate: _validate,
        load: function(fertilizersPurchasedSection) {
            _types = fertilizersPurchasedSection.types;
        }
    };
    return fertilizerTypes;
});

angular.module("farmbuild.nutrientCalculator").constant("forageDefaults", {
    types: [ {
        name: "Average crop",
        nitrogenPercentage: 2.99,
        phosphorusPercentage: .34,
        potassiumPercentage: 2.68,
        sulphurPercentage: .5,
        dryMatterPercentage: 44.45,
        metabolisableEnergyInMJPerKg: 9.75
    }, {
        name: "Average hay",
        nitrogenPercentage: 2.44,
        phosphorusPercentage: .38,
        potassiumPercentage: 2.29,
        sulphurPercentage: .23,
        dryMatterPercentage: 85,
        metabolisableEnergyInMJPerKg: 9.39
    }, {
        name: "Average silage",
        nitrogenPercentage: 2.12,
        phosphorusPercentage: .34,
        potassiumPercentage: 2.35,
        sulphurPercentage: .27,
        dryMatterPercentage: 49.01,
        metabolisableEnergyInMJPerKg: 8.76
    }, {
        name: "Average straw",
        nitrogenPercentage: 2.6,
        phosphorusPercentage: .4,
        potassiumPercentage: 2.7,
        sulphurPercentage: .28,
        dryMatterPercentage: 45.1,
        metabolisableEnergyInMJPerKg: 9.18
    }, {
        name: "Brassica crop",
        nitrogenPercentage: 3.72,
        phosphorusPercentage: .33,
        potassiumPercentage: 2.85,
        sulphurPercentage: .64,
        dryMatterPercentage: 25.99,
        metabolisableEnergyInMJPerKg: 11.32
    }, {
        name: "Canola hay",
        nitrogenPercentage: 2.88,
        phosphorusPercentage: .33,
        potassiumPercentage: 2.29,
        sulphurPercentage: .57,
        dryMatterPercentage: 82.93,
        metabolisableEnergyInMJPerKg: 9.06
    }, {
        name: "Canola silage",
        nitrogenPercentage: 2.75,
        phosphorusPercentage: .3,
        potassiumPercentage: 2.88,
        sulphurPercentage: .51,
        dryMatterPercentage: 23.77,
        metabolisableEnergyInMJPerKg: 9.45
    }, {
        name: "Cereal hay",
        nitrogenPercentage: 1.54,
        phosphorusPercentage: .22,
        potassiumPercentage: 1.83,
        sulphurPercentage: .17,
        dryMatterPercentage: 84.74,
        metabolisableEnergyInMJPerKg: 8.32
    }, {
        name: "Cereal silage",
        nitrogenPercentage: 2.02,
        phosphorusPercentage: .35,
        potassiumPercentage: 2.02,
        sulphurPercentage: .17,
        dryMatterPercentage: 36.28,
        metabolisableEnergyInMJPerKg: 9.14
    }, {
        name: "Cereal straw",
        nitrogenPercentage: .62,
        phosphorusPercentage: .1,
        potassiumPercentage: 1.05,
        sulphurPercentage: .1,
        dryMatterPercentage: 87.22,
        metabolisableEnergyInMJPerKg: 5.99
    }, {
        name: "Clover hay",
        nitrogenPercentage: 2.99,
        phosphorusPercentage: .28,
        potassiumPercentage: 2.51,
        sulphurPercentage: .25,
        dryMatterPercentage: 88.26,
        metabolisableEnergyInMJPerKg: 9.31
    }, {
        name: "Forage blend",
        nitrogenPercentage: 1.94,
        phosphorusPercentage: .38,
        potassiumPercentage: 2.29,
        sulphurPercentage: .2,
        dryMatterPercentage: 84.18,
        metabolisableEnergyInMJPerKg: 8.47
    }, {
        name: "Kikuyu pasture",
        nitrogenPercentage: 3.07,
        phosphorusPercentage: .46,
        potassiumPercentage: 2.82,
        sulphurPercentage: .23,
        dryMatterPercentage: 20.67,
        metabolisableEnergyInMJPerKg: 9.57
    }, {
        name: "Kikuyu silage",
        nitrogenPercentage: 1.7,
        phosphorusPercentage: .39,
        potassiumPercentage: 1.85,
        sulphurPercentage: .13,
        dryMatterPercentage: 57.95,
        metabolisableEnergyInMJPerKg: 10.16
    }, {
        name: "Lucerne hay",
        nitrogenPercentage: 3.34,
        phosphorusPercentage: .38,
        potassiumPercentage: 2.03,
        sulphurPercentage: .29,
        dryMatterPercentage: 83.23,
        metabolisableEnergyInMJPerKg: 9.54
    }, {
        name: "Lucerne pasture",
        nitrogenPercentage: 3.53,
        phosphorusPercentage: .41,
        potassiumPercentage: 2.89,
        sulphurPercentage: .35,
        dryMatterPercentage: 23.34,
        metabolisableEnergyInMJPerKg: 10.22
    }, {
        name: "Lucerne silage",
        nitrogenPercentage: 2.64,
        phosphorusPercentage: .45,
        potassiumPercentage: 2.29,
        sulphurPercentage: .23,
        dryMatterPercentage: 53.54,
        metabolisableEnergyInMJPerKg: 8.75
    }, {
        name: "Maize silage",
        nitrogenPercentage: 1.2,
        phosphorusPercentage: .26,
        potassiumPercentage: 1.12,
        sulphurPercentage: .1,
        dryMatterPercentage: 41.27,
        metabolisableEnergyInMJPerKg: 9.12
    }, {
        name: "Millett crop",
        nitrogenPercentage: 2.82,
        phosphorusPercentage: .41,
        potassiumPercentage: 3.56,
        sulphurPercentage: .41,
        dryMatterPercentage: 52.68,
        metabolisableEnergyInMJPerKg: 9.54
    }, {
        name: "Oat Hay",
        nitrogenPercentage: 1.4,
        phosphorusPercentage: .24,
        potassiumPercentage: 1.64,
        sulphurPercentage: .15,
        dryMatterPercentage: 87.32,
        metabolisableEnergyInMJPerKg: 8.42
    }, {
        name: "Oats & peas silage",
        nitrogenPercentage: 2.26,
        phosphorusPercentage: .39,
        potassiumPercentage: 2.43,
        sulphurPercentage: .2,
        dryMatterPercentage: 47.5,
        metabolisableEnergyInMJPerKg: 9.16
    }, {
        name: "Paspalum silage",
        nitrogenPercentage: 1.91,
        phosphorusPercentage: .32,
        potassiumPercentage: 2.06,
        sulphurPercentage: .18,
        dryMatterPercentage: 52.39,
        metabolisableEnergyInMJPerKg: 8.21
    }, {
        name: "Pasture hay",
        nitrogenPercentage: 1.87,
        phosphorusPercentage: .28,
        potassiumPercentage: 1.87,
        sulphurPercentage: .24,
        dryMatterPercentage: 85.53,
        metabolisableEnergyInMJPerKg: 8.17
    }, {
        name: "Pasture silage",
        nitrogenPercentage: 2.6,
        phosphorusPercentage: .4,
        potassiumPercentage: 2.7,
        sulphurPercentage: .28,
        dryMatterPercentage: 45.1,
        metabolisableEnergyInMJPerKg: 9.18
    }, {
        name: "Prairie grass silage",
        nitrogenPercentage: 1.9,
        phosphorusPercentage: .19,
        potassiumPercentage: 1.3,
        sulphurPercentage: .14,
        dryMatterPercentage: 64.37,
        metabolisableEnergyInMJPerKg: 8.51
    }, {
        name: "Ryegrass pasture",
        nitrogenPercentage: 3.61,
        phosphorusPercentage: .45,
        potassiumPercentage: 2.78,
        sulphurPercentage: .34,
        dryMatterPercentage: 20.82,
        metabolisableEnergyInMJPerKg: 10.46
    }, {
        name: "Seteria silage",
        nitrogenPercentage: 1.91,
        phosphorusPercentage: .27,
        potassiumPercentage: 2.08,
        sulphurPercentage: .12,
        dryMatterPercentage: 31.98,
        metabolisableEnergyInMJPerKg: 8.04
    }, {
        name: "Sorghum crop",
        nitrogenPercentage: 2.2,
        phosphorusPercentage: .39,
        potassiumPercentage: 2.5,
        sulphurPercentage: .14,
        dryMatterPercentage: 30.16,
        metabolisableEnergyInMJPerKg: 8.59
    }, {
        name: "Sorghum hay",
        nitrogenPercentage: 1.87,
        phosphorusPercentage: .34,
        potassiumPercentage: 2,
        sulphurPercentage: .13,
        dryMatterPercentage: 88.05,
        metabolisableEnergyInMJPerKg: 7.6
    }, {
        name: "Sorghum/millet hay",
        nitrogenPercentage: 1.86,
        phosphorusPercentage: .41,
        potassiumPercentage: 1.72,
        sulphurPercentage: .38,
        dryMatterPercentage: 79.1,
        metabolisableEnergyInMJPerKg: 8.46
    }, {
        name: "Sorghum/millet silage",
        nitrogenPercentage: 1.3,
        phosphorusPercentage: .35,
        potassiumPercentage: 3.36,
        sulphurPercentage: .4,
        dryMatterPercentage: 33.91,
        metabolisableEnergyInMJPerKg: 7.53
    }, {
        name: "Turnip crop",
        nitrogenPercentage: 2.03,
        phosphorusPercentage: .28,
        potassiumPercentage: 3.18,
        sulphurPercentage: .52,
        dryMatterPercentage: 11.06,
        metabolisableEnergyInMJPerKg: 11.1
    } ]
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("foragesPurchased", function(validations, nutrientMedium, forageTypes, forageValidator, nutrientMediumValidator, nutrientCalculatorSession, $log) {
    var foragesPurchased = {}, _isDefined = validations.isDefined, _forages = [], validator = nutrientMediumValidator;
    function createDefault() {
        return {
            types: forageTypes.toArray(),
            forages: [],
            dryMatterWeight: 0
        };
    }
    function _add(type, weight, isDry) {
        _forages = nutrientMedium.add(_forages, type, weight, isDry);
        return foragesPurchased;
    }
    function _calculate(forages) {
        $log.info("calculating foragesPurchased nutrient ...", forages);
        var totalWeight = 0, totalDMWeight = 0, nitrogenInKg = 0, phosphorusInKg = 0, potassiumInKg = 0, sulphurInKg = 0, meInMJ = 0, incomings = [], i = 0;
        if (!forages || forages.length === 0) {
            return undefined;
        }
        for (i; i < forages.length; i++) {
            var weight = 0, dmWeight = 0, forage = forages[i], type = forage.type;
            if (!validator.validate(forage)) {
                return undefined;
            }
            weight = forage.weight;
            dmWeight = weight;
            if (!forage.isDry) {
                dmWeight = weight * forage.type.dryMatterPercentage / 100;
            }
            totalWeight += weight;
            totalDMWeight += dmWeight;
            nitrogenInKg += type.nitrogenPercentage * dmWeight / 100;
            phosphorusInKg += type.phosphorusPercentage * dmWeight / 100;
            potassiumInKg += type.potassiumPercentage * dmWeight / 100;
            sulphurInKg += type.sulphurPercentage * dmWeight / 100;
            meInMJ += type.metabolisableEnergyInMJPerKg * dmWeight;
            incomings.push({
                type: forage.type,
                weight: forage.weight,
                isDry: forage.isDry
            });
        }
        var result = {
            forages: incomings,
            weight: totalWeight,
            dryMatterWeight: totalDMWeight,
            nitrogenInKg: nitrogenInKg,
            nitrogenPercentage: nitrogenInKg / totalDMWeight * 100,
            phosphorusInKg: phosphorusInKg,
            phosphorusPercentage: phosphorusInKg / totalDMWeight * 100,
            potassiumInKg: potassiumInKg,
            potassiumPercentage: potassiumInKg / totalDMWeight * 100,
            sulphurInKg: sulphurInKg,
            sulphurPercentage: sulphurInKg / totalDMWeight * 100,
            metabolisableEnergyInMJ: meInMJ,
            metabolisableEnergyInMJPerKg: parseFloat(type.metabolisableEnergyInMJPerKg)
        };
        result.types = forageTypes.toArray();
        nutrientCalculatorSession.saveSection("foragesPurchased", result);
        return result;
    }
    function _isEmpty() {
        return _forages.length === 0;
    }
    function _count() {
        return _forages.length;
    }
    function _toArray() {
        return _forages;
    }
    function _at(index) {
        return _forages[index];
    }
    function _removeIndex(index) {
        $log.info("removing forage at index " + index);
        if (!_isDefined(index) || index < 0 || index > _forages.length - 1) {
            return foragesPurchased;
        }
        _forages.splice(index, 1);
        return foragesPurchased;
    }
    function _remove(forage) {
        $log.info("removing forage ", forage);
        if (!_isDefined(forage)) {
            return foragesPurchased;
        }
        angular.forEach(_forages, function(item, index) {
            if (angular.equals(item, forage)) {
                _removeIndex(index);
            }
        });
        return foragesPurchased;
    }
    function _first() {
        return _forages[0];
    }
    function _last() {
        $log.info("getting last forage ...");
        var length = _count();
        return _forages[length - 1];
    }
    foragesPurchased = {
        add: _add,
        at: _at,
        size: _count,
        toArray: _toArray,
        removeAt: _removeIndex,
        remove: _remove,
        first: _first,
        last: _last,
        isEmpty: _isEmpty,
        calculate: _calculate,
        forages: function() {
            return _forages;
        },
        types: forageTypes,
        validateNew: function(type, weight, isDry) {
            var forage = nutrientMedium.create(type, weight, isDry);
            return validator.validate(forage);
        },
        validateAll: validator.validateAll,
        load: function(foragesPurchasedSection) {
            if (!validator.validateAll(foragesPurchasedSection.forages)) {
                return undefined;
            }
            _forages = foragesPurchasedSection.forages;
            forageTypes.load(foragesPurchasedSection);
            return foragesPurchased;
        },
        createDefault: createDefault
    };
    return foragesPurchased;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("forageTypes", function(collections, validations, nutrientMediumTypes, forageDefaults, $log) {
    var _isDefined = validations.isDefined, _types = angular.copy(forageDefaults.types), _isEmpty = validations.isEmpty, forageTypes = {}, _validate = nutrientMediumTypes.validate;
    function add(name, dryMatterPercentage, sulphurPercentage, potassiumPercentage, phosphorusPercentage, nitrogenPercentage, metabolisableEnergyInMJPerKg) {
        return nutrientMediumTypes.add(_types, name, dryMatterPercentage, sulphurPercentage, potassiumPercentage, phosphorusPercentage, nitrogenPercentage, metabolisableEnergyInMJPerKg);
    }
    function _last() {
        $log.info("getting last forage type ...");
        var length = _count();
        return _types[length - 1];
    }
    function _first() {
        $log.info("getting first forage type ...");
        return _types[0];
    }
    function _count() {
        $log.info("counting forage types ...", _types);
        return _types.length;
    }
    function _remove(type) {
        $log.info("removing forage type ", type);
        if (!_isDefined(type)) {
            return forageTypes;
        }
        angular.forEach(_types, function(item, index) {
            if (angular.equals(item, type)) {
                forageTypes.removeAt(index);
            }
        });
        return forageTypes;
    }
    forageTypes = {
        add: add,
        at: function(index) {
            return collections.at(_types, index);
        },
        size: function() {
            return collections.size(_types);
        },
        toArray: function() {
            return angular.copy(_types);
        },
        removeAt: function(index) {
            return collections.removeAt(_types, index);
        },
        remove: _remove,
        first: _first,
        last: _last,
        isEmpty: _isEmpty,
        validate: _validate,
        load: function(foragesPurchasedSection) {
            _types = foragesPurchasedSection.types;
        }
    };
    return forageTypes;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("forageValidator", function(nutrientMediumValidator, $log) {
    var forageValidator = {};
    function _validate(forage) {
        $log.info("validating forage...", forage);
        return nutrientMediumValidator.validate(forage);
    }
    forageValidator.validate = _validate;
    forageValidator.validateAll = function(forages) {
        return nutrientMediumValidator.validateAll(forages);
    };
    return forageValidator;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("googleAnalyticsCalculator", function($log, validations, googleAnalytics) {
    var googleAnalyticsCalculator = {}, api = "farmbuild-dairy-nutrient-calculator", _isDefined = validations.isDefined;
    googleAnalyticsCalculator.trackCalculate = function(clientName) {
        $log.info("googleAnalyticsCalculator.trackCalculate clientName: %s", clientName);
        googleAnalytics.track(api, clientName);
    };
    return googleAnalyticsCalculator;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("incomings", function(validations, $log) {
    var incomings = {}, _isPositiveNumber = validations.isPositiveNumber, _isAlphanumeric = validations.isAlphanumeric, _isDefined = validations.isDefined, _fertilizer = [];
    return incomings;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("legumeCalculator", function($log, validations) {
    var legumeCalculator, _isPositiveNumber = validations.isPositiveNumber;
    function _milkEnergyInMJ(milkSoldPerYearInLitre, fatInKg, proteinInKg) {
        var fatPercentage = fatInKg / milkSoldPerYearInLitre, proteinPercentage = proteinInKg / milkSoldPerYearInLitre, milkEnergyPerLitreInMJ = 1.694 * (.386 * fatPercentage * 100 + .205 * (5.8 + proteinPercentage * 100) - .236), totalMilkEnergyInMJ = milkEnergyPerLitreInMJ * milkSoldPerYearInLitre, milkEnergyNotSoldInMJ = totalMilkEnergyInMJ * .04;
        return {
            perLitre: milkEnergyPerLitreInMJ,
            total: totalMilkEnergyInMJ,
            notSold: milkEnergyNotSoldInMJ
        };
    }
    function _importedEnergyConsumedInMJ(totalForageMetabolisableEnergyInMJ, totalConcentrateMetabolisableEnergyInMJ) {
        if (!_isPositiveNumber(totalForageMetabolisableEnergyInMJ) || !_isPositiveNumber(totalConcentrateMetabolisableEnergyInMJ)) {
            return undefined;
        }
        return totalForageMetabolisableEnergyInMJ * (100 - 12.7) / 100 + totalConcentrateMetabolisableEnergyInMJ * (100 - 5) / 100;
    }
    function _cattleEnergyUsedInMJ(totalMilkEnergyInMJ, milkEnergyNotSoldInMJ, numberOfMilkingCows, numberOfMilkingDays, liveWeightInKg) {
        if (!_isPositiveNumber(totalMilkEnergyInMJ) || !_isPositiveNumber(milkEnergyNotSoldInMJ) || !_isPositiveNumber(numberOfMilkingCows) || !_isPositiveNumber(numberOfMilkingDays) || !_isPositiveNumber(liveWeightInKg)) {
            return undefined;
        }
        return totalMilkEnergyInMJ + milkEnergyNotSoldInMJ + numberOfMilkingCows * numberOfMilkingDays * (liveWeightInKg / 7);
    }
    function _dryMatterConsumedPerHaInKg(cattleEnergyUsedInMJ, importedEnergyConsumedInMJ, milkingAreaInHa) {
        if (!_isPositiveNumber(cattleEnergyUsedInMJ) || !_isPositiveNumber(importedEnergyConsumedInMJ) || !_isPositiveNumber(milkingAreaInHa)) {
            return undefined;
        }
        return (cattleEnergyUsedInMJ - importedEnergyConsumedInMJ) / (milkingAreaInHa * 10.5);
    }
    function _dryMatterGrownInKg(dryMatterConsumedPerHaInKg, utilisationFactor) {
        if (!_isPositiveNumber(dryMatterConsumedPerHaInKg) || !_isPositiveNumber(utilisationFactor)) {
            return undefined;
        }
        return dryMatterConsumedPerHaInKg * 100 / utilisationFactor;
    }
    function _averageNitrogenAppliedInKg(totalNitrogenFromFertiliserInKg, milkingAreaInHa) {
        if (!_isPositiveNumber(totalNitrogenFromFertiliserInKg) || !_isPositiveNumber(milkingAreaInHa)) {
            return undefined;
        }
        return totalNitrogenFromFertiliserInKg / milkingAreaInHa;
    }
    function _totalLegumeInKg(dryMatterConsumedPerHaInKg, legumePercentage, utilisationFactor) {
        if (!_isPositiveNumber(dryMatterConsumedPerHaInKg) || !_isPositiveNumber(legumePercentage) || !_isPositiveNumber(utilisationFactor)) {
            return undefined;
        }
        return dryMatterConsumedPerHaInKg * legumePercentage / utilisationFactor;
    }
    function _availableNitrogenFromLegumesInKg(totalLegumeInKg, averageNitrogenAppliedInKg) {
        if (!_isPositiveNumber(totalLegumeInKg) || !_isPositiveNumber(averageNitrogenAppliedInKg)) {
            return undefined;
        }
        return totalLegumeInKg * (.0358 - 359e-7 * averageNitrogenAppliedInKg);
    }
    function _availableNitrogenToPastureInKg(totalLegumeInKg, averageNitrogenAppliedInKg) {
        if (!_isPositiveNumber(totalLegumeInKg) || !_isPositiveNumber(averageNitrogenAppliedInKg)) {
            return undefined;
        }
        return averageNitrogenAppliedInKg + totalLegumeInKg * (.0358 - 359e-7 * averageNitrogenAppliedInKg);
    }
    legumeCalculator = {
        milkEnergy: _milkEnergyInMJ,
        importedEnergyConsumed: _importedEnergyConsumedInMJ,
        cattleEnergyUsed: _cattleEnergyUsedInMJ,
        dryMatterConsumed: _dryMatterConsumedPerHaInKg,
        dryMatterGrown: _dryMatterGrownInKg,
        averageNitrogenApplied: _averageNitrogenAppliedInKg,
        totalLegume: _totalLegumeInKg,
        availableNitrogenFromLegumes: _availableNitrogenFromLegumesInKg,
        availableNitrogenToPasture: _availableNitrogenToPastureInKg
    };
    return legumeCalculator;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("legumes", function(validations, utilisationFactorsValues, legumeCalculator, $log) {
    var legumes, _isDefined = validations.isDefined, _isPositiveNumber = validations.isPositiveNumber, _isPositiveNumberOrZero = validations.isPositiveNumberOrZero, _utilisationFactors = angular.copy(utilisationFactorsValues);
    function _validate(legume) {
        $log.info("validating legume ...", legume);
        if (!_isDefined(legume.type) || !_isDefined(legume.weight) || !_isDefined(legume.isDry)) {
            return false;
        }
        return true;
    }
    function _calculate(milkSoldPerYearInLitre, milkFatInKg, milkProteinInKg, numberOfMilkingCows, numberOfMilkingDays, averageCowWeightInKg, forageMetabolisableEnergyInMJ, concentrateMetabolisableEnergyInMJ, milkingAreaInHa, utilisationFactor, nitrogenFromFertiliserInKg, legumePercentage) {
        $log.info("calculating legumes nutrient ...");
        if (!_isPositiveNumberOrZero(milkSoldPerYearInLitre) || !_isPositiveNumberOrZero(milkProteinInKg) || !_isPositiveNumberOrZero(milkFatInKg) || !_isPositiveNumberOrZero(numberOfMilkingCows) || !_isPositiveNumberOrZero(numberOfMilkingDays) || !_isPositiveNumberOrZero(averageCowWeightInKg) || !_isPositiveNumberOrZero(forageMetabolisableEnergyInMJ) || !_isPositiveNumberOrZero(concentrateMetabolisableEnergyInMJ) || !_isPositiveNumberOrZero(milkingAreaInHa) || !_isPositiveNumberOrZero(utilisationFactor) || !_isPositiveNumberOrZero(nitrogenFromFertiliserInKg) || !_isPositiveNumberOrZero(legumePercentage)) {
            return undefined;
        }
        var milkEnergy = legumeCalculator.milkEnergy(milkSoldPerYearInLitre, milkFatInKg, milkProteinInKg), cattleEnergyUsed = legumeCalculator.cattleEnergyUsed(milkEnergy.total, milkEnergy.notSold, numberOfMilkingCows, numberOfMilkingDays, averageCowWeightInKg), importedEnergyConsumed = legumeCalculator.importedEnergyConsumed(forageMetabolisableEnergyInMJ, concentrateMetabolisableEnergyInMJ), dryMatterConsumed = legumeCalculator.dryMatterConsumed(cattleEnergyUsed, importedEnergyConsumed, milkingAreaInHa), dryMatterGrown = legumeCalculator.dryMatterGrown(dryMatterConsumed, utilisationFactor), averageNitrogenApplied = legumeCalculator.averageNitrogenApplied(nitrogenFromFertiliserInKg, milkingAreaInHa), totalLegume = legumeCalculator.totalLegume(dryMatterConsumed, legumePercentage, utilisationFactor), availableNitrogenFromLegumes = legumeCalculator.availableNitrogenFromLegumes(totalLegume, averageNitrogenApplied), availableNitrogenToPasture = legumeCalculator.availableNitrogenToPasture(totalLegume, averageNitrogenApplied);
        return {
            importedEnergyConsumedInMJ: importedEnergyConsumed,
            utilisationFactor: utilisationFactor,
            dryMatterConsumedPerHaInKg: dryMatterConsumed,
            dryMatterGrownPerHaInKg: dryMatterGrown,
            averageNitrogenAppliedPerHaInKg: averageNitrogenApplied,
            availableNitrogenFromLegumesPerHaInKg: availableNitrogenFromLegumes,
            availableNitrogenToPasturePerHaInKg: availableNitrogenToPasture,
            cattleEnergyUsedInMJ: cattleEnergyUsed,
            milkEnergyInMJ: milkEnergy.total,
            milkEnergyNotSoldInMJ: milkEnergy.notSold,
            milkProteinInKg: milkProteinInKg,
            milkFatInKg: milkFatInKg,
            milkSoldPerYearInLitre: milkSoldPerYearInLitre,
            legumePerHaInKg: totalLegume,
            legumePercentage: legumePercentage
        };
    }
    function utilisationFactors() {
        return _utilisationFactors;
    }
    legumes = {
        calculate: _calculate,
        utilisationFactors: utilisationFactors
    };
    return legumes;
});

angular.module("farmbuild.nutrientCalculator").constant("utilisationFactorsValues", [ {
    name: "Low",
    weight: 60
}, {
    name: "Average",
    weight: 75
}, {
    name: "High",
    weight: 80
}, {
    name: "Very High",
    weight: 90
} ]);

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("milkSold", function($log, validations, nutrientCalculatorSession) {
    var milkSold = {}, _isPositiveNumber = validations.isPositiveNumber;
    function createDefault() {
        return {
            totalPerYearInLitre: 0,
            fatInKg: 0,
            fatPercentage: 0,
            proteinInKg: 0,
            proteinPercentage: 0
        };
    }
    milkSold.createDefault = createDefault;
    function saveToSession(result) {
        nutrientCalculatorSession.saveSection("milkSold", result);
        return result;
    }
    milkSold.calculateByPercent = function(milkSoldPerYearInLitre, milkProteinPercentage, milkFatPercentage) {
        var milkProteinInKg, milkFatInKg;
        if (!_validateInputs(milkSoldPerYearInLitre, milkProteinPercentage, milkFatPercentage, "%")) {
            $log.error("validation failed, ");
            return undefined;
        }
        milkSoldPerYearInLitre = parseFloat(milkSoldPerYearInLitre);
        milkProteinPercentage = parseFloat(milkProteinPercentage);
        milkFatPercentage = parseFloat(milkFatPercentage);
        milkProteinInKg = _percentageToKg(milkProteinPercentage, milkSoldPerYearInLitre);
        milkFatInKg = _percentageToKg(milkFatPercentage, milkSoldPerYearInLitre);
        var result = _calculate(milkSoldPerYearInLitre, milkFatInKg, milkProteinInKg, milkProteinPercentage, milkFatPercentage);
        return saveToSession(result);
    };
    milkSold.calculateByKg = function(milkSoldPerYearInLitre, milkProteinInKg, milkFatInKg) {
        var milkProteinPercentage, milkFatPercentage;
        if (!_validateInputs(milkSoldPerYearInLitre, milkProteinInKg, milkFatInKg, "kg")) {
            $log.error("validation failed...");
            return undefined;
        }
        milkSoldPerYearInLitre = parseFloat(milkSoldPerYearInLitre);
        milkProteinInKg = parseFloat(milkProteinInKg);
        milkFatInKg = parseFloat(milkFatInKg);
        milkFatPercentage = _kgToPercentage(milkFatInKg, milkSoldPerYearInLitre);
        milkProteinPercentage = _kgToPercentage(milkProteinInKg, milkSoldPerYearInLitre);
        var result = _calculate(milkSoldPerYearInLitre, milkFatInKg, milkProteinInKg, milkProteinPercentage, milkFatPercentage);
        return saveToSession(result);
    };
    function _validateInputs(milkSoldPerYearInLitre, milkProtein, milkFat, unit) {
        if (!milkSoldPerYearInLitre || !milkProtein || !milkFat || !unit) {
            return false;
        }
        if (!_isPositiveNumber(milkSoldPerYearInLitre) || !_isPositiveNumber(milkProtein) || !_isPositiveNumber(milkFat)) {
            return false;
        }
        if (unit === "%" && milkProtein + milkFat > 100) {
            return false;
        }
        if (unit === "kg" && milkProtein + milkFat > milkSoldPerYearInLitre) {
            return false;
        }
        return true;
    }
    function _calculate(milkSoldPerYearInLitre, milkFatInKg, milkProteinInKg, milkProteinPercentage, milkFatPercentage) {
        var nitrogenPercentage = milkProteinPercentage / 6.33, phosphorusPercentage = .0111 * milkFatPercentage + .05255, potassiumPercentage = .14, sulphurPercentage = .06, nitrogenInKg = milkSoldPerYearInLitre * nitrogenPercentage / 100, potassiumInKg = milkSoldPerYearInLitre * potassiumPercentage / 100, sulphurInKg = milkSoldPerYearInLitre * sulphurPercentage / 100, phosphorusInKg = milkSoldPerYearInLitre * phosphorusPercentage / 100;
        var result = {
            totalPerYearInLitre: milkSoldPerYearInLitre,
            fatInKg: milkFatInKg,
            fatPercentage: milkFatPercentage,
            proteinInKg: milkProteinInKg,
            proteinPercentage: milkProteinPercentage,
            nitrogenInKg: nitrogenInKg,
            nitrogenPercentage: nitrogenPercentage,
            phosphorusInKg: phosphorusInKg,
            phosphorusPercentage: phosphorusPercentage,
            potassiumInKg: potassiumInKg,
            potassiumPercentage: potassiumPercentage,
            sulphurInKg: sulphurInKg,
            sulphurPercentage: sulphurPercentage
        };
        nutrientCalculatorSession.saveSection("milkSold", result);
        return result;
    }
    function _kgToPercentage(valueInKg, totalInLitre) {
        return valueInKg / totalInLitre * 100;
    }
    function _percentageToKg(valuePercentage, totalInLitre) {
        return valuePercentage * totalInLitre / 100;
    }
    return milkSold;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("nutrientMediumCalculator", function(nutrientMediumValidator, fertilizerDefaults, nutrientMediumTypes, $log) {
    var calculator = {}, validator = nutrientMediumValidator;
    function createResult(total) {
        return {
            fertilizers: total.incomings,
            weight: total.weight,
            dryMatterWeight: total.dryMatterWeight,
            nitrogenInKg: total.nitrogenInKg,
            nitrogenPercentage: 0,
            phosphorusInKg: total.phosphorusInKg,
            phosphorusPercentage: 0,
            potassiumInKg: total.potassiumInKg,
            potassiumPercentage: 0,
            sulphurInKg: total.sulphurInKg,
            sulphurPercentage: 0
        };
    }
    function _calculatePercentage(nutrientWeight, totalWeight) {
        return nutrientWeight / totalWeight * 100;
    }
    function _calculatePercentages(total) {
        var result = createResult(total);
        result.nitrogenPercentage = _calculatePercentage(total.nitrogenInKg, total.dryMatterWeight);
        result.phosphorusPercentage = _calculatePercentage(total.phosphorusInKg, total.dryMatterWeight);
        result.potassiumPercentage = _calculatePercentage(total.potassiumInKg, total.dryMatterWeight);
        result.sulphurPercentage = _calculatePercentage(total.sulphurInKg, total.dryMatterWeight);
        return result;
    }
    function _createTotal() {
        return {
            weight: 0,
            dryMatterWeight: 0,
            nitrogenInKg: 0,
            phosphorusInKg: 0,
            potassiumInKg: 0,
            sulphurInKg: 0,
            incomings: []
        };
    }
    function _calculateNutrientWeight(weight, percentage) {
        return weight * percentage / 100;
    }
    function calculateDryMatterWeight(weight, dryMatterPercentage, isDry) {
        return isDry ? weight : _calculateNutrientWeight(weight, dryMatterPercentage);
    }
    calculator.calculateDryMatterWeight = calculateDryMatterWeight;
    function updateTotal(fertilizer, total) {
        var type = fertilizer.type, weight = fertilizer.weight, dryMatterWeight = calculateDryMatterWeight(weight, type.dryMatterPercentage, fertilizer.isDry);
        total.weight += weight;
        total.dryMatterWeight += dryMatterWeight;
        total.nitrogenInKg += _calculateNutrientWeight(dryMatterWeight, type.nitrogenPercentage);
        total.phosphorusInKg += _calculateNutrientWeight(dryMatterWeight, type.phosphorusPercentage);
        total.potassiumInKg += _calculateNutrientWeight(dryMatterWeight, type.potassiumPercentage);
        total.sulphurInKg += _calculateNutrientWeight(dryMatterWeight, type.sulphurPercentage);
        total.incomings.push({
            type: fertilizer.type,
            weight: fertilizer.weight,
            isDry: fertilizer.isDry
        });
        return total;
    }
    function calculateAll(fertilizers) {
        $log.info("calculator.calculateAll...");
        var i = 0, total = _createTotal();
        for (i; i < fertilizers.length; i++) {
            var fertilizer = fertilizers[i];
            if (!validator.validate(fertilizer)) {
                $log.error("calculator.calculateAll invalid fertilizer at %s: %j", i, fertilizer);
                return undefined;
            }
            total = updateTotal(fertilizer, total);
        }
        return total;
    }
    calculator.calculate = function(fertilizers) {
        var itemsTotal = calculateAll(fertilizers);
        return _calculatePercentages(itemsTotal);
    };
    return calculator;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("nutrientMedium", function(validations, nutrientMediumTypes, nutrientMediumValidator, nutrientMediumCalculator, collections, nutrientCalculatorSession, $log) {
    var nutrientMedium = {
        types: nutrientMediumTypes,
        calculator: nutrientMediumCalculator
    }, calculator = nutrientMediumCalculator, validator = nutrientMediumValidator;
    function _removeAt(items, index) {
        $log.info("removing item at index " + index);
        return collections.removeAt(items, index);
    }
    nutrientMedium.removeAt = _removeAt;
    function _create(type, weight, isDry) {
        return {
            type: type,
            weight: weight,
            isDry: isDry
        };
    }
    nutrientMedium.create = _create;
    function _add(items, type, weight, isDry) {
        var item = _create(type, weight, isDry);
        $log.info("nutrientMedium.add item ...", item);
        if (!validator.validate(item)) {
            $log.error("nutrientMedium.add unable to add as the validation has been failed, %j", item);
            return undefined;
        }
        return collections.add(items, item);
    }
    nutrientMedium.add = _add;
    function validateNew(type, weight, isDry) {
        var items = _create(type, weight, isDry);
        return validator.validate(items);
    }
    nutrientMedium.validate = validator.validate;
    nutrientMedium.validateNew = validateNew;
    nutrientMedium.validateAll = validator.validateAll;
    nutrientMedium.calculate = function(fertilizers) {
        $log.info("nutrientMedium.calculate...");
        if (!validator.validateAll(fertilizers)) {
            $log.error("nutrientMedium.calculate invalid fertilizers, see the error above and fix based on API...");
            return undefined;
        }
        var result = calculator.calculate(fertilizers);
        result.types = nutrientMediumTypes.toArray();
        nutrientCalculatorSession.saveSection("nutrientMedium", result);
        return result;
    };
    return nutrientMedium;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("nutrientMediumTypes", function(collections, validations, $log) {
    var nutrientMediumTypes, _isPositiveNumber = validations.isPositiveNumber, _isPositiveNumberOrZero = validations.isPositiveNumberOrZero, _isEmpty = validations.isEmpty, _isDefined = validations.isDefined, _types = [];
    function _create(name, dryMatterPercentage, sulphurPercentage, potassiumPercentage, phosphorusPercentage, nitrogenPercentage, metabolisableEnergyInMJPerKg) {
        var type = {
            name: name,
            dryMatterPercentage: dryMatterPercentage,
            sulphurPercentage: sulphurPercentage,
            potassiumPercentage: potassiumPercentage,
            phosphorusPercentage: phosphorusPercentage,
            nitrogenPercentage: nitrogenPercentage
        };
        if (_isDefined(metabolisableEnergyInMJPerKg)) {
            type.metabolisableEnergyInMJPerKg = metabolisableEnergyInMJPerKg;
        }
        return type;
    }
    function _validate(type) {
        $log.info("validating type  ...", type);
        var valid = !_isEmpty(type) && !(_isEmpty(type.name) || !_isPositiveNumber(type.dryMatterPercentage) || !_isPositiveNumberOrZero(type.potassiumPercentage) || !_isPositiveNumberOrZero(type.phosphorusPercentage) || !_isPositiveNumberOrZero(type.nitrogenPercentage) || !_isPositiveNumberOrZero(type.sulphurPercentage));
        if (_isDefined(type) && type.hasOwnProperty("metabolisableEnergyInMJPerKg")) {
            valid = valid && _isPositiveNumber(type.metabolisableEnergyInMJPerKg);
        }
        if (!valid) {
            $log.error("invalid type: %j", type);
        }
        return valid;
    }
    function _add(types, name, dryMatterPercentage, sulphurPercentage, potassiumPercentage, phosphorusPercentage, nitrogenPercentage, metabolisableEnergyInMJPerKg) {
        var type = _create(name, dryMatterPercentage, sulphurPercentage, potassiumPercentage, phosphorusPercentage, nitrogenPercentage, metabolisableEnergyInMJPerKg);
        $log.info("adding a type ...", type);
        if (!_validate(type)) {
            return undefined;
        }
        return collections.add(types, type);
    }
    nutrientMediumTypes = {
        add: _add,
        at: function(index) {
            return collections.at(_types, index);
        },
        size: function() {
            return collections.size(_types);
        },
        byName: function(name) {
            return collections.byProperty(_types, "name", name);
        },
        toArray: function() {
            return angular.copy(_types);
        },
        removeAt: function(index) {
            return collections.removeAt(_types, index);
        },
        last: function() {
            return collections.last(_types);
        },
        validate: _validate,
        create: _create
    };
    return nutrientMediumTypes;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("nutrientMediumValidator", function(validations, nutrientMediumTypes, $log) {
    var nutrientMediumValidator = {}, _isDefined = validations.isDefined, _isArray = validations.isArray, _isPositiveNumber = validations.isPositiveNumber, _isEmpty = validations.isEmpty;
    function _validate(nutrientMedium) {
        $log.info("validating nutrientMedium...", nutrientMedium);
        if (!_isDefined(nutrientMedium.type) || !_isDefined(nutrientMedium.weight) || !_isPositiveNumber(nutrientMedium.weight) || !_isDefined(nutrientMedium.isDry)) {
            $log.error("invalid, must have type (must pass type validate), weight (positive number) and isDry (boolean): %j", nutrientMedium);
            return false;
        }
        return nutrientMediumTypes.validate(nutrientMedium.type);
    }
    nutrientMediumValidator.validate = _validate;
    nutrientMediumValidator.validateAll = function(items) {
        if (!_isArray(items) || _isEmpty(items)) {
            return false;
        }
        var i = 0;
        for (i; i < items.length; i++) {
            var item = items[i];
            if (!_validate(item)) {
                $log.error("validator invalid at %s: %j", i, item);
                return false;
            }
        }
        return true;
    };
    return nutrientMediumValidator;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("nutrientAggregator", function(validations, $log) {
    var nutrientAggregator = {}, _isDefined = validations.isDefined;
    function _aggregate(farmData) {
        var data = farmData.nutrientCalculator, incomings = {
            nitrogenInKg: 0,
            potassiumInKg: 0,
            phosphorusInKg: 0,
            sulphurInKg: 0
        }, outgoings = {
            nitrogenInKg: 0,
            potassiumInKg: 0,
            phosphorusInKg: 0,
            sulphurInKg: 0
        }, addIncomings = function(key) {
            incomings.nitrogenInKg += data[key].nitrogenInKg;
            incomings.potassiumInKg += data[key].potassiumInKg;
            incomings.phosphorusInKg += data[key].phosphorusInKg;
            incomings.sulphurInKg += data[key].sulphurInKg;
        }, addOutgoings = function(key) {
            outgoings.nitrogenInKg += data[key].nitrogenInKg;
            outgoings.potassiumInKg += data[key].potassiumInKg;
            outgoings.phosphorusInKg += data[key].phosphorusInKg;
            outgoings.sulphurInKg += data[key].sulphurInKg;
        };
        if (_isDefined(data.milkSold)) {
            addOutgoings("milkSold");
        }
        if (_isDefined(data.cowsCulled)) {
            addOutgoings("cowsCulled");
        }
        if (_isDefined(data.cowsPurchased)) {
            addIncomings("cowsPurchased");
        }
        if (_isDefined(data.concentratesPurchased)) {
            addIncomings("concentratesPurchased");
        }
        if (_isDefined(data.foragesPurchased)) {
            addIncomings("foragesPurchased");
        }
        if (_isDefined(data.fertilizersPurchased)) {
            addIncomings("fertilizersPurchased");
        }
        if (_isDefined(data.legumes)) {
            incomings.nitrogenInKg += data.legumes.averageNitrogenAppliedPerHaInKg;
            incomings.nitrogenInKg += data.legumes.availableNitrogenFromLegumesPerHaInKg;
            incomings.nitrogenInKg += data.legumes.availableNitrogenToPasturePerHaInKg;
        }
        return {
            incomings: incomings,
            outgoings: outgoings
        };
    }
    nutrientAggregator.calculate = function(farmData) {
        return _aggregate(farmData);
    };
    return nutrientAggregator;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("nutrientBalance", function(validations, $log) {
    var nutrientBalance = {}, _isPositiveNumber = validations.isPositiveNumber, _isDefined = validations.isDefined;
    function _balance(importedValue, exportedValue, milkingArea) {
        if (!_isPositiveNumber(importedValue) || !_isPositiveNumber(exportedValue) || !_isPositiveNumber(milkingArea)) {
            return undefined;
        }
        return (importedValue - exportedValue) / milkingArea;
    }
    nutrientBalance.calculate = function(nutrientValues, milkingArea) {
        return {
            nitrogen: _balance(nutrientValues.incomings.nitrogenInKg, nutrientValues.outgoings.nitrogenInKg, milkingArea),
            potassium: _balance(nutrientValues.incomings.potassiumInKg, nutrientValues.outgoings.potassiumInKg, milkingArea),
            phosphorus: _balance(nutrientValues.incomings.phosphorusInKg, nutrientValues.outgoings.phosphorusInKg, milkingArea),
            sulphur: _balance(nutrientValues.incomings.sulphurInKg, nutrientValues.outgoings.sulphurInKg, milkingArea)
        };
    };
    return nutrientBalance;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("nutrientEfficiency", function(validations, $log) {
    var nutrientEfficiency = {}, _isPositiveNumber = validations.isPositiveNumber, _isDefined = validations.isDefined;
    function _efficiency(importedValue, exportedValue) {
        if (!_isPositiveNumber(importedValue) || !_isPositiveNumber(exportedValue)) {
            return undefined;
        }
        return exportedValue / importedValue * 100;
    }
    nutrientEfficiency.calculate = function(nutrientValues) {
        return {
            nitrogen: _efficiency(nutrientValues.incomings.nitrogenInKg, nutrientValues.outgoings.nitrogenInKg),
            potassium: _efficiency(nutrientValues.incomings.potassiumInKg, nutrientValues.outgoings.potassiumInKg),
            phosphorus: _efficiency(nutrientValues.incomings.phosphorusInKg, nutrientValues.outgoings.phosphorusInKg),
            sulphur: _efficiency(nutrientValues.incomings.sulphurInKg, nutrientValues.outgoings.sulphurInKg)
        };
    };
    return nutrientEfficiency;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("feedBalance", function(validations, $log) {
    var feedBalance = {}, _isPositiveNumber = validations.isPositiveNumber, _isDefined = validations.isDefined;
    function validate(summary, concentratesPurchased, foragesPurchased, legumes) {
        if (!_isDefined(summary) || !_isDefined(summary.milkingAreaInHa)) {
            $log.error("nutrientCalculator.summary must be populated for milkingAreaInHa");
            return false;
        }
        if (!_isDefined(concentratesPurchased) || !_isDefined(concentratesPurchased.dryMatterWeight)) {
            $log.error("nutrientCalculator.concentratesPurchased must be populated for dryMatterWeightCombined");
            return false;
        }
        if (!_isDefined(foragesPurchased) || !_isDefined(foragesPurchased.dryMatterWeight)) {
            $log.error("nutrientCalculator.foragesPurchased must be populated for dryMatterWeightCombined");
            return false;
        }
        if (!_isDefined(legumes) || !_isDefined(legumes.dryMatterConsumedPerHaInKg)) {
            $log.error("nutrientCalculator.legumes must be populated for dryMatterConsumedPerHaInKg");
            return false;
        }
        return true;
    }
    function calculate(nutrientCalculator) {
        var summary = nutrientCalculator.summary, concentratesPurchased = nutrientCalculator.concentratesPurchased, foragesPurchased = nutrientCalculator.foragesPurchased, legumes = nutrientCalculator.legumes;
        if (!validate(summary, concentratesPurchased, foragesPurchased, legumes)) {
            return undefined;
        }
        var result = {}, milkingAreaInHa = summary.milkingAreaInHa, weightCombined = foragesPurchased.weight + concentratesPurchased.weight, dryMatterConsumedPerHaInKg = legumes.dryMatterConsumedPerHaInKg, dryMatterConsumedPerMilkingAreaInKg = dryMatterConsumedPerHaInKg * milkingAreaInHa, weightTotal = weightCombined + dryMatterConsumedPerMilkingAreaInKg, forageTotalFeedRatio = 100 * foragesPurchased.weight / weightTotal, supplementTotalFeedRatio = 100 * concentratesPurchased.weight / weightTotal, homegrownTotalFeedRatio = 100 * dryMatterConsumedPerMilkingAreaInKg / weightTotal, supplementHomegrownRatio = 100 * (forageTotalFeedRatio + supplementTotalFeedRatio) / homegrownTotalFeedRatio;
        result.homeForageConsumed = dryMatterConsumedPerMilkingAreaInKg / milkingAreaInHa;
        result.forageTotalFeedRatio = forageTotalFeedRatio;
        result.supplementTotalFeedRatio = supplementTotalFeedRatio;
        result.homegrownTotalFeedRatio = homegrownTotalFeedRatio;
        result.supplementHomegrownRatio = supplementHomegrownRatio;
        return result;
    }
    feedBalance.calculate = calculate;
    return feedBalance;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("milkProduction", function(validations, $log) {
    var milkProduction = {}, _isPositiveNumber = validations.isPositiveNumber, _isDefined = validations.isDefined;
    function validate(summary, milkSold, feedBalance) {
        if (!_isDefined(summary) || !_isDefined(summary.numberOfMilkingCows) || !_isDefined(summary.milkingAreaInHa)) {
            $log.error("nutrientCalculator.summary must be populated for numberOfMilkingCows, milkingAreaInHa");
            return false;
        }
        if (!_isDefined(milkSold) || !_isDefined(milkSold.fatInKg) || !_isDefined(milkSold.proteinInKg) || !_isDefined(milkSold.totalPerYearInLitre)) {
            $log.error("nutrientCalculator.milkSold must be populated for totalPerYearInLitre, fatInKg, proteinInKg");
            return false;
        }
        if (!_isDefined(feedBalance)) {
            $log.error("nutrientCalculator.feedBalance must be populated");
            return false;
        }
        return true;
    }
    function calculate(nutrientCalculator) {
        var summary = nutrientCalculator.summary, milkSold = nutrientCalculator.milkSold, feedBalance = nutrientCalculator.feedBalance;
        if (!validate(summary, milkSold, feedBalance)) {
            return undefined;
        }
        var result = {}, numberOfMilkingCows = summary.numberOfMilkingCows, milkingAreaInHa = summary.milkingAreaInHa, milkSoldPerYearInLitre = milkSold.totalPerYearInLitre, fatInKg = milkSold.fatInKg, proteinInKg = milkSold.proteinInKg, fatNProteinInKg = fatInKg + proteinInKg, forageTotalFeedRatio = feedBalance.forageTotalFeedRatio, supplementTotalFeedRatio = feedBalance.supplementTotalFeedRatio, homegrownTotalFeedRatio = feedBalance.homegrownTotalFeedRatio;
        result.milkSoldPerYearInLitre = milkSoldPerYearInLitre;
        result.milkSoldPerCowInLitre = milkSoldPerYearInLitre / numberOfMilkingCows;
        result.milkSoldPerHectareInLitre = milkSoldPerYearInLitre / milkingAreaInHa;
        result.milkSoldPerCowInKg = fatNProteinInKg / numberOfMilkingCows;
        result.milkSoldPerHectareInInKg = fatNProteinInKg / milkingAreaInHa;
        result.milkSoldFromImportedFeedInKg = milkSoldPerYearInLitre * (forageTotalFeedRatio + supplementTotalFeedRatio) / 100;
        result.milkSoldFromHomeGrownFeedInKg = milkSoldPerYearInLitre * homegrownTotalFeedRatio / 100;
        return result;
    }
    milkProduction.calculate = calculate;
    return milkProduction;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("stockingRate", function(validations, $log) {
    var stockingRate = {}, _isPositiveNumber = validations.isPositiveNumber, _isDefined = validations.isDefined;
    function validate(summary, area) {
        if (!_isDefined(area)) {
            $log.error("farmData.area must be populated");
            return false;
        }
        if (!_isDefined(summary) || !_isDefined(summary.numberOfMilkingCows) || !_isDefined(summary.milkingAreaInHa)) {
            $log.error("nutrientCalculator.summary must be populated for numberOfMilkingCows, milkingAreaInHa");
            return false;
        }
        return true;
    }
    function calculate(nutrientCalculator, area) {
        var summary = nutrientCalculator.summary;
        if (!validate(summary, area)) {
            return undefined;
        }
        var result = {}, numberOfMilkingCows = summary.numberOfMilkingCows, milkingAreaInHa = summary.milkingAreaInHa;
        result.milkingArea = numberOfMilkingCows / milkingAreaInHa;
        result.wholeFarm = numberOfMilkingCows / area;
        return result;
    }
    stockingRate.calculate = calculate;
    return stockingRate;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").factory("nutrientCalculatorSession", function($log, farmdata, validations) {
    var nutrientCalculatorSession = {}, _isDefined = validations.isDefined;
    function load() {
        var root = farmdata.session.find();
        if (!_isDefined(root)) {
            return undefined;
        }
        return root.nutrientCalculator;
    }
    nutrientCalculatorSession.saveSection = function(section, value) {
        var loaded = load();
        if (!_isDefined(loaded)) {
            $log.error("Unable to find an existing farmData! please create then save.");
            return nutrientCalculatorSession;
        }
        loaded[section] = value;
        return save(loaded);
    };
    function save(toSave) {
        var farmData = farmdata.session.find();
        if (!_isDefined(farmData)) {
            $log.error("Unable to find the farmData in the session!");
            return undefined;
        }
        farmData.dateLastUpdated = new Date();
        farmData.nutrientCalculator = toSave;
        farmdata.session.save(farmData);
        return toSave;
    }
    nutrientCalculatorSession.save = save;
    nutrientCalculatorSession.loadSection = function(section) {
        var loaded = load();
        debugger;
        return loaded ? loaded[section] : null;
    };
    nutrientCalculatorSession.isLoadFlagSet = farmdata.session.isLoadFlagSet;
    nutrientCalculatorSession.find = function() {
        return farmdata.session.find();
    };
    nutrientCalculatorSession.export = function(document, farmData) {
        return farmdata.session.export(document, save(farmData));
    };
    return nutrientCalculatorSession;
});

"use strict";

angular.module("farmbuild.nutrientCalculator").run(function(nutrientCalculator) {});

angular.injector([ "ng", "farmbuild.nutrientCalculator" ]);