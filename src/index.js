import initialProperties from './initial-properties.js';
import template from './template.html';
import definition from './definition.js';
import controller from './controller.js';
import localCSS from './style.css'; // eslint-disable-line no-unused-vars

export default {
  initialProperties: initialProperties,
  template: template,
  definition: definition,
  controller: controller,
  paint: function () {
    const scope = this.$scope;
    this.$scope.isInEdit = this.options.interactionState == 2;
    this.backendApi.getProperties().then(function (props) {
      scope.sortCriterias = props.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias;
      scope.nullSuppression = props.qHyperCubeDef.qDimensions[0].qNullSuppression;
    });
  },
  support: {
    snapshot: false,
    export: true,
    exportData: true
  }
};
