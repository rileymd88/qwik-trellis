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
                "libDefMes": "gaLayers[path1].size.expression.type = 'expression'",
                "generalCheck": "gaLayers[path1].size.expression"
            },
            {
                "loopsCount": 1,
                "path1": "gaLayers",
                "libCheck": "gaLayers[path1].color.expression.type == 'libraryItem'",
                "def": "gaLayers[path1].color.expression.key",
                "libDef": "gaLayers[path1].color.expression.key",
                "libDefMes": "gaLayers[path1].color.expression.type = 'expression'",
                "generalCheck": "gaLayers[path1].color.expression"
            },
            {
                "loopsCount": 1,
                "path1": "gaLayers",
                "libCheck": "gaLayers[path1].color.byMeasureDef.type == 'libraryItem'",
                "def": "gaLayers[path1].color.byMeasureDef.key",
                "libDef": "gaLayers[path1].color.byMeasureDef.key",
                "libDefMes": "gaLayers[path1].color.byMeasureDef.type = 'expression'",
                "generalCheck": "gaLayers[path1].color.byMeasureDef"
            },
            {
                "loopsCount": 2,
                "path1": "gaLayers",
                "path2": "gaLayers[path1].qHyperCubeDef.qDimensions",
                "libCheck": "gaLayers[path1].qHyperCubeDef.qDimensions[path2].qAttributeExpressions.qLibraryId.length > 1",
                "def": "gaLayers[path1].qHyperCubeDef.qDimensions[path2].qAttributeExpressions.qExpression",
                "libDef": "gaLayers[path1].qHyperCubeDef.qDimensions[path2].qAttributeExpressions.qLibraryId",
                "libDefMes": "gaLayers[path1].qHyperCubeDef.qDimensions[path2].qAttributeExpressions.qLibraryId = ''",
                "generalCheck": "gaLayers[path1].qHyperCubeDef.qDimensions"
            }
            ],
            "autoRange": false,
            "showAll": false
        },
        {
            "name": "default",
            "type": "measureBased",
            "paths": [
                {
                    "loopsCount": 1,
                    "path1": "qHyperCubeDef.qMeasures",
                    "libCheck": "qHyperCubeDef.qMeasures[path1].qLibraryId.length > 1",
                    "def": "qHyperCubeDef.qMeasures[path1].qDef.qDef",
                    "libDef": "qHyperCubeDef.qMeasures[path1].qLibraryId",
                    "libDefMes": "qHyperCubeDef.qMeasures[path1].qLibraryId = ''",
                    "generalCheck": "qHyperCubeDef.qMeasures[path1]"
                }
            ],
            "autoRange": true,
            "showAll": true
        },
        {
            "name": "histogram",
            "type": "dimensionBased",
            "paths": [
                {
                    "loopsCount": 1,
                    "path1": "qHyperCubeDef.qDimensions",
                    "libCheck": "qHyperCubeDef.qDimensions[path1].qLibraryId.length > 1",
                    "def": "qHyperCubeDef.qDimensions[path1].qDef.qFieldDefs[0]",
                    "libDef": "qHyperCubeDef.qDimensions[path1].qLibraryId",
                    "libDefMes": "qHyperCubeDef.qDimensions[path1].qLibraryId = ''",
                    "generalCheck": "qHyperCubeDef.qDimensions[path1]"
                }
            ],
            "autoRange": true,
            "showAll": false
        },
        {
            "name": "boxplot",
            "type": "measureBased",
            "paths": [
                {
                    "loopsCount": 1,
                    "path1": "boxplotDef.qHyperCubeDef.qMeasures",
                    "libCheck": "boxplotDef.qHyperCubeDef.qMeasures[path1].qLibraryId.length > 1",
                    "def": "boxplotDef.qHyperCubeDef.qMeasures[path1].qDef.qDef",
                    "libDef": "boxplotDef.qHyperCubeDef.qMeasures[path1].qLibraryId",
                    "libDefMes": "boxplotDef.qHyperCubeDef.qMeasures[path1].qLibraryId = ''",
                    "generalCheck": "boxplotDef.qHyperCubeDef.qMeasures[path1]"
                }
            ],
            "autoRange": false,
            "showAll": false
        }
    ];