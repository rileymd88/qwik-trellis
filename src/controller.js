var qlik = window.require('qlik');

export default ['$scope', '$element', function ($scope, $element) {
    $scope.layoutId = $scope.layout.qInfo.qId;
    var enigma = $scope.component.model.enigmaModel;
    var app = qlik.currApp($scope);
    $scope.sessionIds = [];
    setupStyles().then(function () {
        createTrellisObjects();
    })
    $scope.$watch("layout.prop.columns", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.colNum = parseInt($scope.layout.prop.columns);
               if ($scope.currentCube) {
                   if ($scope.currentCube.length < $scope.colNum) {
                       $scope.colNum = $scope.currentCube.length - 1;
                   }
               }
               $scope.rowNum = Math.ceil($scope.layout.qHyperCube.qDataPages[0].qMatrix.length / $scope.colNum);
               var rowPercent = 100 / $scope.rowNum;
               var px = $scope.rowNum + 1;
               rowPercent = 'calc(' + rowPercent.toString() + '%' + ' - ' + px.toString() + 'px)';
               $scope.rowHeight = {
                   "height": rowPercent
               };
               createTrellisObjects();
        }         
    });

    function setupStyles() {
        return new Promise(function (resolve, reject) {
            // Create hypercube
            getCube($scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]).then(function (cube) {
                $scope.currentCube = cube;
                $scope.colNum = parseInt($scope.layout.prop.columns);
                if ($scope.currentCube) {
                    if ($scope.currentCube.length < $scope.colNum) {
                        $scope.colNum = $scope.currentCube.length - 1;
                    }
                }
                $scope.rowNum = Math.ceil($scope.layout.qHyperCube.qDataPages[0].qMatrix.length / $scope.colNum);
                var rowPercent = 100 / $scope.rowNum;
                var px = $scope.rowNum + 1;
                rowPercent = 'calc(' + rowPercent.toString() + '%' + ' - ' + px.toString() + 'px)';
                $scope.rowHeight = {
                    "height": rowPercent
                };
                resolve();
            })
        })
    }

    $scope.$watch("layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            try {
                // Create hypercube
                getCube($scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]).then(function (cube) {
                    $scope.currentCube = cube;
                    createTrellisObjects();
                })
                $scope.rowNum = Math.ceil($scope.layout.qHyperCube.qDataPages[0].qMatrix.length / $scope.colNum);
                var rowPercent = 100 / $scope.rowNum;
                var px = $scope.rowNum + 1;
                rowPercent = 'calc(' + rowPercent.toString() + '%' + ' - ' + px.toString() + 'px)';
                $scope.rowHeight = {
                    "height": rowPercent
                };
            }
            catch (err) {
                // Destroy existing session objects
                if ($scope.sessionIds.length) {
                    for (var i = 0; i < $scope.sessionIds.length; i++) {
                        enigma.app.destroySessionObject($scope.sessionIds[i]).then(function (res) {
                        });
                    }
                    $scope.showCharts = false;
                }
            }
        }      
    });

    $scope.$watch("layout.prop.vizId", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.advanced", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.showAllDims", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.label", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.labelMes", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.autoRange", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    function getCube(dimDef) {
        var dimDefMes = dimDef.replace('=', '');
        return new Promise(function (resolve, reject) {
            app.createCube({
                "qDimensions": [{
                    "qDef": {
                        "qFieldDefs": [dimDef]
                    }
                }],
                "qMeasures": [{
                    "qDef": {
                        "qDef": `Count({1}${dimDefMes})`,
                        "qLabel": "dim"
                    }
                }],
                "qInitialDataFetch": [{
                    qHeight: 50,
                    qWidth: 2
                }]
            }, function (reply) {
                var cube = reply.qHyperCube.qDataPages[0].qMatrix;
                resolve(cube);
                app.enigma.destroySessionObject(reply.qInfo.qId);
            });
        })
    }

    function createTrellisObjects() {
        // Get viz object
        if (typeof $scope.currentCube != 'undefined') {
            if ($scope.currentCube.length < $scope.colNum) {
                $scope.colNum = $scope.currentCube.length - 1;
            }
            // Destroy existing session objects
            for (var i = 0; i < $scope.sessionIds.length; i++) {
                enigma.app.destroySessionObject($scope.sessionIds[i]).then(function (res) {
                });
            }
            enigma.app.getObject($scope.layout.prop.vizId).then(function (vizObject) {
                $scope.vizObject = vizObject;
                $scope.vizObject.getProperties().then(function (vizProp) {
                    // Modify properties of master item viz
                    $scope.vizProp = JSON.parse(JSON.stringify(vizProp));
                    $scope.vizProp.qInfo.qId = "";
                    $scope.vizProp.qInfo.qType = $scope.vizProp.visualization;
                    $scope.sessionIds = [];
                    var chartPromises = [];
                    var measurePromises = [];
                    var chartPromises = [];
                    var objectPromises = [];
                    var propPromises = [];
                    var setPropPromises = [];
                    var objects = "";
                    $element[0].querySelectorAll('.qwik-trellis-cell').forEach(function (cell, i) {
                        if (i < $scope.currentCube.length) {
                            var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
                            var dimValue = $scope.layout.qHyperCube.qDataPages[0].qMatrix[i][0].qText;
                            var promise = createNewMeasures(dimName, dimValue);
                            measurePromises.push(promise);
                        }
                    });
                    Promise.all(measurePromises).then(function (measureProm) {
                        $element[0].querySelectorAll('.qwik-trellis-cell').forEach(function (cell, i) {
                            if (i < $scope.currentCube.length) {
                                var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
                                var dimValue = $scope.layout.qHyperCube.qDataPages[0].qMatrix[i][0].qText;
                                var promise = createChart($scope.vizProp.qInfo.qType, cell, measureProm[i], dimName, dimValue, i);
                                chartPromises.push(promise);
                            }
                        });
                        Promise.all(chartPromises).then(function (viz) {
                            $scope.maxValues = [];
                            for (var v = 0; v < viz.length; v++) {
                                $scope.sessionIds.push(viz[v].id);
                                for (var m = 0; m < viz[v].model.layout.qHyperCube.qMeasureInfo.length; m++) {
                                    $scope.maxValues.push(viz[v].model.layout.qHyperCube.qMeasureInfo[m].qMax);
                                }
                                $scope.max = 0;
                                for (var t = 0; t < $scope.maxValues.length; t++) {
                                    if ($scope.maxValues[t] > $scope.max) {
                                        $scope.max = $scope.maxValues[t];
                                    }
                                }

                            }

                            for (var x = 0; x < $scope.sessionIds.length; x++) {
                                var promise = enigma.app.getObject($scope.sessionIds[x]);
                                objectPromises.push(promise);
                            }
                            Promise.all(objectPromises).then(function (obj) {
                                objects = obj;
                                for (var ob = 0; ob < objects.length; ob++) {
                                    var promise = objects[ob].getProperties();
                                    propPromises.push(promise);
                                }
                                Promise.all(propPromises).then(function (propPromise) {
                                    for (var p = 0; p < propPromise.length; p++) {
                                        var props = JSON.parse(JSON.stringify(propPromise[p]));
                                        if ($scope.layout.prop.autoRange && typeof props.measureAxis != 'undefined') {
                                            props.measureAxis.autoMinMax = false;
                                            props.measureAxis.max = Math.round($scope.max * 1.1);
                                            var promise = objects[p].setProperties(props);
                                            setPropPromises.push(promise);
                                        }
                                    }
                                    Promise.all(setPropPromises).then(function () {
                                        $scope.showCharts = true;
                                    })
                                })
                            })
                        })
                    })
                })
            })
        }
    }


    function createNewMeasures(dimName, dimValue) {
        return new Promise(function (resolve, reject) {
            var measures = [];
            var vizProp = $scope.vizProp;
            try {
                var promises = [];
                // Loop through measures
                for (var m = 0; m < vizProp.qHyperCubeDef.qMeasures.length; m++) {
                    promises.push(createMeasure(vizProp, m, dimName, dimValue));
                }
                Promise.all(promises).then(function (measures) {
                    resolve(measures)
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    function createMeasure(vizProp, m, dimName, dimValue) {
        return new Promise(function (resolve, reject) {
            var aggr = ["Sum(", "Avg(", "Count(", "Min(", "Max("];
            var formula = '';
            var promises = [];
            var currentMes = '';
            // Get Measure Definition from master item
            if (vizProp.qHyperCubeDef.qMeasures[m].qLibraryId) {
                var promise = getMasterMeasure(vizProp, m);
                promises.push(promise);
            }
            else {
                var promise = vizProp.qHyperCubeDef.qMeasures[m].qDef.qDef;
                promises.push(promise);
            }
            Promise.all(promises).then(function (values) {
                formula = values[0];
                // Loop through all possible aggregation types
                for (var i = 0; i < aggr.length; i++) {
                    var form = ''
                    if (i == 0) {
                        form = formula;
                    } else {
                        form = currentMes;
                    }
                    var mes = '';
                    var split = form.split(aggr[i]);
                    // Check to see if form contains aggr
                    if (split.length != 1) {
                        // loop through split
                        for (var s = 0; s < split.length; s++) {
                            // check for set analysis in next
                            var next = s + 1
                            // ensure not last item
                            if (typeof split[next] != 'undefined') {
                                // check if includes < and inject partial set
                                if (split[next].includes('{<')) {
                                    mes += split[s] + aggr[i] + "$(vDimSet)";
                                }
                                // else inject full set
                                else {
                                    mes += split[s] + aggr[i] + "$(vDimSetFull)";
                                }
                            }
                            // Last item
                            else {
                                mes += split[s];
                            }
                        }
                        currentMes = mes;
                    } else {
                        currentMes = form;
                    }
                }
                if (parseInt($scope.layout.prop.showAllDims) == 1) {
                    currentMes += " + 0*Sum({1}1)";
                }
                currentMes = currentMes.replaceAll('$(vDimSetFull)', "{<" + `${dimName}={'${dimValue}'}` + ">}");
                currentMes = currentMes.replaceAll('$(vDimSet)', `,${dimName}={'${dimValue}'}`);
                currentMes = currentMes.replaceAll('$(vDim)', `'${dimValue}'`);
                resolve(currentMes);
            })
        })
    }

    function getMasterMeasure(vizProp, m) {
        return new Promise(function (resolve, reject) {
            try {
                enigma.app.getMeasure(vizProp.qHyperCubeDef.qMeasures[m].qLibraryId).then(function (mesObject) {
                    mesObject.getMeasure().then(function (mes) {
                        resolve(mes.qDef);
                    })
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    function createChart(qType, cell, measures, dimName, dimValue, i) {
        return new Promise(function (resolve, reject) {
            try {
                var props = JSON.parse(JSON.stringify($scope.vizProp));
                if (!$scope.layout.prop.advanced) {
                    for (var m = 0; m < measures.length; m++) {
                        props.qHyperCubeDef.qMeasures[m].qLibraryId = "";
                        props.qHyperCubeDef.qMeasures[m].qDef.qDef = measures[m];
                    }
                    props.title = dimValue;
                }
                else {
                    props = JSON.stringify(props);
                    props = props.replaceAll('$(vDimSetFull)', "{<" + `${dimName}={'${dimValue}'}` + ">}");
                    props = props.replaceAll('$(vDimSet)', `,${dimName}={'${dimValue}'}`);
                    props = props.replaceAll('$(vDim)', `'${dimName}'`);
                    props = props.replaceAll('$(vDimValue)', `'${dimValue}'`);
                    props = JSON.parse(props);
                }
                // Auto Rang
                if (typeof props.measureAxis != 'undefined') {
                    if ($scope.layout.prop.autoRange) {
                        props.measureAxis.measureMax = $scope.maxAxis;
                        props.measureAxis.autoMinMax = false;
                    }
                }
                // Dim Axis
                if (typeof props.dimensionAxis != 'undefined') {
                    if ($scope.layout.prop.label == 'left') {
                        var leftCharts = [];
                        var chartInt = 0;
                        for (var v = 0; v < $scope.rowNum; v++) {
                            if (v == 0) {
                                leftCharts.push(chartInt);
                            }
                            else {
                                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                                leftCharts.push(chartInt);
                            }
                        }
                        var label = false;
                        for (var c = 0; c < leftCharts.length; c++) {
                            if (i == leftCharts[c]) {
                                label = true;
                            }
                        }
                        if (!label) {
                            props.dimensionAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.label == 'right') {
                        var rightCharts = [];
                        var chartInt = $scope.colNum - 1;
                        for (var v = 0; v < $scope.rowNum; v++) {
                            if (v == 0) {
                                rightCharts.push(chartInt);
                            }
                            else {
                                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                                rightCharts.push(chartInt);
                            }
                        }
                        var label = false;
                        for (var c = 0; c < rightCharts.length; c++) {
                            if (i == rightCharts[c]) {
                                label = true;
                            }
                        }
                        if (!label) {
                            props.dimensionAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.label == 'top') {
                        if (i >= $scope.colNum) {
                            props.dimensionAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.label == 'bottom') {
                        if (i < $scope.colNum * $scope.rowNum - $scope.colNum) {
                            props.dimensionAxis.show = 'none';
                        }
                    }
                }
                // Mes Axis
                if (typeof props.measureAxis != 'undefined') {
                    if ($scope.layout.prop.labelMes == 'left') {
                        var leftCharts = [];
                        var chartInt = 0;
                        for (var v = 0; v < $scope.rowNum; v++) {
                            if (v == 0) {
                                leftCharts.push(chartInt);
                            }
                            else {
                                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                                leftCharts.push(chartInt);
                            }
                        }
                        var label = false;
                        for (var c = 0; c < leftCharts.length; c++) {
                            if (i == leftCharts[c]) {
                                label = true;
                            }
                        }
                        if (!label) {
                            props.measureAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.labelMes == 'right') {
                        var rightCharts = [];
                        var chartInt = $scope.colNum - 1;
                        for (var v = 0; v < $scope.rowNum; v++) {
                            if (v == 0) {
                                rightCharts.push(chartInt);
                            }
                            else {
                                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                                rightCharts.push(chartInt);
                            }
                        }
                        var label = false;
                        for (var c = 0; c < rightCharts.length; c++) {
                            if (i == rightCharts[c]) {
                                label = true;
                            }
                        }
                        if (!label) {
                            props.measureAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.labelMes == 'top') {
                        if (i >= $scope.colNum) {
                            props.measureAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.labelMes == 'bottom') {
                        if (i < $scope.colNum * $scope.rowNum - $scope.colNum) {
                            props.measureAxis.show = 'none';
                        }
                    }
                }

                app.visualization.create(qType, null, props).then(function (vis) {
                    var viz = vis;
                    vis.show(cell).then(function () {
                        resolve(viz);
                    });
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    String.prototype.replaceAll = function (searchStr, replaceStr) {
        var str = this;
        // no match exists in string?
        if (str.indexOf(searchStr) === -1) {
            // return string
            return str;
        }
        // replace and remove first match, and do another recursirve search/replace
        return (str.replace(searchStr, replaceStr)).replaceAll(searchStr, replaceStr);
    }
}]