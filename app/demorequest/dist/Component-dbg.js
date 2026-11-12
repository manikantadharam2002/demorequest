  sap.ui.define([
    "sap/ui/core/UIComponent",
    "demorequest/demorequest/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("demorequest.demorequest.Component", {

        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Set the device model
            this.setModel(
                models.createDeviceModel(),
                "device"
            );

            // Create local JSON model
            const oLocalModel = models.createLocalJson();

            // Set local model
            this.setModel(
                oLocalModel,
                "projectModel"
            );

            // Optional: keep the same model under the existing name
            this.setModel(
                oLocalModel,
                "zRequestModel"
            );

            // Enable routing
            this.getRouter().initialize();
        }
    });
});