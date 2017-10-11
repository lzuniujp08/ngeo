goog.provide('gmf.wmsgrouptreeComponent');

goog.require('gmf');


/**
 * @private
 */
gmf.WmsgrouptreeController = class {

  /**
   * @private
   * @struct
   * @ngInject
   * @ngdoc controller
   * @ngname GmfWmsgrouptreeController
   */
  constructor() {

    // Binding properties

    /**
     * @type {!gmfx.datasource.WMSGroup}
     * @export
     */
    this.wmsGroup;
  }

  /**
   * Called on initialization of the component.
   */
  $onInit() {
  }

  /**
   * @export
   */
  toggle() {
    console.log('toogle');
  }
};


gmf.module.component('gmfWmsgrouptree', {
  bindings: {
    'wmsGroup': '<'
  },
  controller: gmf.WmsgrouptreeController,
  templateUrl: () => `${gmf.baseTemplateUrl}/wmsgrouptree.html`
});
