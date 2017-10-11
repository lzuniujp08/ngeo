goog.provide('gmf.wmsgrouptreeComponent');

goog.require('gmf');


/**
 * @private
 */
gmf.WmsgrouptreeController = class {

  /**
   * @param {!angular.Scope} $scope Angular scope.
   * @private
   * @struct
   * @ngInject
   * @ngdoc controller
   * @ngname GmfWmsgrouptreeController
   */
  constructor($scope) {

    // Binding properties

    /**
     * @type {!gmfx.datasource.WMSGroup}
     * @export
     */
    this.wmsGroup;


    // Injected properties

    /**
     * @type {!angular.Scope}
     * @private
     */
    this.scope_ = $scope;
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

  /**
   * @param {ngeo.datasource.OGC} dataSource Data source to toggle the
   * visibility
   * @export
   */
  toggleDataSource(dataSource) {
    dataSource.visible = !dataSource.visible;
  }
};


gmf.module.component('gmfWmsgrouptree', {
  bindings: {
    'wmsGroup': '<'
  },
  controller: gmf.WmsgrouptreeController,
  templateUrl: () => `${gmf.baseTemplateUrl}/wmsgrouptree.html`
});
