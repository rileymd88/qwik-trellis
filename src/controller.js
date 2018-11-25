var qlik = window.require('qlik');

export default ['$scope', '$element', function ($scope, $element) {
    var enigma = $scope.component.model.enigmaModel;
    var cell = {
        "name": "TEpnXZp",
        "type": "VizlibTable",
        "col": 0,
        "row": 0,
        "colspan": 8,
        "rowspan": 7
    };


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
        return new Promise(function (resolve, reject) {
            // Calcs
            var blocks = blockColSize * blockRowSize;
            var shapeSize = colSize * rowSize;
            var howManyBlocks = shapeCount * shapeSize;

            // Create blank array and other vars
            var cells = [];
            var rowCount = 1;

            // Check to ensure blocks fit
            console.log(blocks, howManyBlocks);
            if (blocks >= howManyBlocks && blockColSize >= colSize && blockRowSize >= rowSize) {
                // Loop 12 times and create shapes
                for (var i = 0; i < shapeCount; i++) {
                    // Add results to array
                    cells.push({ col: col, row: row, colSpan: colSize, rowSpan: rowSize });
                    // Increment col and row arrays
                    if (col + colSize < blockColSize) {
                        col = col + colSize;
                    }
                    else {
                        col = 0;
                        row = rowCount * rowSize;
                        rowCount++
                    }
                }
                // Log results to browser console
                console.log('cells', cells);
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
                            $scope.sheet.createChild($scope.vizProp).then(function (reply) {
                                cell.name = reply.id;
                                // Get Sheet properties
                                $scope.sheet.getProperties().then(function (sheetProp) {
                                    // Get Cell Layout of The Extension
                                    getCellLayout(sheetProp.cells).then(function (cells) {
                                        // Create new cells
                                        createNewCells(cells, $scope.vizObject);
                                    })
                                    sheetProp.cells.push(cell);
                                    // Update and set sheet properties with new cells
                                    $scope.sheetProp = sheetProp;
                                    $scope.sheet.setProperties($scope.sheetProp);
                                })
                            }).catch(function (err) {
                            });
                        })
                    })
                })

            })
        })
    }
}]