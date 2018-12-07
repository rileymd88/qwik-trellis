var qlik = window.require('qlik');

export default ['$scope', '$element', function ($scope, $element) {
    var enigma = $scope.component.model.enigmaModel;
    var app = qlik.currApp($scope);

    $scope.$watch("layout.prop.columns", function () {
        console.log($scope.layout.prop.columns);
        $scope.colNum = parseInt($scope.layout.prop.columns);
        $scope.rowNum =  Math.ceil($scope.layout.qHyperCube.qDataPages[0].qMatrix.length / $scope.colNum);
        var rowPercent = 100/$scope.rowNum;
        var px = $scope.rowNum + 1;
        rowPercent = 'calc(' + rowPercent.toString() + '%' + ' - ' +  px.toString() + 'px)';
        $scope.rowHeight = {
            "height": rowPercent
        };
        console.log($scope.rowHeight);
    });

    $scope.$watch("layout.qHyperCube.qDataPages[0].qMatrix.length", function () {
        $scope.rowNum =  Math.ceil($scope.layout.qHyperCube.qDataPages[0].qMatrix.length / $scope.colNum);
        var rowPercent = 100/$scope.rowNum;
        var px = $scope.rowNum + 1;
        px = px.toString();
        rowPercent = 'calc(' + rowPercent.toString() + '%' + ' - ' + px + ')';
        $scope.rowHeight = {
            "height": rowPercent
        };
    });



    function getCellLayout(sheetCells) {
        return new Promise(function (resolve, reject) {
            var cellLayout = "";
            for (var i = 0; i < sheetCells.length; i++) {
                if (sheetCells[i].name == $scope.layout.qInfo.qId) {
                    cellLayout = sheetCells[i];
                    resolve(cellLayout);
                }
            }
        })
    }

    function createTrellisObject(vizProp, i) {
            // Create dim specific viz props
            var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
            var dimValue = $scope.layout.qHyperCube.qDataPages[0].qMatrix[i][0].qText;
            var vizPropString = JSON.stringify(vizProp);
            vizPropString = vizPropString.replaceAll('$(vDimSetFull)', "{<" + `${dimName}={'${dimValue}'}`  + ">}");
            vizPropString = vizPropString.replaceAll('$(vDimSet)', `,${dimName}={'${dimValue}'}`);
            vizPropString = vizPropString.replaceAll('$(vDim)', `'${dimValue}'`);
            var vizPropJson = JSON.parse(vizPropString);
            // Create object
            $scope.sheet.createChild(vizPropJson).then(function(reply){
                var cell = $scope.cellList[i];
                cell.name = reply.id
                cell.type = reply.genericType;
                $scope.sheetProp.cells.push(cell);
                console.log($scope.sheetProp.cells);
                $scope.sheet.setProperties($scope.sheetProp);
            }).catch(function(err){
            })
    }


    
    String.prototype.replaceAll = function(searchStr, replaceStr) {
        var str = this;
        // no match exists in string?
        if(str.indexOf(searchStr) === -1) {
            // return string
            return str;
        }
        // replace and remove first match, and do another recursirve search/replace
        return (str.replace(searchStr, replaceStr)).replaceAll(searchStr, replaceStr);
    }

    function getObjectCell(object) {
        return new Promise(function (resolve, reject) {
            object.getParent().then(function (parentSheet) {
                enigma.app.getObject(parentSheet.id).then(function (parentSheet) {
                    parentSheet.getProperties().then(function (sheetProp) {
                        for (var i = 0; i < sheetProp.cells.length; i++) {
                            if (sheetProp.cells[i].name == object.id) {
                                resolve(sheetProp.cells[i]);
                            }
                        }
                    })
                })
            })
        })
    }

    function createNewCells(blockColSize, blockRowSize, colSize, rowSize, shapeCount, col, row) {
        var colOrg = col;
        return new Promise(function (resolve, reject) {
            // Calcs
            var blocks = blockColSize * blockRowSize;
            var shapeSize = colSize * rowSize;
            var howManyBlocks = shapeCount * shapeSize;

            // Create blank array and other vars
            var cells = [];
            var rowCount = 1;

            // Check to ensure blocks fit
            if (blocks >= howManyBlocks && blockColSize >= colSize && blockRowSize >= rowSize) {
                // Loop 12 times and create shapes
                for (var i = 0; i < shapeCount; i++) {
                    // Add results to array
                    cells.push({ name: '',type: '', col: col, row: row, colspan: colSize, rowspan: rowSize });
                    // Increment col and row arrays
                    if (col + colSize < blockColSize) {
                        col = col + colSize;
                    }
                    else {
                        col = colOrg;
                        row = rowCount * rowSize;
                        rowCount++
                    }
                }
                resolve(cells);
            }
            else {
                reject('not enough space!');
            }
        })
    }

    $scope.onStart = function () {
        // Get viz object
        enigma.app.getObject($scope.layout.prop.vizId).then(function (vizObject) {
            $scope.vizObject = vizObject;
            $scope.vizObject.getProperties().then(function (vizProp) {
                vizProp.qInfo.qId = "";
                $scope.vizProp = vizProp;
                // Get ext object
                enigma.app.getObject($scope.layout.qInfo.qId).then(function (extObject) {
                    $scope.extObject = extObject;
                    // Get sheetID
                    $scope.extObject.getParent().then(function (parentSheet) {
                        $scope.sheetId = parentSheet.id;
                        // Get sheet
                        enigma.app.getObject($scope.sheetId).then(function (sheet) {
                            // Create child
                            $scope.sheet = sheet;
                                // Get Sheet properties
                                $scope.sheet.getProperties().then(function (sheetProp) {
                                    $scope.sheetProp = sheetProp;
                                    // Get Cell Layout of The Extension
                                    getCellLayout(sheetProp.cells).then(function (cells) {
                                        $scope.extCells = cells;
                                        // Get Cell Layout of the Viz
                                        getObjectCell($scope.vizObject).then(function (cells) {
                                            $scope.vizCells = cells;
                                            // Create cells list
                                            createNewCells($scope.extCells.colspan,
                                                $scope.extCells.rowspan,
                                                $scope.vizCells.colspan,
                                                $scope.vizCells.rowspan,
                                                $scope.layout.qHyperCube.qDataPages[0].qMatrix.length,
                                                $scope.extCells.col,
                                                $scope.extCells.row
                                            ).then(function (cellList) {
                                                $scope.cellList = cellList;
                                                // Loop through cells and create objects
                                                app.visualization.create('piechart', ["score", "=Count(distinct matchLinkId)"], $scope.vizProp).then(function(vis){
                                                    console.log(vis);
                                                    var container = document.getElementById("container");
                                                    vis.show(container);
                                                })
                                                /* for(var i=0; i<$scope.cellList.length;i++) {
                                                    createTrellisObject($scope.vizProp, i);
                                                } */
                                            })
                                        })
                                    })
                                    /* sheetProp.cells.push(cell);
                                    // Update and set sheet properties with new cells
                                    $scope.sheet.setProperties($scope.sheetProp); */
                                })
                        })
                    })
                })

            })
        })
    }
}]