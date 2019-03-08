import initialProperties from './initial-properties.js';
import template from './template.html';
import definition from './definition.js';
import controller from './controller.js';
import paint from './paint.js';
import localCSS from './style.css';

export default window.define(['qlik'], function(qlik) {
  return {
    initialProperties: initialProperties,
    template: template,
    definition: definition,
    controller: controller,
    paint: paint,
    support: {
      snapshot: true, //snapshot - include in story
      export: true,   //export to PDF, PowerPoint and image
      exportData: true //export data to excel 
    }
  }
})