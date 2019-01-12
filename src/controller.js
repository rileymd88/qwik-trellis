import { setTimeout } from "timers";

var qlik = window.require('qlik');

export default ['$scope', '$element', function ($scope, $element) {
    var enigma = $scope.component.model.enigmaModel;
    var app = qlik.currApp($scope);
    $scope.sessionIds = [];

    $scope.$watch("layout.prop.columns", function () {
        $scope.colNum = parseInt($scope.layout.prop.columns);
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
        if (typeof $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0] != "undefined") {
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
                            if ($scope.layout.prop.advanced) {
                                createChart($scope.vizProp.qInfo.qType, cell, null, dimName, dimValue, i).then(function (id) {
                                    $scope.sessionIds.push(id);
                                })
                            }
                            else {
                                createNewMeasure(dimName, dimValue).then(function (measures) {
                                    createChart($scope.vizProp.qInfo.qType, cell, measures, null, null, i).then(function (id) {
                                        $scope.sessionIds.push(id);
                                    })
                                })
                            }
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
                                if (split[i].length > 0) {
                                    var removedSpaces = split[i].replace(/\s/g, '');
                                    // If contains set analysis already - inject set analysis! TODO: Add if for all possible set analysis selectors
                                    if (removedSpaces.includes('{<')) {
                                        // Find position of <
                                        var n = split[i].indexOf('<') + 1;
                                        var output = [split[i].slice(0, n), `${dimName}={'${dimValue}'},`, split[i].slice(n)].join('');
                                        var final = aggrList[a] + output;
                                        finalMeasure += final;
                                    }
                                    // Otherwise inject complete set analysis
                                    else {
                                        var final = aggrList[a] + `{<${dimName}={'${dimValue}'}>}` + split[i];
                                        finalMeasure += final;
                                    }
                                }
                                else {
                                    finalMeasure += split[i];
                                }
                            }

                        }
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
            if (!$scope.layout.prop.advanced) {
                try {
                    var props = JSON.parse(JSON.stringify($scope.vizProp));
                    for (var m = 0; m < measures.length; m++) {
                        props.qHyperCubeDef.qMeasures[m].qDef.qDef = measures[m];
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
            }
            else {
                try {
                    var vizPropString = JSON.stringify($scope.vizProp);
                    vizPropString = vizPropString.replaceAll('$(vDimSetFull)', "{<" + `${dimName}={'${dimValue}'}` + ">}");
                    vizPropString = vizPropString.replaceAll('$(vDimSet)', `,${dimName}={'${dimValue}'}`);
                    vizPropString = vizPropString.replaceAll('$(vDim)', `'${dimValue}'`);
                    var vizPropJson = JSON.parse(vizPropString);
                    app.visualization.create(qType, null, vizPropJson).then(function (vis) {
                        vis.show(cell).then(function (viz) {
                            resolve(viz.object.layout.qInfo.qId);
                        });
                    })
                }
                catch (err) {
                    reject(err);
                }

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