var qlik = window.require('qlik');

export default ['$scope', '$element', function ($scope, $element) {
    $scope.layoutId = $scope.layout.qInfo.qId;
    var enigma = $scope.component.model.enigmaModel;
    var app = qlik.currApp($scope);
    $scope.sessionIds = [];

    $scope.$watch("layout.prop.columns", function () {
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
    });

    $scope.$watch("layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]", function () {
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
            if($scope.sessionIds.length) {
                for (var i = 0; i < $scope.sessionIds.length; i++) {
                    enigma.app.destroySessionObject($scope.sessionIds[i]).then(function (res) {
                    });
                }
                $scope.showCharts = false;
            }
        }
    });

    $scope.$watch("layout.prop.vizId", function () {
        createTrellisObjects();
    });

    $scope.$watch("layout.prop.advanced", function () {
        createTrellisObjects();
    });

    $scope.$watch("layout.prop.showAllDims", function () {
        createTrellisObjects();
    });

    $scope.$watch("layout.prop.label", function () {
        createTrellisObjects();
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
                //app.enigma.destroySessionObject(reply.qInfo.qId);
                resolve(cube);
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
                    vizProp.qInfo.qId = "";
                    vizProp.qInfo.qType = vizProp.visualization;
                    $scope.vizProp = JSON.parse(JSON.stringify(vizProp));
                    // loop through cells and create charts
                    $element[0].querySelectorAll('.qwik-trellis-cell').forEach(function (cell, i) {
                        if (i < $scope.currentCube.length) {
                            var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
                            var dimValue = $scope.layout.qHyperCube.qDataPages[0].qMatrix[i][0].qText;
                            createNewMeasures(dimName, dimValue).then(function (measures) {
                                createChart($scope.vizProp.qInfo.qType, cell, measures, dimName, dimValue, i).then(function (id) {
                                    $scope.showCharts = true;
                                    $scope.sessionIds.push(id);
                                })
                            })
                        }
                    });
                })
            })
        }
    }

    function createNewMeasures(dimName, dimValue) {
        return new Promise(function (resolve, reject) {
            var measures = [];
            var vizProp = $scope.vizProp;
            try {
                var aggr = ["Sum(", "Avg(", "Count(", "Min(", "Max("];
                // Loop through measures
                for (var m = 0; m < vizProp.qHyperCubeDef.qMeasures.length; m++) {
                    var currentMes = '';
                    // Get Measure Definition from master item
                    var formula = vizProp.qHyperCubeDef.qMeasures[m].qDef.qDef;
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
                    measures.push(currentMes)
                }
                resolve(measures);
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

                app.visualization.create(qType, null, props).then(function (vis) {
                    vis.show(cell).then(function (viz) {
                        resolve(viz.model.id);
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