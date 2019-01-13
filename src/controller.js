import { setTimeout } from "timers";

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
        if ($scope.layout.qHyperCube.qDimensionInfo[0] !== 'undefined') {
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
                    $scope.vizProp = vizProp;
                    // loop through cells and create charts
                    document.querySelectorAll('.qwik-trellis-cell').forEach(function (cell, i) {
                        if (i < $scope.currentCube.length) {
                            var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
                            var dimValue = $scope.layout.qHyperCube.qDataPages[0].qMatrix[i][0].qText;
                            createNewMeasure(dimName, dimValue).then(function (measures) {
                                createChart($scope.vizProp.qInfo.qType, cell, measures, dimName, dimValue, i).then(function (id) {
                                    $scope.sessionIds.push(id);
                                })
                            })
                        }
                    });
                })
            })
        }
    }

    function createNewMeasure(dimName, dimValue) {
        return new Promise(function (resolve, reject) {
            var measures = [];
            var vizProp = $scope.vizProp;
            try {
                var aggrList = ["Sum(", "Avg(", "Count(", "Min(", "Max("];
                vizProp.qInfo.qId = "";
                vizProp.qInfo.qType = vizProp.visualization;
                // Loop through measures
                for (var m = 0; m < vizProp.qHyperCubeDef.qMeasures.length; m++) {
                    var finalMeasure = '';
                    // Get Measure Definition from master item
                    var mes = vizProp.qHyperCubeDef.qMeasures[m].qDef.qDef;
                    // Loop through all possible aggregation types
                    for (var a = 0; a < aggrList.length; a++) {
                        var split = mes.split(aggrList[a]);
                        // Loop through individual split measure
                        if (split.length > 1) {
                            for (var i = 0; i < split.length; i++) {
                                var next = i + 1;
                                if (i != split.length - 1) {
                                    var nextRemovedSpaces = split[next].replace(/\s/g, '');
                                    // If contains set analysis already - inject set analysis! TODO: Add if for all possible set analysis selectors
                                    if (nextRemovedSpaces.includes('{<')) {
                                        // Find position of <
                                        var n = split[next].indexOf('<') + 1;
                                        var output = [split[next].slice(0, n), `${dimName}={'${dimValue}'},`, split[next].slice(n)].join('');
                                        var final = split[i] + aggrList[a] + output;
                                        finalMeasure += final;
                                    }
                                    // Otherwise inject complete set analysis
                                    else {
                                        var final = split[i] + aggrList[a] + `{<${dimName}={'${dimValue}'}>}` + split[i];
                                        finalMeasure += final;
                                    }
                                }
                                else {
                                    finalMeasure += split[i];
                                }

                            }

                        }
                    }
                    if ($scope.layout.prop.showAllDims) {
                        finalMeasure += " + 0*Sum({1}1)";
                    }
                    measures.push(finalMeasure)
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
                    props = props.replaceAll('$(vDim)', `'${dimValue}'`);
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
                        resolve(viz.object.layout.qInfo.qId);
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