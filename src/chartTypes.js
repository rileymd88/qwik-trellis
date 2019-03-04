export default
    [
        {
            "name": "map",
            "type": "measureBased",
            "paths": [{
                "loopsCount": 1,
                "path1": "gaLayers",
                "libCheck": "gaLayers[path1].size.expression.type == 'libraryItem'",
                "def": "gaLayers[path1].size.expression.key",
                "libDef": "gaLayers[path1].size.expression.key",
                "libDefMes": "gaLayers[path1].size.expression.type = 'expression'"
            },
            {
                "loopsCount": 1,
                "path1": "gaLayers",
                "libCheck": "gaLayers[path1].color.expression.type == 'libraryItem'",
                "def": "gaLayers[path1].color.expression.key",
                "libDef": "gaLayers[path1].color.expression.key",
                "libDefMes": "gaLayers[path1].color.expression.type = 'expression'"
            },
            {
                "loopsCount": 2,
                "path1": "gaLayers",
                "path2": "gaLayers[path1].qHyperCubeDef.qDimensions",
                "libCheck": "gaLayers[path1].qHyperCubeDef.qDimensions[path2].qAttributeExpressions.qLibraryId.length > 1",
                "def": "gaLayers[path1].qHyperCubeDef.qDimensions[path2].qAttributeExpressions.qExpression",
                "libDef": "gaLayers[path1].qHyperCubeDef.qDimensions[path2].qAttributeExpressions.qLibraryId",
                "libDefMes": "gaLayers[path1].qHyperCubeDef.qDimensions[path2].qAttributeExpressions.qLibraryId = ''"
            }
            ]
        }
    ];